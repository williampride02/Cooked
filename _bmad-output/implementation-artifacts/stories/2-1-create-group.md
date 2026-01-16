---
title: "Story 2.1 - Create Group"
aliases:
  - "Story 2.1"
  - "Create Group"
tags:
  - cooked
  - implementation
  - story
  - epic-2
  - groups
status: in-progress
created: 2026-01-14
updated: 2026-01-14
epic: 2
story: 1
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
---

# Story 2.1: Create Group

Status: in-progress

## Story

As a **user who wants to start an accountability group**,
I want **to create a new group with a name**,
So that **I can invite my friends to join**.

## Acceptance Criteria

1. **AC1: Create Group Button**
   - Given I am on the create/join group screen
   - When I tap "Create a Group"
   - Then I see a form to enter a group name

2. **AC2: Group Name Validation**
   - Given I am entering a group name
   - When the name is 2-30 characters
   - Then the name is accepted
   - And I can tap "Create"

3. **AC3: Group Creation Success**
   - Given I tap Create with a valid name
   - When the group is created
   - Then a unique invite code is generated
   - And I am set as the group admin
   - And I am added as a member
   - And I am navigated to the group's invite screen

4. **AC4: Group Creation Error**
   - Given I try to create a group and an error occurs
   - When the creation fails
   - Then I see an error message
   - And I remain on the create screen

## Tasks / Subtasks

- [x] **Task 1: Create Group Types**
  - [x] Create `src/types/groups.ts` with Group and GroupMember types

- [x] **Task 2: Create useGroups Hook**
  - [x] Create `src/hooks/useGroups.ts`
  - [x] Implement createGroup function
  - [x] Implement fetchUserGroups function

- [x] **Task 3: Create Group Form Screen**
  - [x] Create `src/app/(main)/create-group.tsx`
  - [x] Add group name input with validation (2-30 chars)
  - [x] Add character counter
  - [x] Add Create button

- [x] **Task 4: Create Invite Screen**
  - [x] Create `src/app/(main)/group/[id]/invite.tsx`
  - [x] Show invite code
  - [x] Show copy/share buttons (placeholder for Story 2.2)

- [x] **Task 5: Update Main Screen**
  - [x] Update `src/app/(main)/index.tsx` to navigate to create-group

## Dev Notes

### Database Schema Required

```sql
-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 30),
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
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

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups: Users can view groups they're members of
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Groups: Users can create groups
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Group members: Users can view members of their groups
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Group members: Users can join groups (insert themselves)
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### References

- [Source: planning-artifacts/architecture.md#4.2] - Database schema
- [Source: planning-artifacts/epics.md#Story 2.1] - Story requirements

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### File List

- `src/types/groups.ts` - Group and GroupMember types
- `src/hooks/useGroups.ts` - Group management hook
- `src/app/(main)/create-group.tsx` - Create group form
- `src/app/(main)/group/[id]/invite.tsx` - Group invite screen
- `src/app/(main)/index.tsx` - Updated with navigation

## Related Documents

- [[Architecture]] - Database schema
- [[UX Design]] - Create group flow
- [[Epics]] - All stories for Epic 2
