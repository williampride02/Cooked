-- Add relay_days column to pact_participants for relay pact day assignments
ALTER TABLE pact_participants 
ADD COLUMN IF NOT EXISTS relay_days INTEGER[];

-- Update RLS policy to allow pact creators to add participants
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can join pacts" ON pact_participants;

-- Create new policy that allows:
-- 1. Users to add themselves to pacts in their groups
-- 2. Pact creators to add other group members as participants
CREATE POLICY "Users can join pacts or creators can add participants"
  ON pact_participants FOR INSERT
  WITH CHECK (
    -- Case 1: User is adding themselves to a pact in their group
    (user_id = auth.uid() AND pact_id IN (
      SELECT p.id FROM pacts p
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    ))
    OR
    -- Case 2: User is the pact creator (can add any group member)
    (pact_id IN (
      SELECT p.id FROM pacts p
      WHERE p.created_by = auth.uid()
    ) AND user_id IN (
      -- Participant must be a member of the same group as the pact
      SELECT gm.user_id 
      FROM group_members gm
      JOIN pacts p ON gm.group_id = p.group_id
      WHERE p.id = pact_id
    ))
  );
