-- Cooked Demo Seed Data
-- Run this after migrations to populate with sample data

-- ============================================
-- DEMO USERS
-- ============================================

-- Note: These use fixed UUIDs so we can reference them
-- In production, users are created via Supabase Auth

INSERT INTO users (id, phone, display_name, avatar_url, settings) VALUES
  ('11111111-1111-1111-1111-111111111111', '+15551234567', 'Alex', NULL, '{"notifications": {"check_in_reminder": true, "someone_folded": true}}'),
  ('22222222-2222-2222-2222-222222222222', '+15552345678', 'Jordan', NULL, '{"notifications": {"check_in_reminder": true}}'),
  ('33333333-3333-3333-3333-333333333333', '+15553456789', 'Sam', NULL, '{}'),
  ('44444444-4444-4444-4444-444444444444', '+15554567890', 'Taylor', NULL, '{}'),
  ('55555555-5555-5555-5555-555555555555', '+15555678901', 'Casey', NULL, '{}');

-- ============================================
-- DEMO GROUPS
-- ============================================

INSERT INTO groups (id, name, invite_code, created_by, subscription_status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gym Bros', 'gym123', '11111111-1111-1111-1111-111111111111', 'free'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'No Junk Food Squad', 'nosnax', '22222222-2222-2222-2222-222222222222', 'premium');

-- ============================================
-- GROUP MEMBERS
-- ============================================

-- Gym Bros: Alex (admin), Jordan, Sam, Taylor
INSERT INTO group_members (group_id, user_id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'member');

-- No Junk Food Squad: Jordan (admin), Alex, Casey
INSERT INTO group_members (group_id, user_id, role) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'member'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'member');

-- ============================================
-- DEMO PACTS
-- ============================================

-- Gym Bros pacts
INSERT INTO pacts (id, group_id, name, description, frequency, roast_level, proof_required, pact_type, created_by, start_date, status) VALUES
  ('pact1111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hit the Gym', 'Work out at least 30 minutes', 'daily', 2, 'optional', 'individual', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '14 days', 'active'),
  ('pact2222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10K Steps', 'Walk 10,000 steps daily', 'daily', 1, 'none', 'individual', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '7 days', 'active');

-- No Junk Food Squad pacts
INSERT INTO pacts (id, group_id, name, description, frequency, roast_level, proof_required, pact_type, created_by, start_date, status) VALUES
  ('pact3333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'No Fast Food', 'Avoid fast food completely', 'daily', 3, 'none', 'group', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '21 days', 'active'),
  ('pact4444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Drink 8 Glasses', 'Drink 8 glasses of water', 'daily', 1, 'optional', 'individual', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '10 days', 'active');

-- ============================================
-- PACT PARTICIPANTS
-- ============================================

-- Hit the Gym participants
INSERT INTO pact_participants (pact_id, user_id) VALUES
  ('pact1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('pact1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('pact1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('pact1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444');

-- 10K Steps participants
INSERT INTO pact_participants (pact_id, user_id) VALUES
  ('pact2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('pact2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- No Fast Food participants
INSERT INTO pact_participants (pact_id, user_id) VALUES
  ('pact3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
  ('pact3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
  ('pact3333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555');

-- Drink 8 Glasses participants
INSERT INTO pact_participants (pact_id, user_id) VALUES
  ('pact4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
  ('pact4444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222');

-- ============================================
-- DEMO CHECK-INS (Last 7 days)
-- ============================================

-- Hit the Gym - recent check-ins
INSERT INTO check_ins (id, pact_id, user_id, status, excuse, check_in_date, created_at) VALUES
  -- Today
  ('ci-today-alex-gym', 'pact1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', NULL, CURRENT_DATE, NOW() - INTERVAL '2 hours'),
  ('ci-today-jordan-gym', 'pact1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'fold', 'Too tired from work', CURRENT_DATE, NOW() - INTERVAL '1 hour'),

  -- Yesterday
  ('ci-yest-alex-gym', 'pact1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', NULL, CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
  ('ci-yest-jordan-gym', 'pact1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'success', NULL, CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
  ('ci-yest-sam-gym', 'pact1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'fold', 'Slept through my alarm', CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),

  -- 2 days ago
  ('ci-2d-alex-gym', 'pact1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', NULL, CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),
  ('ci-2d-jordan-gym', 'pact1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'fold', 'Had a date', CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),
  ('ci-2d-sam-gym', 'pact1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'success', NULL, CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),
  ('ci-2d-taylor-gym', 'pact1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'success', NULL, CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),

  -- 3 days ago
  ('ci-3d-alex-gym', 'pact1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'fold', 'Back was sore', CURRENT_DATE - 3, NOW() - INTERVAL '3 days');

-- No Fast Food - recent check-ins
INSERT INTO check_ins (id, pact_id, user_id, status, excuse, check_in_date, created_at) VALUES
  -- Today
  ('ci-today-jordan-food', 'pact3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'success', NULL, CURRENT_DATE, NOW() - INTERVAL '3 hours'),
  ('ci-today-casey-food', 'pact3333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'fold', 'Caved and got McDonalds', CURRENT_DATE, NOW() - INTERVAL '30 minutes'),

  -- Yesterday
  ('ci-yest-jordan-food', 'pact3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'success', NULL, CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
  ('ci-yest-alex-food', 'pact3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'success', NULL, CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
  ('ci-yest-casey-food', 'pact3333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'success', NULL, CURRENT_DATE - 1, NOW() - INTERVAL '1 day');

-- ============================================
-- ROAST THREADS (for fold check-ins)
-- ============================================

INSERT INTO roast_threads (id, check_in_id, status, created_at) VALUES
  ('rt-jordan-gym-today', 'ci-today-jordan-gym', 'open', NOW() - INTERVAL '1 hour'),
  ('rt-sam-gym-yest', 'ci-yest-sam-gym', 'open', NOW() - INTERVAL '1 day'),
  ('rt-jordan-gym-2d', 'ci-2d-jordan-gym', 'closed', NOW() - INTERVAL '2 days'),
  ('rt-alex-gym-3d', 'ci-3d-alex-gym', 'closed', NOW() - INTERVAL '3 days'),
  ('rt-casey-food-today', 'ci-today-casey-food', 'open', NOW() - INTERVAL '30 minutes');

-- ============================================
-- ROAST RESPONSES
-- ============================================

-- Jordan's gym fold today - roasts from group
INSERT INTO roast_responses (id, thread_id, user_id, content_type, content, is_pinned, created_at) VALUES
  ('rr-1', 'rt-jordan-gym-today', '11111111-1111-1111-1111-111111111111', 'text', 'Too tired? The gym doesnt care about your feelings bro', false, NOW() - INTERVAL '55 minutes'),
  ('rr-2', 'rt-jordan-gym-today', '33333333-3333-3333-3333-333333333333', 'text', 'Netflix and excuses again huh', false, NOW() - INTERVAL '50 minutes'),
  ('rr-3', 'rt-jordan-gym-today', '44444444-4444-4444-4444-444444444444', 'gif', 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', false, NOW() - INTERVAL '45 minutes');

-- Sam's gym fold yesterday
INSERT INTO roast_responses (id, thread_id, user_id, content_type, content, is_pinned, created_at) VALUES
  ('rr-4', 'rt-sam-gym-yest', '11111111-1111-1111-1111-111111111111', 'text', 'Maybe set 5 alarms next time', false, NOW() - INTERVAL '23 hours'),
  ('rr-5', 'rt-sam-gym-yest', '22222222-2222-2222-2222-222222222222', 'text', 'Your alarm worked fine, your discipline didnt', true, NOW() - INTERVAL '22 hours');

-- Jordan's gym fold 2 days ago (closed thread)
INSERT INTO roast_responses (id, thread_id, user_id, content_type, content, is_pinned, created_at) VALUES
  ('rr-6', 'rt-jordan-gym-2d', '11111111-1111-1111-1111-111111111111', 'text', 'A DATE? Did you at least do some cardio?', false, NOW() - INTERVAL '47 hours'),
  ('rr-7', 'rt-jordan-gym-2d', '33333333-3333-3333-3333-333333333333', 'text', 'Priorities all wrong my guy', true, NOW() - INTERVAL '46 hours'),
  ('rr-8', 'rt-jordan-gym-2d', '44444444-4444-4444-4444-444444444444', 'text', 'The date could have waited, those gains cant', false, NOW() - INTERVAL '45 hours');

-- Alex's gym fold 3 days ago
INSERT INTO roast_responses (id, thread_id, user_id, content_type, content, is_pinned, created_at) VALUES
  ('rr-9', 'rt-alex-gym-3d', '22222222-2222-2222-2222-222222222222', 'text', 'Back was sore from carrying all those excuses', true, NOW() - INTERVAL '71 hours'),
  ('rr-10', 'rt-alex-gym-3d', '33333333-3333-3333-3333-333333333333', 'text', 'Admin folding... setting a great example', false, NOW() - INTERVAL '70 hours');

-- Casey's fast food fold today
INSERT INTO roast_responses (id, thread_id, user_id, content_type, content, is_pinned, created_at) VALUES
  ('rr-11', 'rt-casey-food-today', '22222222-2222-2222-2222-222222222222', 'text', 'McDonalds really??? You couldnt even cheat with something good?', false, NOW() - INTERVAL '25 minutes'),
  ('rr-12', 'rt-casey-food-today', '11111111-1111-1111-1111-111111111111', 'text', 'Im lovin it... watching you fail', false, NOW() - INTERVAL '20 minutes'),
  ('rr-13', 'rt-casey-food-today', '22222222-2222-2222-2222-222222222222', 'gif', 'https://media.giphy.com/media/xUPGcdeU3wvdNPa1Py/giphy.gif', false, NOW() - INTERVAL '15 minutes');

-- ============================================
-- REACTIONS
-- ============================================

-- Reactions on check-ins
INSERT INTO reactions (target_type, target_id, user_id, emoji) VALUES
  ('check_in', 'ci-today-alex-gym', '22222222-2222-2222-2222-222222222222', 'fire'),
  ('check_in', 'ci-today-alex-gym', '33333333-3333-3333-3333-333333333333', 'salute'),
  ('check_in', 'ci-today-jordan-gym', '11111111-1111-1111-1111-111111111111', 'skull'),
  ('check_in', 'ci-today-jordan-gym', '33333333-3333-3333-3333-333333333333', 'clown'),
  ('check_in', 'ci-today-jordan-gym', '44444444-4444-4444-4444-444444444444', 'skull'),
  ('check_in', 'ci-today-casey-food', '22222222-2222-2222-2222-222222222222', 'skull'),
  ('check_in', 'ci-today-casey-food', '11111111-1111-1111-1111-111111111111', 'clown');

-- Reactions on roast responses
INSERT INTO reactions (target_type, target_id, user_id, emoji) VALUES
  ('roast_response', 'rr-1', '33333333-3333-3333-3333-333333333333', 'fire'),
  ('roast_response', 'rr-2', '11111111-1111-1111-1111-111111111111', 'skull'),
  ('roast_response', 'rr-5', '11111111-1111-1111-1111-111111111111', 'fire'),
  ('roast_response', 'rr-5', '44444444-4444-4444-4444-444444444444', 'fire'),
  ('roast_response', 'rr-9', '33333333-3333-3333-3333-333333333333', 'skull'),
  ('roast_response', 'rr-9', '44444444-4444-4444-4444-444444444444', 'fire'),
  ('roast_response', 'rr-12', '22222222-2222-2222-2222-222222222222', 'skull');

-- ============================================
-- WEEKLY RECAP (Last week)
-- ============================================

INSERT INTO weekly_recaps (group_id, week_start, week_end, data) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   CURRENT_DATE - INTERVAL '7 days',
   CURRENT_DATE - INTERVAL '1 day',
   '{
     "total_check_ins": 28,
     "success_rate": 75,
     "total_folds": 7,
     "total_roasts": 15,
     "awards": {
       "most_consistent": {"user_id": "11111111-1111-1111-1111-111111111111", "display_name": "Alex", "completion_rate": 86},
       "biggest_fold": {"user_id": "22222222-2222-2222-2222-222222222222", "display_name": "Jordan", "fold_count": 3},
       "roast_mvp": {"user_id": "33333333-3333-3333-3333-333333333333", "display_name": "Sam", "roast_count": 8},
       "excuse_hall_of_fame": {"user_id": "22222222-2222-2222-2222-222222222222", "display_name": "Jordan", "excuse": "Had a date"}
     },
     "leaderboard": [
       {"user_id": "11111111-1111-1111-1111-111111111111", "display_name": "Alex", "completion_rate": 86, "check_ins": 6, "folds": 1},
       {"user_id": "44444444-4444-4444-4444-444444444444", "display_name": "Taylor", "completion_rate": 80, "check_ins": 4, "folds": 1},
       {"user_id": "33333333-3333-3333-3333-333333333333", "display_name": "Sam", "completion_rate": 71, "check_ins": 5, "folds": 2},
       {"user_id": "22222222-2222-2222-2222-222222222222", "display_name": "Jordan", "completion_rate": 57, "check_ins": 4, "folds": 3}
     ],
     "highlights": {
       "longest_streak": {"user_id": "11111111-1111-1111-1111-111111111111", "display_name": "Alex", "streak": 5},
       "best_roast": {"response_id": "rr-9", "user_id": "22222222-2222-2222-2222-222222222222", "display_name": "Jordan", "content": "Back was sore from carrying all those excuses", "reactions": 4}
     }
   }'::jsonb);

-- ============================================
-- NOTE: Run this command to log in as a demo user
-- ============================================
-- To test the app, you can either:
-- 1. Use Supabase Auth UI to create a real user
-- 2. Manually insert an auth.users entry (requires service role)
-- 3. Use the demo user IDs above with a custom auth bypass for testing

-- For local development, you may want to disable RLS temporarily:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- (Remember to re-enable before production!)
