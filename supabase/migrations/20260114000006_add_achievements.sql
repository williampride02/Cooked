-- Achievements System Migration
-- Adds tables for tracking user achievements and badges

-- ============================================
-- ACHIEVEMENT DEFINITIONS TABLE
-- ============================================
-- Stores the static definition of all available achievements
CREATE TABLE achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji representation
  category TEXT NOT NULL CHECK (category IN ('streak', 'checkin', 'roast', 'social', 'comeback')),
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak_days', 'total_checkins', 'total_roasts', 'roast_reactions', 'invites_sent', 'group_created', 'group_filled', 'comeback_streak')),
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
-- Tracks which achievements each user has unlocked
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES achievement_definitions(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- Current progress toward the achievement
  notified BOOLEAN DEFAULT FALSE, -- Has user been notified?
  UNIQUE (user_id, achievement_id)
);

-- ============================================
-- USER STATS TABLE
-- ============================================
-- Tracks aggregate stats for achievement progress
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_folds INTEGER DEFAULT 0,
  total_roasts INTEGER DEFAULT 0,
  total_roast_reactions_received INTEGER DEFAULT 0,
  invites_sent INTEGER DEFAULT 0,
  groups_created INTEGER DEFAULT 0,
  groups_filled INTEGER DEFAULT 0, -- Groups where user helped reach max members
  comeback_count INTEGER DEFAULT 0, -- Times recovered from fold streak
  last_checkin_date DATE,
  last_fold_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_user_stats_streak ON user_stats(current_streak DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Achievement definitions are public read
CREATE POLICY "Anyone can read achievement definitions"
  ON achievement_definitions FOR SELECT
  USING (true);

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own achievements (via triggers)
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read other users' achievements (for comparing/viewing)
CREATE POLICY "Users can read group members achievements"
  ON user_achievements FOR SELECT
  USING (
    user_id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Users can read/update their own stats
CREATE POLICY "Users can read own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- SEED ACHIEVEMENT DEFINITIONS
-- ============================================
INSERT INTO achievement_definitions (id, name, description, icon, category, tier, requirement_type, requirement_value, xp_reward, sort_order) VALUES
-- Streak achievements
('streak_7', 'Week Warrior', 'Maintain a 7-day check-in streak', '\u{1F525}', 'streak', 'bronze', 'streak_days', 7, 100, 1),
('streak_30', 'Monthly Master', 'Maintain a 30-day check-in streak', '\u{1F31F}', 'streak', 'silver', 'streak_days', 30, 500, 2),
('streak_100', 'Centurion', 'Maintain a 100-day check-in streak', '\u{1F3C6}', 'streak', 'gold', 'streak_days', 100, 2000, 3),
('streak_365', 'Year of Commitment', 'Maintain a 365-day check-in streak', '\u{1F451}', 'streak', 'platinum', 'streak_days', 365, 10000, 4),

-- Check-in milestones
('checkins_10', 'Getting Started', 'Complete 10 check-ins', '\u{2705}', 'checkin', 'bronze', 'total_checkins', 10, 50, 5),
('checkins_50', 'Dedicated', 'Complete 50 check-ins', '\u{1F4AA}', 'checkin', 'silver', 'total_checkins', 50, 200, 6),
('checkins_100', 'Committed', 'Complete 100 check-ins', '\u{1F3AF}', 'checkin', 'gold', 'total_checkins', 100, 500, 7),
('checkins_500', 'Unstoppable', 'Complete 500 check-ins', '\u{1F680}', 'checkin', 'platinum', 'total_checkins', 500, 2500, 8),

-- Roast achievements
('first_roast', 'Roast Rookie', 'Post your first roast response', '\u{1F336}', 'roast', 'bronze', 'total_roasts', 1, 25, 9),
('roasts_10', 'Roast Regular', 'Post 10 roast responses', '\u{1F525}', 'roast', 'silver', 'total_roasts', 10, 100, 10),
('roasts_50', 'Roast Master', 'Post 50 roast responses', '\u{1F9D1}\u{200D}\u{1F373}', 'roast', 'gold', 'total_roasts', 50, 400, 11),
('savage_roaster', 'Savage Roaster', 'Get 50 reactions on your roasts', '\u{1F480}', 'roast', 'platinum', 'roast_reactions', 50, 1000, 12),

-- Social achievements
('first_invite', 'Recruiter', 'Invite a friend to a group', '\u{1F91D}', 'social', 'bronze', 'invites_sent', 1, 50, 13),
('invites_5', 'Popular', 'Invite 5 friends to groups', '\u{1F38A}', 'social', 'silver', 'invites_sent', 5, 200, 14),
('group_creator', 'Founder', 'Create your first group', '\u{1F3E0}', 'social', 'bronze', 'group_created', 1, 100, 15),
('group_filled', 'Community Builder', 'Fill a group to max capacity', '\u{1F389}', 'social', 'gold', 'group_filled', 1, 500, 16),

-- Comeback achievements
('comeback_1', 'Phoenix Rising', 'Recover from a fold with 3 consecutive check-ins', '\u{1F426}\u{200D}\u{1F525}', 'comeback', 'bronze', 'comeback_streak', 1, 100, 17),
('comeback_3', 'Resilient', 'Complete 3 comeback recoveries', '\u{1F4AA}', 'comeback', 'silver', 'comeback_streak', 3, 300, 18),
('comeback_10', 'Unbreakable', 'Complete 10 comeback recoveries', '\u{1F48E}', 'comeback', 'gold', 'comeback_streak', 10, 1000, 19);

-- ============================================
-- FUNCTIONS FOR ACHIEVEMENT TRACKING
-- ============================================

-- Function to update user stats after check-in
CREATE OR REPLACE FUNCTION update_user_stats_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_last_checkin DATE;
  v_current_streak INTEGER;
  v_is_comeback BOOLEAN := FALSE;
BEGIN
  -- Get or create user stats
  INSERT INTO user_stats (user_id, current_streak, total_checkins, last_checkin_date)
  VALUES (NEW.user_id, 0, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current stats
  SELECT current_streak, last_checkin_date INTO v_current_streak, v_last_checkin
  FROM user_stats WHERE user_id = NEW.user_id;

  IF NEW.status = 'success' THEN
    -- Check if this is a comeback (had a fold within last 7 days and now 3 consecutive successes)
    IF v_last_checkin IS NOT NULL AND
       EXISTS (
         SELECT 1 FROM check_ins
         WHERE user_id = NEW.user_id
         AND status = 'fold'
         AND check_in_date >= NEW.check_in_date - INTERVAL '7 days'
       ) AND
       (SELECT COUNT(*) FROM check_ins
        WHERE user_id = NEW.user_id
        AND status = 'success'
        AND check_in_date >= v_last_checkin) >= 2 THEN
      v_is_comeback := TRUE;
    END IF;

    -- Update stats for successful check-in
    UPDATE user_stats
    SET
      total_checkins = total_checkins + 1,
      current_streak = CASE
        WHEN last_checkin_date IS NULL THEN 1
        WHEN last_checkin_date = NEW.check_in_date - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_checkin_date = NEW.check_in_date THEN current_streak -- Same day, no change
        ELSE 1 -- Streak broken, start fresh
      END,
      longest_streak = GREATEST(longest_streak,
        CASE
          WHEN last_checkin_date IS NULL THEN 1
          WHEN last_checkin_date = NEW.check_in_date - INTERVAL '1 day' THEN current_streak + 1
          ELSE 1
        END
      ),
      comeback_count = CASE WHEN v_is_comeback THEN comeback_count + 1 ELSE comeback_count END,
      last_checkin_date = NEW.check_in_date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    -- Update stats for fold
    UPDATE user_stats
    SET
      total_folds = total_folds + 1,
      current_streak = 0,
      last_fold_date = NEW.check_in_date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats after roast response
CREATE OR REPLACE FUNCTION update_user_stats_on_roast()
RETURNS TRIGGER AS $$
BEGIN
  -- Update roast count
  INSERT INTO user_stats (user_id, total_roasts)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_roasts = user_stats.total_roasts + 1,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats when reaction is added to their roast
CREATE OR REPLACE FUNCTION update_user_stats_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_roast_user_id UUID;
BEGIN
  -- Only track reactions on roast_responses
  IF NEW.target_type = 'roast_response' THEN
    -- Get the user who made the roast
    SELECT user_id INTO v_roast_user_id
    FROM roast_responses WHERE id = NEW.target_id;

    IF v_roast_user_id IS NOT NULL THEN
      INSERT INTO user_stats (user_id, total_roast_reactions_received)
      VALUES (v_roast_user_id, 1)
      ON CONFLICT (user_id) DO UPDATE
      SET total_roast_reactions_received = user_stats.total_roast_reactions_received + 1,
          updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update group stats when group is created
CREATE OR REPLACE FUNCTION update_user_stats_on_group_create()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO user_stats (user_id, groups_created)
    VALUES (NEW.created_by, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET groups_created = user_stats.groups_created + 1,
        updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if group is filled and update stats
CREATE OR REPLACE FUNCTION update_user_stats_on_group_fill()
RETURNS TRIGGER AS $$
DECLARE
  v_member_count INTEGER;
  v_group_id UUID;
BEGIN
  v_group_id := NEW.group_id;

  -- Count current members
  SELECT COUNT(*) INTO v_member_count
  FROM group_members WHERE group_id = v_group_id;

  -- If group is now full (10 members)
  IF v_member_count = 10 THEN
    -- Credit all current members with the "group filled" stat
    UPDATE user_stats
    SET groups_filled = groups_filled + 1,
        updated_at = NOW()
    WHERE user_id IN (SELECT user_id FROM group_members WHERE group_id = v_group_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER trigger_update_stats_on_checkin
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_checkin();

CREATE TRIGGER trigger_update_stats_on_roast
  AFTER INSERT ON roast_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_roast();

CREATE TRIGGER trigger_update_stats_on_reaction
  AFTER INSERT ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_reaction();

CREATE TRIGGER trigger_update_stats_on_group_create
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_group_create();

CREATE TRIGGER trigger_update_stats_on_group_fill
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_group_fill();
