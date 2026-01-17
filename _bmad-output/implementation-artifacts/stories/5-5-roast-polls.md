---
title: "Story 5.5 - Roast Polls"
aliases:
  - "Story 5.5"
  - "Roast Polls"
tags:
  - cooked
  - implementation
  - story
  - epic-5
  - polls
  - features
status: ready-for-dev
created: 2026-01-16
updated: 2026-01-16
epic: 5
story: 5
related:
  - "[[Architecture]]"
  - "[[Epics]]"
---

# Story 5.5: Roast Polls

Status: ready-for-dev

## Story

As a **group member**,
I want **to vote in polls within roast threads**,
So that **we can collectively rate the fold**.

## Acceptance Criteria

1. **AC1: Preset Polls Display**
   - Given the pact roast level is Medium or Nuclear
   - When I view a roast thread
   - Then I see preset polls displayed
   - And polls are visible to all group members

2. **AC2: "How Bad Was This L?" Poll**
   - Given I see the poll "How bad was this L? (1-10)"
   - When I tap a number
   - Then my vote is recorded
   - And I see the average score update
   - And I cannot vote again (or can change my vote)

3. **AC3: "Was This Avoidable?" Poll**
   - Given I see the poll "Was this avoidable?"
   - When I tap Yes/No/Barely
   - Then my vote is recorded
   - And I see the vote distribution
   - And I cannot vote again (or can change my vote)

4. **AC4: Custom Polls (Nuclear Only)**
   - Given the roast level is Nuclear
   - When I am the thread creator
   - Then I can create a custom poll with custom options
   - And the custom poll appears in the thread
   - And other members can vote on it

## Tasks / Subtasks

- [ ] **Task 1: Create Poll Database Schema** (AC: 1, 2, 3, 4)
  - [ ] Create `polls` table (id, thread_id, created_by, question, status, closes_at, created_at, closed_at)
  - [ ] Create `poll_options` table (id, poll_id, option_text, sort_order, created_at)
  - [ ] Create `poll_votes` table (id, poll_id, option_id, user_id, created_at)
  - [ ] Add foreign key constraints
  - [ ] Add RLS policies for polls, options, and votes

- [ ] **Task 2: Create Preset Polls on Thread Creation** (AC: 1)
  - [ ] When roast thread is created, check roast level
  - [ ] If Medium or Nuclear, create preset polls automatically
  - [ ] Preset poll 1: "How bad was this L? (1-10)" with options 1-10
  - [ ] Preset poll 2: "Was this avoidable?" with options Yes/No/Barely
  - [ ] Link polls to thread_id

- [ ] **Task 3: Display Polls in Thread** (AC: 1, 2, 3)
  - [ ] Query polls for thread
  - [ ] Display polls in thread UI
  - [ ] Show poll question and options
  - [ ] Show current vote counts/distribution
  - [ ] Show user's current vote (if any)
  - [ ] Handle real-time updates when votes change

- [ ] **Task 4: Implement Voting** (AC: 2, 3)
  - [ ] Create vote mutation/function
  - [ ] Validate user hasn't voted (or allow vote change)
  - [ ] Insert/update vote in database
  - [ ] Recalculate vote counts and averages
  - [ ] Update UI in real-time
  - [ ] Handle errors (poll closed, invalid option, etc.)

- [ ] **Task 5: Custom Poll Creation (Nuclear Only)** (AC: 4)
  - [ ] Add "Create Poll" button in thread (only for thread creator, only if Nuclear)
  - [ ] Create poll creation form/modal
  - [ ] Allow custom question text
  - [ ] Allow adding custom options (min 2, max 5)
  - [ ] Save poll to database
  - [ ] Display custom poll in thread

- [ ] **Task 6: Poll Results Display** (AC: 2, 3)
  - [ ] Calculate average for numeric polls (1-10 scale)
  - [ ] Calculate distribution for multiple choice polls
  - [ ] Display results visually (bars, percentages)
  - [ ] Show total vote count
  - [ ] Update results in real-time

## Dev Notes

### Architecture Requirements

**Database Schema:**
```
polls:
  - id (uuid, primary key)
  - thread_id (uuid, foreign key to roast_threads)
  - created_by (uuid, foreign key to users)
  - question (text)
  - status (enum: 'open', 'closed')
  - closes_at (timestamp, nullable)
  - created_at (timestamp)
  - closed_at (timestamp, nullable)

poll_options:
  - id (uuid, primary key)
  - poll_id (uuid, foreign key to polls)
  - option_text (text)
  - sort_order (integer)
  - created_at (timestamp)

poll_votes:
  - id (uuid, primary key)
  - poll_id (uuid, foreign key to polls)
  - option_id (uuid, foreign key to poll_options)
  - user_id (uuid, foreign key to users)
  - created_at (timestamp)
  - UNIQUE constraint on (poll_id, user_id) to prevent double voting
```

**RLS Policies:**
- Users can read polls for threads in their groups
- Users can create polls if they're thread creator and roast level is Nuclear
- Users can vote on open polls in their groups
- Users can read all votes (for results display)

**File Structure:**
- `src/components/polls/Poll.tsx` - Poll display component
- `src/components/polls/PollOption.tsx` - Poll option button
- `src/components/polls/CreatePollModal.tsx` - Custom poll creation
- `src/hooks/usePolls.ts` - Poll data fetching and mutations
- Database migration: `supabase/migrations/YYYYMMDD_add_polls.sql`

### Technical Notes

**From Epics:**
- Implements: FR-ROAST-004
- Creates: poll data structure (separate tables)
- Preset polls for Medium and Nuclear roast levels
- Custom polls only for Nuclear level, thread creator only

**From Architecture:**
- Use Supabase Realtime for live vote updates
- Store polls in PostgreSQL with proper relationships
- Use React Query for poll data fetching
- Handle optimistic updates for voting

**Preset Polls:**
1. "How bad was this L? (1-10)" - Numeric scale, calculate average
2. "Was this avoidable?" - Yes/No/Barely options, show distribution

**Voting Rules:**
- One vote per user per poll
- Allow vote change (update existing vote)
- Polls can be closed manually or auto-close after thread closes
- Show results to all group members

**Integration:**
- Polls appear in roast thread UI
- Polls are created automatically when thread is created (if roast level allows)
- Poll results can be included in weekly recap (future enhancement)

### References

- [Source: planning-artifacts/epics.md#Story-5.5]
- [Source: planning-artifacts/architecture.md#Database-Schema]
- [Source: planning-artifacts/prd.md#FR-ROAST-004]

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD
