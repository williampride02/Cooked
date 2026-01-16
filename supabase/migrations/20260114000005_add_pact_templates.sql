-- Pact Templates Migration
-- Allows users to save their own pact templates

-- User templates table
CREATE TABLE user_pact_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  description TEXT CHECK (char_length(description) <= 200),
  icon TEXT NOT NULL DEFAULT '\u{2B50}', -- Default star emoji
  category TEXT DEFAULT 'custom' CHECK (category IN ('fitness', 'health', 'productivity', 'creative', 'custom')),
  suggested_frequency TEXT NOT NULL CHECK (suggested_frequency IN ('daily', 'weekly', 'custom')),
  suggested_frequency_days INTEGER[], -- For custom frequency: [1,3,5] = Mon,Wed,Fri
  suggested_roast_level INTEGER DEFAULT 2 CHECK (suggested_roast_level BETWEEN 1 AND 3),
  suggested_proof_required TEXT DEFAULT 'optional' CHECK (suggested_proof_required IN ('none', 'optional', 'required')),
  suggested_pact_type TEXT DEFAULT 'individual' CHECK (suggested_pact_type IN ('individual', 'group', 'relay')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX idx_user_pact_templates_user ON user_pact_templates(user_id);

-- Enable RLS
ALTER TABLE user_pact_templates ENABLE ROW LEVEL SECURITY;

-- Users can read their own templates
CREATE POLICY "Users can read own templates"
  ON user_pact_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
  ON user_pact_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON user_pact_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON user_pact_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_pact_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_pact_templates_updated_at
  BEFORE UPDATE ON user_pact_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_user_pact_templates_updated_at();
