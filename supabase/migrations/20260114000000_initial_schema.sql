-- Cooked Initial Schema
-- Generated from architecture.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Clean up any partial migration artifacts
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 20),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 30),
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(3), 'hex'),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members junction table
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  settings JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Pacts table
CREATE TABLE pacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  description TEXT CHECK (char_length(description) <= 200),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  frequency_days INTEGER[], -- For custom: [1,3,5] = Mon,Wed,Fri
  roast_level INTEGER DEFAULT 2 CHECK (roast_level BETWEEN 1 AND 3),
  proof_required TEXT DEFAULT 'none' CHECK (proof_required IN ('none', 'optional', 'required')),
  pact_type TEXT DEFAULT 'individual' CHECK (pact_type IN ('individual', 'group', 'relay')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pact participants
CREATE TABLE pact_participants (
  pact_id UUID REFERENCES pacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (pact_id, user_id)
);

-- Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id UUID REFERENCES pacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'fold')),
  excuse TEXT,
  proof_url TEXT,
  check_in_date DATE NOT NULL,
  is_late BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pact_id, user_id, check_in_date)
);

-- Roast threads table
CREATE TABLE roast_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'muted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Roast responses
CREATE TABLE roast_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES roast_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'gif', 'image')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions (polymorphic)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('check_in', 'roast_response')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('skull', 'cap', 'clown', 'salute', 'fire', 'clap')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (target_type, target_id, user_id)
);

-- Weekly recaps
CREATE TABLE weekly_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, week_start)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_pacts_group ON pacts(group_id) WHERE status = 'active';
CREATE INDEX idx_check_ins_pact_date ON check_ins(pact_id, check_in_date DESC);
CREATE INDEX idx_check_ins_user ON check_ins(user_id);
CREATE INDEX idx_roast_responses_thread ON roast_responses(thread_id);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pact_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_recaps ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to read other users in their groups (for display names, avatars)
CREATE POLICY "Users can read group members profiles"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Groups policies
CREATE POLICY "Members can read their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups"
  ON groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can read groups by invite code (for joining)
CREATE POLICY "Anyone can read groups by invite code"
  ON groups FOR SELECT
  USING (true);

-- Group members policies
CREATE POLICY "Can see group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage group members"
  ON group_members FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Pacts policies
CREATE POLICY "Members can read group pacts"
  ON pacts FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create pacts"
  ON pacts FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update pacts"
  ON pacts FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR created_by = auth.uid()
  );

-- Pact participants policies
CREATE POLICY "Members can see pact participants"
  ON pact_participants FOR SELECT
  USING (
    pact_id IN (
      SELECT p.id FROM pacts p
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join pacts"
  ON pact_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND pact_id IN (
      SELECT p.id FROM pacts p
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave pacts"
  ON pact_participants FOR DELETE
  USING (user_id = auth.uid());

-- Check-ins policies
CREATE POLICY "Members can read group check-ins"
  ON check_ins FOR SELECT
  USING (
    pact_id IN (
      SELECT p.id FROM pacts p
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND pact_id IN (
      SELECT pact_id FROM pact_participants WHERE user_id = auth.uid()
    )
  );

-- Roast threads policies
CREATE POLICY "Members can read roast threads"
  ON roast_threads FOR SELECT
  USING (
    check_in_id IN (
      SELECT ci.id FROM check_ins ci
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create roast threads"
  ON roast_threads FOR INSERT
  WITH CHECK (
    check_in_id IN (
      SELECT ci.id FROM check_ins ci
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Thread owner can update status"
  ON roast_threads FOR UPDATE
  USING (
    check_in_id IN (
      SELECT id FROM check_ins WHERE user_id = auth.uid()
    )
  );

-- Roast responses policies
CREATE POLICY "Members can read roast responses"
  ON roast_responses FOR SELECT
  USING (
    thread_id IN (
      SELECT rt.id FROM roast_threads rt
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create roast responses"
  ON roast_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND thread_id IN (
      SELECT rt.id FROM roast_threads rt
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can pin roasts"
  ON roast_responses FOR UPDATE
  USING (
    thread_id IN (
      SELECT rt.id FROM roast_threads rt
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Reactions policies
CREATE POLICY "Members can read reactions"
  ON reactions FOR SELECT
  USING (true); -- Reactions are public within the app context

CREATE POLICY "Users can add reactions"
  ON reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own reactions"
  ON reactions FOR DELETE
  USING (user_id = auth.uid());

-- Weekly recaps policies
CREATE POLICY "Members can read group recaps"
  ON weekly_recaps FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Run these in the Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('roasts', 'roasts', false);
