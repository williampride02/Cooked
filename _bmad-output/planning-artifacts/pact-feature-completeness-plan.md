---
title: "Pact Feature Completeness & Accountability Plan"
aliases:
  - "Pact Completeness Plan"
  - "Accountability Gaps"
tags:
  - cooked
  - planning
  - pacts
  - accountability
  - monetization
status: planning
created: 2026-01-20
related:
  - "[[PRD]]"
  - "[[Epics]]"
  - "[[Sprint Status]]"
---

# Pact Feature Completeness & Accountability Plan

> [!info] Planning Session
> **Date**: 2026-01-20 | **Status**: Planning | **Purpose**: Identify and plan missing features for complete pact functionality, accountability enforcement, and monetization

---

## Executive Summary

This plan addresses critical gaps in the pact feature set that prevent full accountability enforcement and monetization. While core pact functionality works (creation, check-ins, roast threads), **9 critical gaps** have been identified:

### Critical Gaps (P0)
1. **Automatic Accountability** - Auto-fold on missed check-ins (Edge Function missing)
2. **Reminder Scheduling** - Check-in reminders not scheduled via cron
3. **Weekly Recap Cron** - May not be properly configured

### High Priority Gaps (P1)
4. **Payment Processing** - No App Store/Play Store billing integration
5. **Feature Enforcement Bugs** - Free tier limits not enforced
6. **Web App Feature Parity** - 4 features missing (check-ins, real-time, roast threads, recaps)
7. **Notification Frequency Caps** - Rate limiting not implemented

### Nice-to-Have Gaps (P1 - Deferred)
8. **Roast Polls UI** - Database ready, UI not implemented
9. **Cron Job Verification** - Need to verify all scheduled jobs are working

---

## Current State Assessment

### ✅ What's Working

**Pact Management:**
- ✅ Pact creation (Individual, Group, Relay types)
- ✅ Pact editing and archiving
- ✅ Pact statistics (streaks, completion rates)
- ✅ Pact participant management

**Check-in System:**
- ✅ Manual check-ins (success/fold)
- ✅ Excuse selection on fold
- ✅ Proof photo submission
- ✅ Check-in history tracking

**Accountability Features:**
- ✅ Roast thread auto-creation on fold
- ✅ Real-time feed updates
- ✅ Group visibility of check-ins

**Subscription Infrastructure:**
- ✅ Subscription status tracking in database
- ✅ Feature gating hooks (`useSubscription`, `usePactLimit`)
- ✅ Premium gate components
- ✅ Upgrade UI screens

### ❌ Critical Gaps

**1. Automatic Accountability (P0 - Core Feature)**
- ❌ **Auto-fold on missed check-ins** - No Edge Function exists
- ❌ **Reminder notifications** - Edge Function exists but not scheduled via cron
- ❌ **Ghost detection** - Users can skip check-ins without consequences

**Impact**: Users can forget to check in and face no automatic accountability. This breaks the core value proposition.

**2. Payment Processing (P1 - Monetization Blocker)**
- ❌ **App Store billing integration** - No `expo-in-app-purchases` or RevenueCat
- ❌ **Play Store billing integration** - No Android payment SDK
- ❌ **Subscription purchase flow** - Upgrade screen exists but can't complete purchase
- ❌ **Receipt validation** - No server-side verification

**Impact**: Cannot generate revenue. Users see upgrade prompts but cannot actually pay.

**3. Feature Enforcement (P1 - Free Tier Integrity)**
- ❌ **Pact limit enforcement** - `canCreatePact` always returns `true` (bug)
- ❌ **Group limit enforcement** - `canJoinGroup` always returns `true` (bug)
- ❌ **Premium feature gates** - May not be consistently applied

**Impact**: Free tier limits are not enforced, allowing unlimited usage without payment.

---

## Detailed Gap Analysis

### Gap 1: Auto-Fold on Missed Check-ins

**Status**: Story 4.5 exists but not implemented
**Priority**: P0 (Core Accountability Feature)
**Story Reference**: `_bmad-output/implementation-artifacts/stories/4-5-missed-check-in-auto-fold.md`

**What's Missing:**
- Edge Function: `supabase/functions/missed-check-in-auto-fold/index.ts` - **DOES NOT EXIST**
- Cron job configuration for daily execution
- Timezone handling logic
- Integration with roast thread creation
- User notification on auto-fold

**Acceptance Criteria (from Story 4.5):**
1. Auto-fold at midnight local time for users with missed check-ins
2. Auto-set excuse to "Ghosted 👻"
3. Auto-create roast thread
4. Send notification: "You ghosted yesterday"
5. Handle timezones correctly

**Technical Requirements:**
- Create Edge Function in `supabase/functions/missed-check-in-auto-fold/`
- Configure Supabase cron (pg_cron) to run daily at midnight UTC
- Query active pacts with check-ins due yesterday
- Filter out users who already checked in
- Create fold check-in records
- Trigger roast thread creation (reuse existing logic)
- Send push notifications

---

### Gap 2: Check-in Reminder Scheduling

**Status**: Edge Function exists but not scheduled
**Priority**: P0 (User Engagement)
**Story Reference**: `_bmad-output/implementation-artifacts/stories/4-4-check-in-reminder-notifications.md`

**What's Missing:**
- Cron job to trigger `check-in-reminder` Edge Function
- Multiple daily reminder times (8 AM, 12 PM, 6 PM as planned)
- User timezone handling for reminder times

**Current State:**
- ✅ Edge Function exists: `supabase/functions/check-in-reminder/index.ts`
- ✅ Function logic is complete
- ❌ No cron job configured to call it

**Technical Requirements:**
- Configure pg_cron jobs for multiple daily reminders
- Or use external scheduler (Vercel Cron, GitHub Actions, etc.)
- Handle user timezone preferences
- Respect notification preferences (quiet hours, frequency caps)

---

### Gap 3: Payment Processing Integration

**Status**: No implementation exists
**Priority**: P1 (Monetization Blocker)
**Story Reference**: Epic 7, Story 7.3 (from epics.md)

**What's Missing:**
- App Store Connect integration (`expo-in-app-purchases`)
- Play Store billing integration
- RevenueCat integration (optional but recommended)
- Server-side receipt validation
- Subscription status webhook handling
- Graceful downgrade on payment failure

**Current State:**
- ✅ Database schema supports subscription status
- ✅ UI screens for upgrade exist
- ✅ Feature gating hooks exist
- ❌ No actual payment processing

**Technical Requirements:**
- Install and configure `expo-in-app-purchases` or RevenueCat SDK
- Set up App Store Connect products
- Set up Play Console subscriptions
- Create Edge Function for receipt validation
- Handle subscription lifecycle (purchase, renewal, cancellation, refund)
- Update `groups.subscription_status` based on payment events
- Implement grace period and downgrade logic

**Recommended Approach:**
- Use RevenueCat for cross-platform subscription management
- Handles App Store + Play Store + web subscriptions
- Provides webhooks for subscription events
- Reduces server-side receipt validation complexity

---

### Gap 4: Feature Enforcement Bugs

**Status**: Code exists but has bugs
**Priority**: P1 (Free Tier Integrity)

**What's Broken:**

**Bug 1: `canCreatePact` always returns true**
```typescript
// apps/mobile/src/hooks/useSubscription.ts:82-87
const canCreatePact = useMemo(() => {
  if (isPremium) return true;
  // Would need to check current pact count - for now, assume true
  // This would be more accurately checked in the create pact flow
  return true;  // ❌ BUG: Should check pact count
}, [isPremium]);
```

**Fix Required:**
- Actually query current pact count for the group
- Compare against `FREE_TIER_LIMITS.max_pacts_per_group` (3)
- Return `false` if at limit

**Bug 2: `canJoinGroup` always returns true**
```typescript
// apps/mobile/src/hooks/useSubscription.ts:90-95
const canJoinGroup = useMemo(() => {
  if (isPremium) return true;
  // Would need to check current group count
  // For free tier, limit is 1 group
  return true;  // ❌ BUG: Should check group count
}, [isPremium]);
```

**Fix Required:**
- Query user's current group memberships
- Compare against `FREE_TIER_LIMITS.max_groups` (1)
- Return `false` if at limit

**Impact**: Free users can create unlimited pacts and join multiple groups, breaking monetization model.

---

## Implementation Plan

### Phase 1: Fix Accountability (P0)

**Goal**: Ensure users cannot skip check-ins without consequences

**Tasks:**
1. **Implement Auto-Fold Edge Function**
   - Create `supabase/functions/missed-check-in-auto-fold/index.ts`
   - Query active pacts with check-ins due yesterday
   - Create fold check-ins with "Ghosted 👻" excuse
   - Trigger roast thread creation
   - Send push notifications
   - Handle timezones correctly

2. **Configure Cron Jobs**
   - Set up pg_cron for auto-fold (daily at midnight UTC)
   - Set up cron for check-in reminders (8 AM, 12 PM, 6 PM)
   - Test cron execution
   - Monitor Edge Function logs

3. **Test Auto-Fold Flow**
   - Create test pact
   - Skip check-in
   - Verify auto-fold at midnight
   - Verify roast thread creation
   - Verify notification delivery

**Estimated Effort**: 2-3 days
**Dependencies**: None
**Story**: 4.5 (ready-for-dev)

---

### Phase 2: Fix Feature Enforcement (P1)

**Goal**: Enforce free tier limits properly

**Tasks:**
1. **Fix `canCreatePact` Logic**
   - Update `useSubscription.ts` to query actual pact count
   - Use `usePactLimit` hook (already exists in web app)
   - Return `false` when at limit
   - Show upgrade prompt when limit reached

2. **Fix `canJoinGroup` Logic**
   - Query user's group memberships
   - Check against `FREE_TIER_LIMITS.max_groups`
   - Return `false` when at limit
   - Show upgrade prompt when limit reached

3. **Add Enforcement in UI**
   - Update create pact flow to check limits before allowing creation
   - Update join group flow to check limits
   - Add upgrade prompts at enforcement points

4. **Test Free Tier Limits**
   - Create 3 pacts (should succeed)
   - Attempt 4th pact (should fail with upgrade prompt)
   - Join 1 group (should succeed)
   - Attempt 2nd group (should fail with upgrade prompt)

**Estimated Effort**: 1 day
**Dependencies**: None
**Story**: Update Epic 7.1

---

### Phase 3: Implement Payment Processing (P1)

**Goal**: Enable users to actually purchase premium subscriptions

**Tasks:**
1. **Choose Payment Solution**
   - Option A: RevenueCat (recommended - handles cross-platform)
   - Option B: Native SDKs (`expo-in-app-purchases` + Play Billing)
   - Decision: Use RevenueCat for simplicity

2. **Set Up RevenueCat**
   - Create RevenueCat account and project
   - Configure App Store Connect products
   - Configure Play Console subscriptions
   - Set up webhooks for subscription events

3. **Integrate RevenueCat SDK**
   - Install `react-native-purchases` package
   - Initialize SDK in app
   - Implement purchase flow in upgrade screen
   - Handle purchase success/failure

4. **Create Receipt Validation Edge Function**
   - Create `supabase/functions/validate-subscription/index.ts`
   - Verify receipts with RevenueCat API
   - Update `groups.subscription_status` based on validation
   - Handle subscription lifecycle events (renewal, cancellation, refund)

5. **Implement Subscription Webhook Handler**
   - Create `supabase/functions/revenuecat-webhook/index.ts`
   - Handle RevenueCat webhook events
   - Update subscription status in real-time
   - Send notifications for subscription changes

6. **Test Payment Flow**
   - Test App Store purchase (iOS)
   - Test Play Store purchase (Android)
   - Test subscription renewal
   - Test cancellation and downgrade
   - Verify feature gates unlock/lock correctly

**Estimated Effort**: 3-5 days
**Dependencies**: App Store Connect + Play Console access
**Story**: Epic 7.3 (needs to be created)

---

### Phase 4: Schedule Reminder Notifications (P0)

**Goal**: Ensure users receive check-in reminders

**Tasks:**
1. **Configure Reminder Cron Jobs**
   - Set up pg_cron to call `check-in-reminder` Edge Function
   - Schedule for 8 AM, 12 PM, 6 PM UTC (or user local times)
   - Test cron execution
   - Monitor notification delivery

2. **Add User Timezone Support**
   - Store user timezone in `users.settings`
   - Calculate reminder times per timezone
   - Batch reminders by timezone for efficiency

3. **Test Reminder Flow**
   - Set up test user with active pact
   - Wait for reminder time
   - Verify notification delivery
   - Verify notification opens app to pacts screen

**Estimated Effort**: 1 day
**Dependencies**: Phase 1 (cron infrastructure)
**Story**: 4.4 (ready-for-dev)

---

## Priority Matrix

| Feature | Priority | Effort | Impact | Phase |
|---------|----------|--------|--------|-------|
| Auto-fold on missed check-ins | P0 | 2-3 days | Critical | Phase 1 |
| Reminder cron scheduling | P0 | 1 day | High | Phase 4 |
| Fix `canCreatePact` bug | P1 | 0.5 days | High | Phase 2 |
| Fix `canJoinGroup` bug | P1 | 0.5 days | High | Phase 2 |
| Payment processing | P1 | 3-5 days | Critical | Phase 3 |

---

## Success Criteria

### Accountability Complete When:
- ✅ Users who miss check-ins are automatically marked as "folded"
- ✅ Auto-fold triggers roast threads
- ✅ Users receive reminders at configured times
- ✅ No user can skip accountability by simply forgetting

### Monetization Complete When:
- ✅ Users can purchase premium subscriptions via App Store/Play Store
- ✅ Subscription status updates automatically on purchase/renewal/cancellation
- ✅ Free tier limits are enforced (3 pacts max, 1 group max)
- ✅ Premium features unlock when subscription is active
- ✅ Graceful downgrade when subscription lapses

### Feature Enforcement Complete When:
- ✅ Free users cannot create 4th pact (upgrade prompt shown)
- ✅ Free users cannot join 2nd group (upgrade prompt shown)
- ✅ Premium features are gated behind subscription check
- ✅ All enforcement points show clear upgrade prompts

---

## Next Steps

1. **Review and Approve Plan** - Confirm priorities and approach
2. **Create/Update Stories** - Convert gaps into actionable stories
3. **Begin Implementation** - Start with Phase 1 (Auto-fold)

---

## Additional Gaps Discovered

### Gap 5: Roast Polls Feature (P1 - Deferred for MVP)

**Status**: Database tables exist, UI/functionality not implemented
**Priority**: P1 (Nice to Have)
**Story Reference**: Story 5.5 (ready-for-dev)

**What Exists:**
- ✅ Database migration applied: `supabase/migrations/20260114000002_add_polls.sql`
- ✅ Tables: `polls`, `poll_options`, `poll_votes` with RLS policies
- ✅ Story file exists with detailed ACs

**What's Missing:**
- ❌ UI components for displaying polls in roast threads
- ❌ Voting functionality
- ❌ Preset poll creation on thread creation
- ❌ Custom poll creation (Nuclear level only)
- ❌ Real-time poll results updates
- ❌ Poll results visualization

**Impact**: Polls are a P1 feature, so this is acceptable for MVP. However, the database infrastructure is ready, making implementation straightforward.

**Technical Requirements:**
- Create `Poll.tsx`, `PollOption.tsx`, `CreatePollModal.tsx` components
- Create `usePolls.ts` hook for data fetching and mutations
- Integrate polls into roast thread UI
- Add preset poll creation logic (Medium/Nuclear levels)
- Add custom poll creation (Nuclear only, thread creator)
- Real-time updates via Supabase Realtime

---

### Gap 6: Weekly Recap Cron Configuration (P0 - May Not Be Working)

**Status**: Migration exists but may not be properly configured
**Priority**: P0 (Core Feature)
**Story Reference**: Story 6.1

**What Exists:**
- ✅ Edge Function: `supabase/functions/generate-weekly-recap/index.ts` (complete)
- ✅ Migration: `supabase/migrations/20260114000004_add_weekly_recap_cron.sql`
- ✅ Cron job scheduled: `'0 23 * * 0'` (Sunday 11 PM UTC)
- ✅ Function: `trigger_weekly_recap_generation()`

**Potential Issues:**
- ⚠️ Cron function requires `app.settings.edge_function_base_url` to be configured
- ⚠️ Cron function requires `app.settings.service_role_key` to be configured
- ⚠️ If settings not configured, function returns early with notice
- ⚠️ May need to verify cron job is actually running in production

**Impact**: Weekly recaps may not be generating automatically if settings aren't configured.

**Technical Requirements:**
- Verify cron job is active in Supabase dashboard
- Configure `app.settings.edge_function_base_url` (or use Supabase project URL directly)
- Configure `app.settings.service_role_key` (or use environment variable)
- Test cron execution manually
- Monitor Edge Function logs for Sunday executions
- Add fallback to use direct database function if Edge Function fails

---

### Gap 7: Notification Frequency Caps (P1 - Partially Missing)

**Status**: Mentioned in PRD, partially implemented
**Priority**: P1 (User Experience)

**What Exists:**
- ✅ Notification preferences UI (`apps/mobile/src/app/(main)/notifications.tsx`)
- ✅ Quiet hours implementation
- ✅ Per-type notification toggles
- ✅ `NotificationPreferences` type includes all toggles

**What's Missing:**
- ❌ Frequency cap setting (max X notifications per hour)
- ❌ Frequency cap enforcement logic in Edge Functions
- ❌ Rate limiting in notification dispatch

**Impact**: Users can receive unlimited notifications, potentially causing notification fatigue.

**Technical Requirements:**
- Add `frequency_cap_enabled` and `frequency_cap_max_per_hour` to `NotificationPreferences`
- Add frequency cap UI controls in notification settings
- Implement rate limiting in `send-notification` Edge Function
- Track notification timestamps per user
- Enforce caps before sending notifications

---

### Gap 8: Web App Feature Parity (P1 - Multiple Features)

**Status**: Several web app features are backlog
**Priority**: P1 (Cross-platform access)

**Missing Web Features:**
1. **Check-in Interface** (web-3: backlog)
   - Users cannot check in from web app
   - Missing: Check-in success/fold UI, excuse selection, proof upload

2. **Real-time Feed Updates** (web-4: backlog)
   - Feed doesn't update in real-time on web
   - Missing: Supabase Realtime WebSocket subscriptions for web

3. **Roast Threads** (web-5: backlog)
   - Users cannot view/participate in roast threads on web
   - Missing: Roast thread UI, response posting, GIF/image support

4. **Weekly Recaps** (web-6: backlog)
   - Users cannot view weekly recaps on web
   - Missing: Recap display, share functionality

**Impact**: Web app is incomplete, limiting cross-platform access and backend testing capabilities.

**Technical Requirements:**
- Create web check-in interface (reuse mobile logic)
- Implement Supabase Realtime subscriptions for web feed
- Create web roast thread UI and functionality
- Create web recap viewing and sharing

---

### Gap 9: Cron Job Verification & Configuration

**Status**: Multiple cron jobs may not be properly configured
**Priority**: P0 (System Reliability)

**Cron Jobs That Need Verification:**
1. **Weekly Recap Generation**
   - Scheduled: Sunday 11 PM UTC
   - Requires: Edge Function URL and service role key configuration
   - Status: Migration exists, configuration unknown

2. **Check-in Reminders**
   - Should run: Multiple times daily (8 AM, 12 PM, 6 PM)
   - Status: Edge Function exists, **NO CRON JOB CONFIGURED**

3. **Auto-fold on Missed Check-ins**
   - Should run: Daily at midnight (per timezone)
   - Status: Edge Function **DOES NOT EXIST**, no cron possible

**Impact**: Critical automation features may not be running, breaking core functionality.

**Technical Requirements:**
- Audit all cron jobs in Supabase dashboard
- Verify `pg_cron` extension is enabled
- Configure missing cron jobs
- Set up proper environment variables/secrets for Edge Function URLs
- Test each cron job manually
- Add monitoring/alerting for cron job failures

---

## Questions for Discussion

1. **Payment Solution**: RevenueCat vs native SDKs? (Recommendation: RevenueCat)
2. **Auto-fold Timing**: Midnight UTC or per-user timezone? (Recommendation: Per-user timezone)
3. **Reminder Frequency**: 3x daily (8 AM, 12 PM, 6 PM) or configurable per user? (Recommendation: Configurable)
4. **Grace Period**: How long after payment failure before downgrade? (Recommendation: 7 days)
5. **Free Tier Limits**: Are current limits (1 group, 3 pacts) correct? (Recommendation: Yes, per PRD)
6. **Roast Polls Priority**: Implement now or keep deferred? (Recommendation: Defer for MVP, database ready)
7. **Web App Priority**: Complete web parity or focus on mobile? (Recommendation: Complete web for backend testing)
8. **Cron Configuration**: Use Supabase pg_cron or external scheduler? (Recommendation: pg_cron for simplicity)

---

## Updated Priority Matrix

| Feature | Priority | Effort | Impact | Phase |
|---------|----------|--------|--------|-------|
| Auto-fold on missed check-ins | P0 | 2-3 days | Critical | Phase 1 |
| Reminder cron scheduling | P0 | 1 day | High | Phase 4 |
| Weekly recap cron verification | P0 | 0.5 days | High | Phase 1 |
| Fix `canCreatePact` bug | P1 | 0.5 days | High | Phase 2 |
| Fix `canJoinGroup` bug | P1 | 0.5 days | High | Phase 2 |
| Payment processing | P1 | 3-5 days | Critical | Phase 3 |
| Web check-in interface | P1 | 2 days | Medium | Phase 5 |
| Web real-time feed | P1 | 1 day | Medium | Phase 5 |
| Web roast threads | P1 | 2-3 days | Medium | Phase 5 |
| Web weekly recaps | P1 | 1 day | Low | Phase 5 |
| Notification frequency caps | P1 | 1 day | Low | Phase 6 |
| Roast polls UI | P1 | 2-3 days | Low | Phase 7 (Post-MVP) |

**Total Estimated Effort**: 15-20 days for all gaps

---

## Related Documents

- [PRD - Subscription & Payments Section](_bmad-output/planning-artifacts/prd.md#39-subscription--payments)
- [Epic 7: Monetization & Premium Features](_bmad-output/planning-artifacts/epics.md#epic-7-monetization--premium-features)
- [Story 4.4: Check-in Reminder Notifications](_bmad-output/implementation-artifacts/stories/4-4-check-in-reminder-notifications.md)
- [Story 4.5: Missed Check-in Auto-Fold](_bmad-output/implementation-artifacts/stories/4-5-missed-check-in-auto-fold.md)
- [Sprint Status](_bmad-output/implementation-artifacts/sprint-status.yaml)

---

**Plan Status**: ✅ Complete - Ready for Review and Implementation
