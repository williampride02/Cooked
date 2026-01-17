---
title: "Story Web.7 - Group Invites + Join Requests"
aliases:
  - "Story Web.7"
  - "Web Invites"
  - "Web Group Invites"
tags:
  - cooked
  - implementation
  - story
  - epic-web
  - web-app
  - invites
status: review
created: 2026-01-18
updated: 2026-01-18
epic: web
story: 7
related:
  - "[[Web App Design]]"
  - "[[Epics]]"
  - "[[Architecture]]"
---

# Story Web.7: Group Invites + Join Requests

Status: review

## Story

As a **group admin on the web app**,
I want **to generate secure invite links and manage join requests**,
So that **I can invite friends securely and control who joins my group**.

## Acceptance Criteria

1. **AC1: Generate Invite Link**
   - Given I am a group admin
   - When I navigate to the invite page
   - Then I see a shareable invite link
   - And I can copy the link
   - And I can regenerate the link (invalidating the old one)

2. **AC2: Join via Invite Link**
   - Given I receive an invite link
   - When I open the link
   - Then I see a group preview (name, member count)
   - And if not logged in, I am redirected to login/signup
   - And after auth, I see a confirmation screen
   - And when I confirm, I join the group and am redirected to the group feed

3. **AC3: Request Join by Code**
   - Given I enter a 6-character invite code
   - When I submit the code
   - Then a join request is created (not immediate join)
   - And I see a confirmation that my request was sent
   - And I am notified when the admin approves/denies

4. **AC4: Manage Join Requests (Admin)**
   - Given I am a group admin
   - When I view the invite page
   - Then I see pending join requests
   - And I can approve or deny each request
   - And approved users become group members

## Tasks / Subtasks

- [x] **Task 1: Database Migration - Invite Tokens and Join Requests**
  - [x] Add `invite_token` column to groups table (long, unguessable token)
  - [x] Add `invite_token_rotated_at` column for audit
  - [x] Create `group_join_requests` table
  - [x] Create SECURITY DEFINER function `get_group_invite_preview`
  - [x] Create SECURITY DEFINER function `join_group_by_invite_token`
  - [x] Create SECURITY DEFINER function `request_group_join_by_invite_code`
  - [x] Create SECURITY DEFINER function `list_group_join_requests`
  - [x] Create SECURITY DEFINER function `review_group_join_request`
  - [x] Create SECURITY DEFINER function `rotate_group_invite_token`
  - [x] Add RLS policies for `group_join_requests`

- [x] **Task 2: Create useInvites Hook**
  - [x] Create `apps/web/src/hooks/useInvites.ts`
  - [x] Implement `getInvitePreview` function
  - [x] Implement `joinByToken` function
  - [x] Implement `requestJoinByCode` function
  - [x] Implement `listJoinRequests` function
  - [x] Implement `reviewJoinRequest` function
  - [x] Implement `rotateInviteToken` function
  - [x] Add error handling and loading states

- [x] **Task 3: Create Join by Token Page**
  - [x] Create `apps/web/src/app/join/[token]/page.tsx`
  - [x] Check authentication status
  - [x] If not authenticated, store token in localStorage and redirect to login
  - [x] If authenticated, load group preview
  - [x] Display group preview (name, member count)
  - [x] Add "Join Group" confirmation button
  - [x] On confirm, join group and redirect to group feed
  - [x] Handle error states

- [x] **Task 4: Create Group Invite Management Page**
  - [x] Create `apps/web/src/app/group/[id]/invite/page.tsx`
  - [x] Display invite link with copy button
  - [x] Add "Regenerate Link" button (admin only)
  - [x] Display pending join requests (admin only)
  - [x] Add approve/deny buttons for each request
  - [x] Show member count and group info
  - [x] Handle admin permission checks

- [x] **Task 5: Update Auth Pages for Invite Flow**
  - [x] Update `apps/web/src/app/login/page.tsx`
  - [x] Support `next` query param for redirect after login
  - [x] Check localStorage for `pendingInviteToken` and redirect accordingly
  - [x] Update `apps/web/src/app/signup/page.tsx`
  - [x] Support `next` query param for redirect after signup
  - [x] Check localStorage for `pendingInviteToken` and redirect accordingly

- [x] **Task 6: Update Join Group Page for Request Flow**
  - [x] Update `apps/web/src/app/join-group/page.tsx`
  - [x] Replace `joinGroup` with `requestJoinByCode`
  - [x] Change "Join Group" button to "Request to Join"
  - [x] Show success message after request submission
  - [x] Update helper text to mention admin approval

## Dev Notes

### Implementation Details

**Security Model:**
- Invite links use long, unguessable tokens (24 bytes base64url = ~32 characters)
- Manual 6-character codes create join requests requiring admin approval
- All join operations go through SECURITY DEFINER functions for proper access control
- RLS policies ensure only requesters and admins can access join requests

**Database Changes:**
- Added `groups.invite_token` column (unique, not null)
- Added `groups.invite_token_rotated_at` for audit trail
- Created `group_join_requests` table with status tracking
- 6 SECURITY DEFINER functions for secure invite operations

**Hooks Created:**
- `useInvites.ts` - Complete invite management hook

**Pages Created:**
- `/join/[token]` - Invite link entrypoint with confirmation
- `/group/[id]/invite` - Admin invite management page

**Pages Updated:**
- `/login` - Added redirect support for invite flow
- `/signup` - Added redirect support for invite flow
- `/join-group` - Changed to request-based flow

### Project Structure Notes

- Web app uses Next.js 15 App Router
- Invite tokens preserved through auth via localStorage + query params
- All invite operations use Supabase RPC functions for security
- Join requests follow approval workflow pattern

### Database Schema

**groups table additions:**
- `invite_token TEXT UNIQUE NOT NULL` - Long, unguessable token
- `invite_token_rotated_at TIMESTAMPTZ` - Audit timestamp

**group_join_requests table:**
- `id`, `group_id`, `requester_id`, `status`, `created_at`, `reviewed_at`, `reviewed_by`
- Unique constraint on `(group_id, requester_id, status)` where status='pending'

### Security Functions

All functions use `SECURITY DEFINER` to run with elevated privileges while enforcing business logic:
- `get_group_invite_preview` - Public, no auth required
- `join_group_by_invite_token` - Requires auth, validates token
- `request_group_join_by_invite_code` - Requires auth, creates request
- `list_group_join_requests` - Admin only, returns requests for group
- `review_group_join_request` - Admin only, approves/denies requests
- `rotate_group_invite_token` - Admin only, generates new token

### References

- [Source: planning-artifacts/epics.md#Story Web.7] - Story requirements
- [Source: planning-artifacts/web-app-design.md] - Web app design patterns
- [Source: supabase/migrations/20260118000000_add_invite_tokens_and_join_requests.sql] - Database migration

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250514)

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created comprehensive secure invite system for web app
- Implemented all 6 tasks with full security best practices
- All acceptance criteria satisfied:
  - AC1: Generate Invite Link - Admin can copy and regenerate links
  - AC2: Join via Invite Link - Full flow with auth redirect and confirmation
  - AC3: Request Join by Code - Manual codes create approval requests
  - AC4: Manage Join Requests - Admin can approve/deny requests

**Key Features:**
- Long, unguessable invite tokens (24 bytes base64url)
- SECURITY DEFINER functions for all invite operations
- Join request approval workflow for manual codes
- Token preservation through auth flow (localStorage + query params)
- Admin-only invite management page

**Technical Notes:**
- All database operations use RPC functions for security
- RLS policies enforce proper access control
- Invite tokens are reusable until rotated
- Manual codes require admin approval (more secure)

### File List

**New Files:**
- `supabase/migrations/20260118000000_add_invite_tokens_and_join_requests.sql` - Database migration
- `apps/web/src/hooks/useInvites.ts` - Invite management hook
- `apps/web/src/app/join/[token]/page.tsx` - Invite link entrypoint page
- `apps/web/src/app/group/[id]/invite/page.tsx` - Admin invite management page
- `_bmad-output/implementation-artifacts/stories/web-7-group-invites-join-requests.md` - Story file

**Modified Files:**
- `apps/web/src/app/login/page.tsx` - Added redirect support for invite flow
- `apps/web/src/app/signup/page.tsx` - Added redirect support for invite flow
- `apps/web/src/app/join-group/page.tsx` - Changed to request-based flow
- `_bmad-output/planning-artifacts/epics.md` - Added Story Web.7
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Added web-7 story tracking
