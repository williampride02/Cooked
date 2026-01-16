// Seed script - run with: npx tsx scripts/seed.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxnhqtsfugikzykxwkxk.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

// Demo data
const users = [
  { id: '11111111-1111-1111-1111-111111111111', phone: '+15551234567', display_name: 'Alex', settings: { notifications: { check_in_reminder: true, someone_folded: true } } },
  { id: '22222222-2222-2222-2222-222222222222', phone: '+15552345678', display_name: 'Jordan', settings: { notifications: { check_in_reminder: true } } },
  { id: '33333333-3333-3333-3333-333333333333', phone: '+15553456789', display_name: 'Sam', settings: {} },
  { id: '44444444-4444-4444-4444-444444444444', phone: '+15554567890', display_name: 'Taylor', settings: {} },
  { id: '55555555-5555-5555-5555-555555555555', phone: '+15555678901', display_name: 'Casey', settings: {} },
];

const groups = [
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Gym Bros', invite_code: 'gym123', created_by: '11111111-1111-1111-1111-111111111111', subscription_status: 'free' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'No Junk Food Squad', invite_code: 'nosnax', created_by: '22222222-2222-2222-2222-222222222222', subscription_status: 'premium' },
];

const groupMembers = [
  // Gym Bros
  { group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', user_id: '11111111-1111-1111-1111-111111111111', role: 'admin' },
  { group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', user_id: '22222222-2222-2222-2222-222222222222', role: 'member' },
  { group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', user_id: '33333333-3333-3333-3333-333333333333', role: 'member' },
  { group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', user_id: '44444444-4444-4444-4444-444444444444', role: 'member' },
  // No Junk Food Squad
  { group_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', user_id: '22222222-2222-2222-2222-222222222222', role: 'admin' },
  { group_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', user_id: '11111111-1111-1111-1111-111111111111', role: 'member' },
  { group_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', user_id: '55555555-5555-5555-5555-555555555555', role: 'member' },
];

const pacts = [
  { id: 'c1111111-1111-1111-1111-111111111111', group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Hit the Gym', description: 'Work out at least 30 minutes', frequency: 'daily', roast_level: 2, proof_required: 'optional', pact_type: 'individual', created_by: '11111111-1111-1111-1111-111111111111', status: 'active' },
  { id: 'c2222222-2222-2222-2222-222222222222', group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: '10K Steps', description: 'Walk 10,000 steps daily', frequency: 'daily', roast_level: 1, proof_required: 'none', pact_type: 'individual', created_by: '22222222-2222-2222-2222-222222222222', status: 'active' },
  { id: 'c3333333-3333-3333-3333-333333333333', group_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'No Fast Food', description: 'Avoid fast food completely', frequency: 'daily', roast_level: 3, proof_required: 'none', pact_type: 'group', created_by: '22222222-2222-2222-2222-222222222222', status: 'active' },
  { id: 'c4444444-4444-4444-4444-444444444444', group_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Drink 8 Glasses', description: 'Drink 8 glasses of water', frequency: 'daily', roast_level: 1, proof_required: 'optional', pact_type: 'individual', created_by: '11111111-1111-1111-1111-111111111111', status: 'active' },
];

const pactParticipants = [
  // Hit the Gym
  { pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '11111111-1111-1111-1111-111111111111' },
  { pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '22222222-2222-2222-2222-222222222222' },
  { pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '33333333-3333-3333-3333-333333333333' },
  { pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '44444444-4444-4444-4444-444444444444' },
  // 10K Steps
  { pact_id: 'c2222222-2222-2222-2222-222222222222', user_id: '11111111-1111-1111-1111-111111111111' },
  { pact_id: 'c2222222-2222-2222-2222-222222222222', user_id: '33333333-3333-3333-3333-333333333333' },
  // No Fast Food
  { pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '22222222-2222-2222-2222-222222222222' },
  { pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '11111111-1111-1111-1111-111111111111' },
  { pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '55555555-5555-5555-5555-555555555555' },
  // Drink 8 Glasses
  { pact_id: 'c4444444-4444-4444-4444-444444444444', user_id: '11111111-1111-1111-1111-111111111111' },
  { pact_id: 'c4444444-4444-4444-4444-444444444444', user_id: '22222222-2222-2222-2222-222222222222' },
];

// Get today's date and recent dates
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

// Check-in UUIDs
const CI_TODAY_ALEX_GYM = 'd0000001-0001-0001-0001-000000000001';
const CI_TODAY_JORDAN_GYM = 'd0000002-0002-0002-0002-000000000002';
const CI_YEST_ALEX_GYM = 'd0000003-0003-0003-0003-000000000003';
const CI_YEST_JORDAN_GYM = 'd0000004-0004-0004-0004-000000000004';
const CI_YEST_SAM_GYM = 'd0000005-0005-0005-0005-000000000005';
const CI_2D_ALEX_GYM = 'd0000006-0006-0006-0006-000000000006';
const CI_2D_JORDAN_GYM = 'd0000007-0007-0007-0007-000000000007';
const CI_2D_SAM_GYM = 'd0000008-0008-0008-0008-000000000008';
const CI_2D_TAYLOR_GYM = 'd0000009-0009-0009-0009-000000000009';
const CI_3D_ALEX_GYM = 'd000000a-000a-000a-000a-00000000000a';
const CI_TODAY_JORDAN_FOOD = 'd000000b-000b-000b-000b-00000000000b';
const CI_TODAY_CASEY_FOOD = 'd000000c-000c-000c-000c-00000000000c';
const CI_YEST_JORDAN_FOOD = 'd000000d-000d-000d-000d-00000000000d';
const CI_YEST_ALEX_FOOD = 'd000000e-000e-000e-000e-00000000000e';
const CI_YEST_CASEY_FOOD = 'd000000f-000f-000f-000f-00000000000f';

// Roast thread UUIDs
const RT_JORDAN_GYM_TODAY = 'e0000001-0001-0001-0001-000000000001';
const RT_SAM_GYM_YEST = 'e0000002-0002-0002-0002-000000000002';
const RT_JORDAN_GYM_2D = 'e0000003-0003-0003-0003-000000000003';
const RT_ALEX_GYM_3D = 'e0000004-0004-0004-0004-000000000004';
const RT_CASEY_FOOD_TODAY = 'e0000005-0005-0005-0005-000000000005';

// Roast response UUIDs
const RR_1 = 'f0000001-0001-0001-0001-000000000001';
const RR_2 = 'f0000002-0002-0002-0002-000000000002';
const RR_3 = 'f0000003-0003-0003-0003-000000000003';
const RR_4 = 'f0000004-0004-0004-0004-000000000004';
const RR_5 = 'f0000005-0005-0005-0005-000000000005';
const RR_6 = 'f0000006-0006-0006-0006-000000000006';
const RR_7 = 'f0000007-0007-0007-0007-000000000007';
const RR_8 = 'f0000008-0008-0008-0008-000000000008';
const RR_9 = 'f0000009-0009-0009-0009-000000000009';
const RR_10 = 'f000000a-000a-000a-000a-00000000000a';
const RR_11 = 'f000000b-000b-000b-000b-00000000000b';
const RR_12 = 'f000000c-000c-000c-000c-00000000000c';
const RR_13 = 'f000000d-000d-000d-000d-00000000000d';

const checkIns = [
  // Today - Gym
  { id: CI_TODAY_ALEX_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '11111111-1111-1111-1111-111111111111', status: 'success', check_in_date: today },
  { id: CI_TODAY_JORDAN_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '22222222-2222-2222-2222-222222222222', status: 'fold', excuse: 'Too tired from work', check_in_date: today },
  // Yesterday - Gym
  { id: CI_YEST_ALEX_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '11111111-1111-1111-1111-111111111111', status: 'success', check_in_date: yesterday },
  { id: CI_YEST_JORDAN_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '22222222-2222-2222-2222-222222222222', status: 'success', check_in_date: yesterday },
  { id: CI_YEST_SAM_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '33333333-3333-3333-3333-333333333333', status: 'fold', excuse: 'Slept through my alarm', check_in_date: yesterday },
  // 2 days ago - Gym
  { id: CI_2D_ALEX_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '11111111-1111-1111-1111-111111111111', status: 'success', check_in_date: twoDaysAgo },
  { id: CI_2D_JORDAN_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '22222222-2222-2222-2222-222222222222', status: 'fold', excuse: 'Had a date', check_in_date: twoDaysAgo },
  { id: CI_2D_SAM_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '33333333-3333-3333-3333-333333333333', status: 'success', check_in_date: twoDaysAgo },
  { id: CI_2D_TAYLOR_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '44444444-4444-4444-4444-444444444444', status: 'success', check_in_date: twoDaysAgo },
  // 3 days ago
  { id: CI_3D_ALEX_GYM, pact_id: 'c1111111-1111-1111-1111-111111111111', user_id: '11111111-1111-1111-1111-111111111111', status: 'fold', excuse: 'Back was sore', check_in_date: threeDaysAgo },
  // Food pact
  { id: CI_TODAY_JORDAN_FOOD, pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '22222222-2222-2222-2222-222222222222', status: 'success', check_in_date: today },
  { id: CI_TODAY_CASEY_FOOD, pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '55555555-5555-5555-5555-555555555555', status: 'fold', excuse: 'Caved and got McDonalds', check_in_date: today },
  { id: CI_YEST_JORDAN_FOOD, pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '22222222-2222-2222-2222-222222222222', status: 'success', check_in_date: yesterday },
  { id: CI_YEST_ALEX_FOOD, pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '11111111-1111-1111-1111-111111111111', status: 'success', check_in_date: yesterday },
  { id: CI_YEST_CASEY_FOOD, pact_id: 'c3333333-3333-3333-3333-333333333333', user_id: '55555555-5555-5555-5555-555555555555', status: 'success', check_in_date: yesterday },
];

const roastThreads = [
  { id: RT_JORDAN_GYM_TODAY, check_in_id: CI_TODAY_JORDAN_GYM, status: 'open' },
  { id: RT_SAM_GYM_YEST, check_in_id: CI_YEST_SAM_GYM, status: 'open' },
  { id: RT_JORDAN_GYM_2D, check_in_id: CI_2D_JORDAN_GYM, status: 'closed' },
  { id: RT_ALEX_GYM_3D, check_in_id: CI_3D_ALEX_GYM, status: 'closed' },
  { id: RT_CASEY_FOOD_TODAY, check_in_id: CI_TODAY_CASEY_FOOD, status: 'open' },
];

const roastResponses = [
  // Jordan's gym fold today
  { id: RR_1, thread_id: RT_JORDAN_GYM_TODAY, user_id: '11111111-1111-1111-1111-111111111111', content_type: 'text', content: 'Too tired? The gym doesnt care about your feelings bro', is_pinned: false },
  { id: RR_2, thread_id: RT_JORDAN_GYM_TODAY, user_id: '33333333-3333-3333-3333-333333333333', content_type: 'text', content: 'Netflix and excuses again huh', is_pinned: false },
  { id: RR_3, thread_id: RT_JORDAN_GYM_TODAY, user_id: '44444444-4444-4444-4444-444444444444', content_type: 'gif', content: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', is_pinned: false },
  // Sam's gym fold yesterday
  { id: RR_4, thread_id: RT_SAM_GYM_YEST, user_id: '11111111-1111-1111-1111-111111111111', content_type: 'text', content: 'Maybe set 5 alarms next time', is_pinned: false },
  { id: RR_5, thread_id: RT_SAM_GYM_YEST, user_id: '22222222-2222-2222-2222-222222222222', content_type: 'text', content: 'Your alarm worked fine, your discipline didnt', is_pinned: true },
  // Jordan's gym fold 2 days ago
  { id: RR_6, thread_id: RT_JORDAN_GYM_2D, user_id: '11111111-1111-1111-1111-111111111111', content_type: 'text', content: 'A DATE? Did you at least do some cardio?', is_pinned: false },
  { id: RR_7, thread_id: RT_JORDAN_GYM_2D, user_id: '33333333-3333-3333-3333-333333333333', content_type: 'text', content: 'Priorities all wrong my guy', is_pinned: true },
  { id: RR_8, thread_id: RT_JORDAN_GYM_2D, user_id: '44444444-4444-4444-4444-444444444444', content_type: 'text', content: 'The date could have waited, those gains cant', is_pinned: false },
  // Alex's gym fold 3 days ago
  { id: RR_9, thread_id: RT_ALEX_GYM_3D, user_id: '22222222-2222-2222-2222-222222222222', content_type: 'text', content: 'Back was sore from carrying all those excuses', is_pinned: true },
  { id: RR_10, thread_id: RT_ALEX_GYM_3D, user_id: '33333333-3333-3333-3333-333333333333', content_type: 'text', content: 'Admin folding... setting a great example', is_pinned: false },
  // Casey's food fold
  { id: RR_11, thread_id: RT_CASEY_FOOD_TODAY, user_id: '22222222-2222-2222-2222-222222222222', content_type: 'text', content: 'McDonalds really??? You couldnt even cheat with something good?', is_pinned: false },
  { id: RR_12, thread_id: RT_CASEY_FOOD_TODAY, user_id: '11111111-1111-1111-1111-111111111111', content_type: 'text', content: 'Im lovin it... watching you fail', is_pinned: false },
  { id: RR_13, thread_id: RT_CASEY_FOOD_TODAY, user_id: '22222222-2222-2222-2222-222222222222', content_type: 'gif', content: 'https://media.giphy.com/media/xUPGcdeU3wvdNPa1Py/giphy.gif', is_pinned: false },
];

const reactions = [
  // Check-in reactions
  { target_type: 'check_in', target_id: CI_TODAY_ALEX_GYM, user_id: '22222222-2222-2222-2222-222222222222', emoji: 'fire' },
  { target_type: 'check_in', target_id: CI_TODAY_ALEX_GYM, user_id: '33333333-3333-3333-3333-333333333333', emoji: 'salute' },
  { target_type: 'check_in', target_id: CI_TODAY_JORDAN_GYM, user_id: '11111111-1111-1111-1111-111111111111', emoji: 'skull' },
  { target_type: 'check_in', target_id: CI_TODAY_JORDAN_GYM, user_id: '33333333-3333-3333-3333-333333333333', emoji: 'clown' },
  { target_type: 'check_in', target_id: CI_TODAY_JORDAN_GYM, user_id: '44444444-4444-4444-4444-444444444444', emoji: 'skull' },
  { target_type: 'check_in', target_id: CI_TODAY_CASEY_FOOD, user_id: '22222222-2222-2222-2222-222222222222', emoji: 'skull' },
  { target_type: 'check_in', target_id: CI_TODAY_CASEY_FOOD, user_id: '11111111-1111-1111-1111-111111111111', emoji: 'clown' },
  // Roast response reactions
  { target_type: 'roast_response', target_id: RR_1, user_id: '33333333-3333-3333-3333-333333333333', emoji: 'fire' },
  { target_type: 'roast_response', target_id: RR_2, user_id: '11111111-1111-1111-1111-111111111111', emoji: 'skull' },
  { target_type: 'roast_response', target_id: RR_5, user_id: '11111111-1111-1111-1111-111111111111', emoji: 'fire' },
  { target_type: 'roast_response', target_id: RR_5, user_id: '44444444-4444-4444-4444-444444444444', emoji: 'fire' },
  { target_type: 'roast_response', target_id: RR_9, user_id: '33333333-3333-3333-3333-333333333333', emoji: 'skull' },
  { target_type: 'roast_response', target_id: RR_9, user_id: '44444444-4444-4444-4444-444444444444', emoji: 'fire' },
  { target_type: 'roast_response', target_id: RR_12, user_id: '22222222-2222-2222-2222-222222222222', emoji: 'skull' },
];

const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
const weekEnd = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const weeklyRecaps = [
  {
    group_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    week_start: weekStart,
    week_end: weekEnd,
    data: {
      total_check_ins: 28,
      success_rate: 75,
      total_folds: 7,
      total_roasts: 15,
      awards: {
        most_consistent: { user_id: '11111111-1111-1111-1111-111111111111', display_name: 'Alex', completion_rate: 86 },
        biggest_fold: { user_id: '22222222-2222-2222-2222-222222222222', display_name: 'Jordan', fold_count: 3 },
        roast_mvp: { user_id: '33333333-3333-3333-3333-333333333333', display_name: 'Sam', roast_count: 8 },
        excuse_hall_of_fame: { user_id: '22222222-2222-2222-2222-222222222222', display_name: 'Jordan', excuse: 'Had a date' }
      },
      leaderboard: [
        { user_id: '11111111-1111-1111-1111-111111111111', display_name: 'Alex', completion_rate: 86, check_ins: 6, folds: 1 },
        { user_id: '44444444-4444-4444-4444-444444444444', display_name: 'Taylor', completion_rate: 80, check_ins: 4, folds: 1 },
        { user_id: '33333333-3333-3333-3333-333333333333', display_name: 'Sam', completion_rate: 71, check_ins: 5, folds: 2 },
        { user_id: '22222222-2222-2222-2222-222222222222', display_name: 'Jordan', completion_rate: 57, check_ins: 4, folds: 3 }
      ],
      highlights: {
        longest_streak: { user_id: '11111111-1111-1111-1111-111111111111', display_name: 'Alex', streak: 5 },
        best_roast: { response_id: 'rr-9', user_id: '22222222-2222-2222-2222-222222222222', display_name: 'Jordan', content: 'Back was sore from carrying all those excuses', reactions: 4 }
      }
    }
  }
];

async function seed() {
  console.log('Seeding database...\n');

  // Insert users
  console.log('Inserting users...');
  const { error: usersError } = await supabase.from('users').upsert(users);
  if (usersError) console.error('Users error:', usersError.message);
  else console.log('✓ Users inserted');

  // Insert groups
  console.log('Inserting groups...');
  const { error: groupsError } = await supabase.from('groups').upsert(groups);
  if (groupsError) console.error('Groups error:', groupsError.message);
  else console.log('✓ Groups inserted');

  // Insert group members
  console.log('Inserting group members...');
  const { error: membersError } = await supabase.from('group_members').upsert(groupMembers);
  if (membersError) console.error('Members error:', membersError.message);
  else console.log('✓ Group members inserted');

  // Insert pacts
  console.log('Inserting pacts...');
  const { error: pactsError } = await supabase.from('pacts').upsert(pacts);
  if (pactsError) console.error('Pacts error:', pactsError.message);
  else console.log('✓ Pacts inserted');

  // Insert pact participants
  console.log('Inserting pact participants...');
  const { error: participantsError } = await supabase.from('pact_participants').upsert(pactParticipants);
  if (participantsError) console.error('Participants error:', participantsError.message);
  else console.log('✓ Pact participants inserted');

  // Insert check-ins
  console.log('Inserting check-ins...');
  const { error: checkInsError } = await supabase.from('check_ins').upsert(checkIns);
  if (checkInsError) console.error('Check-ins error:', checkInsError.message);
  else console.log('✓ Check-ins inserted');

  // Insert roast threads
  console.log('Inserting roast threads...');
  const { error: threadsError } = await supabase.from('roast_threads').upsert(roastThreads);
  if (threadsError) console.error('Threads error:', threadsError.message);
  else console.log('✓ Roast threads inserted');

  // Insert roast responses
  console.log('Inserting roast responses...');
  const { error: responsesError } = await supabase.from('roast_responses').upsert(roastResponses);
  if (responsesError) console.error('Responses error:', responsesError.message);
  else console.log('✓ Roast responses inserted');

  // Insert reactions
  console.log('Inserting reactions...');
  const { error: reactionsError } = await supabase.from('reactions').upsert(reactions);
  if (reactionsError) console.error('Reactions error:', reactionsError.message);
  else console.log('✓ Reactions inserted');

  // Insert weekly recaps
  console.log('Inserting weekly recaps...');
  const { error: recapsError } = await supabase.from('weekly_recaps').upsert(weeklyRecaps);
  if (recapsError) console.error('Recaps error:', recapsError.message);
  else console.log('✓ Weekly recaps inserted');

  console.log('\n✅ Seed complete!');
}

seed().catch(console.error);
