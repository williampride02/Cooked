-- Add polls feature for Nuclear roast level (roast_level = 3)

-- Polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES roast_threads(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 5 AND 200),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closes_at TIMESTAMPTZ, -- Optional auto-close time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Poll options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL CHECK (char_length(option_text) BETWEEN 1 AND 100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes table
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Each user can only vote once per poll
  UNIQUE (poll_id, user_id)
);

-- Add 'poll' to roast_responses content_type
ALTER TABLE roast_responses
  DROP CONSTRAINT IF EXISTS roast_responses_content_type_check;

ALTER TABLE roast_responses
  ADD CONSTRAINT roast_responses_content_type_check
  CHECK (content_type IN ('text', 'gif', 'image', 'poll'));

-- Indexes
CREATE INDEX idx_polls_thread ON polls(thread_id);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Members can read polls in their groups"
  ON polls FOR SELECT
  USING (
    thread_id IN (
      SELECT rt.id FROM roast_threads rt
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create polls in Nuclear threads"
  ON polls FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND thread_id IN (
      SELECT rt.id FROM roast_threads rt
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts p ON ci.pact_id = p.id
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
        AND p.roast_level = 3
    )
  );

CREATE POLICY "Poll creator can update their polls"
  ON polls FOR UPDATE
  USING (created_by = auth.uid());

-- Poll options policies
CREATE POLICY "Members can read poll options"
  ON poll_options FOR SELECT
  USING (
    poll_id IN (
      SELECT p.id FROM polls p
      JOIN roast_threads rt ON p.thread_id = rt.id
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts pa ON ci.pact_id = pa.id
      JOIN group_members gm ON pa.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll creator can create options"
  ON poll_options FOR INSERT
  WITH CHECK (
    poll_id IN (
      SELECT id FROM polls WHERE created_by = auth.uid()
    )
  );

-- Poll votes policies
CREATE POLICY "Members can read poll votes"
  ON poll_votes FOR SELECT
  USING (
    poll_id IN (
      SELECT p.id FROM polls p
      JOIN roast_threads rt ON p.thread_id = rt.id
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts pa ON ci.pact_id = pa.id
      JOIN group_members gm ON pa.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote on open polls"
  ON poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND poll_id IN (
      SELECT p.id FROM polls p
      JOIN roast_threads rt ON p.thread_id = rt.id
      JOIN check_ins ci ON rt.check_in_id = ci.id
      JOIN pacts pa ON ci.pact_id = pa.id
      JOIN group_members gm ON pa.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
        AND p.status = 'open'
    )
  );

CREATE POLICY "Users can change their vote"
  ON poll_votes FOR DELETE
  USING (user_id = auth.uid());
