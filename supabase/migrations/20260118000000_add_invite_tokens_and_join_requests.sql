-- Migration: Add secure invite tokens and join request system
-- This migration adds:
-- 1. Long, unguessable invite_token to groups table
-- 2. group_join_requests table for manual code-based join requests
-- 3. SECURITY DEFINER functions for secure invite operations
-- 4. RLS policies for join requests

-- ============================================
-- 1. Add invite_token to groups table
-- ============================================

-- Add invite_token column (long, unguessable token)
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;

-- Add rotation tracking
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS invite_token_rotated_at TIMESTAMPTZ;

-- Generate invite_token for existing groups
UPDATE groups
SET invite_token = encode(extensions.gen_random_bytes(24), 'hex')
WHERE invite_token IS NULL;

-- Make invite_token NOT NULL after backfilling
ALTER TABLE groups
  ALTER COLUMN invite_token SET NOT NULL;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_groups_invite_token ON groups(invite_token);

-- ============================================
-- 2. Create group_join_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for join requests
-- Prevent duplicate pending requests per user/group
CREATE UNIQUE INDEX IF NOT EXISTS group_join_requests_pending_unique_idx
  ON group_join_requests (group_id, requester_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_join_requests_group ON group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester ON group_join_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON group_join_requests(status) WHERE status = 'pending';

-- ============================================
-- 3. SECURITY DEFINER Functions
-- ============================================

-- Function: Get group preview from invite token (public, no auth required)
CREATE OR REPLACE FUNCTION get_group_invite_preview(invite_token_param TEXT)
RETURNS TABLE (
  group_id UUID,
  name TEXT,
  member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    COUNT(gm.user_id)::BIGINT as member_count
  FROM groups g
  LEFT JOIN group_members gm ON g.id = gm.group_id
  WHERE g.invite_token = invite_token_param
  GROUP BY g.id, g.name;
END;
$$;

-- Function: Join group by invite token (requires auth)
-- Note: Using result_group_id instead of group_id to avoid ambiguous column reference
DROP FUNCTION IF EXISTS join_group_by_invite_token(TEXT);

CREATE FUNCTION join_group_by_invite_token(invite_token_param TEXT)
RETURNS TABLE (
  result_group_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group_id UUID;
  current_user_id UUID;
  existing_member_count INTEGER;
  max_members INTEGER := 10;
  token_prefix TEXT;
BEGIN
  -- Sanitize token for logging (first 10 chars only)
  token_prefix := LEFT(invite_token_param, 10);
  RAISE LOG '[JOIN_TOKEN] Function called with token: %...', token_prefix;
  
  -- Get current user
  current_user_id := auth.uid();
  RAISE LOG '[JOIN_TOKEN] auth.uid() = %', current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE LOG '[JOIN_TOKEN] No authenticated user, returning error';
    RETURN QUERY SELECT NULL::UUID AS result_group_id, FALSE AS success, 'You must be logged in to join a group'::TEXT AS message;
    RETURN;
  END IF;

  -- Find group by token
  SELECT id INTO target_group_id
  FROM groups
  WHERE invite_token = invite_token_param;
  
  RAISE LOG '[JOIN_TOKEN] Group lookup result: group_id = %', target_group_id;

  IF target_group_id IS NULL THEN
    RAISE LOG '[JOIN_TOKEN] Invalid invite token, returning error';
    RETURN QUERY SELECT NULL::UUID AS result_group_id, FALSE AS success, 'Invalid invite link'::TEXT AS message;
    RETURN;
  END IF;

  -- Check if already a member (fully qualify column references)
  IF EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = target_group_id AND gm.user_id = current_user_id
  ) THEN
    RAISE LOG '[JOIN_TOKEN] User % is already a member of group %', current_user_id, target_group_id;
    RETURN QUERY SELECT target_group_id AS result_group_id, TRUE AS success, 'You are already a member of this group'::TEXT AS message;
    RETURN;
  END IF;

  -- Check member count (fully qualify column reference)
  SELECT COUNT(*) INTO existing_member_count
  FROM group_members gm
  WHERE gm.group_id = target_group_id;
  
  RAISE LOG '[JOIN_TOKEN] Current member count: %, max: %', existing_member_count, max_members;

  IF existing_member_count >= max_members THEN
    RAISE LOG '[JOIN_TOKEN] Group is full, returning error';
    RETURN QUERY SELECT target_group_id AS result_group_id, FALSE AS success, 'This group is full (max 10 members)'::TEXT AS message;
    RETURN;
  END IF;

  -- Add user as member
  RAISE LOG '[JOIN_TOKEN] Adding user % to group % as member', current_user_id, target_group_id;
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (target_group_id, current_user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  
  RAISE LOG '[JOIN_TOKEN] Successfully added user to group, returning success';
  RETURN QUERY SELECT target_group_id AS result_group_id, TRUE AS success, 'Successfully joined group'::TEXT AS message;
END;
$$;

-- Function: Request to join by invite code (creates join request)
CREATE OR REPLACE FUNCTION request_group_join_by_invite_code(invite_code_param TEXT)
RETURNS TABLE (
  request_id UUID,
  group_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group_id UUID;
  current_user_id UUID;
  existing_request_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'You must be logged in to request to join a group'::TEXT;
    RETURN;
  END IF;

  -- Find group by invite_code
  SELECT id INTO target_group_id
  FROM groups
  WHERE invite_code = LOWER(invite_code_param);

  IF target_group_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Invalid invite code'::TEXT;
    RETURN;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_group_id AND user_id = current_user_id
  ) THEN
    RETURN QUERY SELECT NULL::UUID, target_group_id, FALSE, 'You are already a member of this group'::TEXT;
    RETURN;
  END IF;

  -- Check for existing pending request
  SELECT id INTO existing_request_id
  FROM group_join_requests
  WHERE group_id = target_group_id 
    AND requester_id = current_user_id 
    AND status = 'pending';

  IF existing_request_id IS NOT NULL THEN
    RETURN QUERY SELECT existing_request_id, target_group_id, TRUE, 'You already have a pending request for this group'::TEXT;
    RETURN;
  END IF;

  -- Create join request
  INSERT INTO group_join_requests (group_id, requester_id, status)
  VALUES (target_group_id, current_user_id, 'pending')
  RETURNING id INTO existing_request_id;

  RETURN QUERY SELECT existing_request_id, target_group_id, TRUE, 'Join request submitted. Waiting for admin approval.'::TEXT;
END;
$$;

-- Function: List join requests for a group (admin only)
CREATE OR REPLACE FUNCTION list_group_join_requests(group_id_param UUID)
RETURNS TABLE (
  id UUID,
  requester_id UUID,
  requester_name TEXT,
  requester_avatar_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Check if user is admin of this group
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_id_param
      AND user_id = current_user_id
      AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN;
  END IF;

  -- Return join requests
  RETURN QUERY
  SELECT 
    gjr.id,
    gjr.requester_id,
    u.display_name,
    u.avatar_url,
    gjr.status,
    gjr.created_at,
    gjr.reviewed_at,
    gjr.reviewed_by
  FROM group_join_requests gjr
  JOIN users u ON gjr.requester_id = u.id
  WHERE gjr.group_id = group_id_param
  ORDER BY gjr.created_at DESC;
END;
$$;

-- Function: Review join request (approve/deny) - admin only
CREATE OR REPLACE FUNCTION review_group_join_request(
  request_id_param UUID,
  decision TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  target_request RECORD;
  is_admin BOOLEAN;
  existing_member_count INTEGER;
  max_members INTEGER := 10;
BEGIN
  -- Validate decision
  IF decision NOT IN ('approved', 'denied') THEN
    RETURN QUERY SELECT FALSE, 'Invalid decision. Must be "approved" or "denied"'::TEXT;
    RETURN;
  END IF;

  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'You must be logged in'::TEXT;
    RETURN;
  END IF;

  -- Get the request
  SELECT * INTO target_request
  FROM group_join_requests
  WHERE id = request_id_param;

  IF target_request IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Join request not found'::TEXT;
    RETURN;
  END IF;

  -- Check if already reviewed
  IF target_request.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'This request has already been reviewed'::TEXT;
    RETURN;
  END IF;

  -- Check if user is admin of the group
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_request.group_id
      AND user_id = current_user_id
      AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN QUERY SELECT FALSE, 'Only group admins can review join requests'::TEXT;
    RETURN;
  END IF;

  -- If approving, check member count and add member
  IF decision = 'approved' THEN
    -- Check member count
    SELECT COUNT(*) INTO existing_member_count
    FROM group_members
    WHERE group_id = target_request.group_id;

    IF existing_member_count >= max_members THEN
      RETURN QUERY SELECT FALSE, 'Cannot approve: group is full (max 10 members)'::TEXT;
      RETURN;
    END IF;

    -- Add user as member (idempotent)
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (target_request.group_id, target_request.requester_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  -- Update request status
  UPDATE group_join_requests
  SET 
    status = decision,
    reviewed_at = NOW(),
    reviewed_by = current_user_id
  WHERE id = request_id_param;

  RETURN QUERY SELECT TRUE, format('Request %s successfully', decision)::TEXT;
END;
$$;

-- Function: Rotate invite token (admin only)
CREATE OR REPLACE FUNCTION rotate_group_invite_token(group_id_param UUID)
RETURNS TABLE (
  new_token TEXT,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  new_invite_token TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, FALSE, 'You must be logged in'::TEXT;
    RETURN;
  END IF;

  -- Check if user is admin of this group
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_id_param
      AND user_id = current_user_id
      AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN QUERY SELECT NULL::TEXT, FALSE, 'Only group admins can rotate invite tokens'::TEXT;
    RETURN;
  END IF;

  -- Generate new token
  new_invite_token := encode(extensions.gen_random_bytes(24), 'hex');

  -- Update group with new token
  UPDATE groups
  SET 
    invite_token = new_invite_token,
    invite_token_rotated_at = NOW()
  WHERE id = group_id_param;

  RETURN QUERY SELECT new_invite_token, TRUE, 'Invite token rotated successfully'::TEXT;
END;
$$;

-- ============================================
-- 4. RLS Policies for group_join_requests
-- ============================================

ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can read their own requests
CREATE POLICY "Users can read own join requests"
  ON group_join_requests FOR SELECT
  USING (requester_id = auth.uid());

-- Requesters can create their own requests (via function, but policy for safety)
CREATE POLICY "Users can create own join requests"
  ON group_join_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Admins can read all requests for their groups
CREATE POLICY "Admins can read group join requests"
  ON group_join_requests FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update requests for their groups (via function, but policy for safety)
CREATE POLICY "Admins can update group join requests"
  ON group_join_requests FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. Grant execute permissions on functions
-- ============================================

-- Public functions (no auth required)
GRANT EXECUTE ON FUNCTION get_group_invite_preview(TEXT) TO anon, authenticated;

-- Authenticated-only functions
GRANT EXECUTE ON FUNCTION join_group_by_invite_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION request_group_join_by_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_group_join_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION review_group_join_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_group_invite_token(UUID) TO authenticated;
