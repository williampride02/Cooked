---
title: "Cooked - System Architecture"
aliases:
  - "Architecture"
  - "System Architecture"
  - "Tech Architecture"
tags:
  - cooked
  - planning
  - architecture
  - technical
  - supabase
  - expo
status: draft
created: 2026-01-13
updated: 2026-01-14
related:
  - "[[Product Brief]]"
  - "[[PRD]]"
  - "[[UX Design]]"
  - "[[Epics]]"
---

# Cooked - System Architecture Document

> [!info] Document Info
> **Version**: 1.0 | **Author**: System Architect (via BMad Method) | **Status**: Draft

## 1. Executive Summary

This document defines the technical architecture for Cooked, a mobile-first group accountability application. The architecture prioritizes:

- **Speed to Market**: 2-3 week MVP development timeline
- **Real-time Capabilities**: Live feed updates, instant roast notifications
- **Cost Efficiency**: Start on free/low tiers, scale as needed
- **Developer Experience**: Modern tooling, single codebase for iOS/Android

**Recommended Stack**:
- **Frontend**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Notifications**: Expo Push Notifications
- **Payments**: Stripe (post-MVP)

---

## 2. Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   iOS App    │  │ Android App  │  │  (Web PWA)   │          │
│  │   (Expo)     │  │   (Expo)     │  │   Future     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘          │
│         │                 │                                     │
│         └────────┬────────┘                                     │
│                  │                                              │
│         ┌───────▼────────┐                                     │
│         │   Expo SDK     │                                     │
│         │ (Push, Updates)│                                     │
│         └───────┬────────┘                                     │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  │ HTTPS / WSS
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐         │
│  │   Supabase  │  │  Supabase   │  │    Supabase     │         │
│  │    Auth     │  │   Realtime  │  │  Edge Functions │         │
│  │   (Phone)   │  │ (WebSocket) │  │   (Deno/TS)     │         │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘         │
│         │                │                   │                  │
│         └────────────────┼───────────────────┘                  │
│                          │                                      │
│                  ┌───────▼───────┐                             │
│                  │  PostgreSQL   │                             │
│                  │   Database    │                             │
│                  │ (Row Level    │                             │
│                  │  Security)    │                             │
│                  └───────┬───────┘                             │
│                          │                                      │
│                  ┌───────▼───────┐                             │
│                  │   Supabase    │                             │
│                  │    Storage    │                             │
│                  │  (Images)     │                             │
│                  └───────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Webhooks / API
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Twilio    │  │    GIPHY    │  │   Stripe    │             │
│  │   (SMS)     │  │    API      │  │  (Payments) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  Mixpanel   │  │   Sentry    │                              │
│  │ (Analytics) │  │  (Errors)   │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mobile Framework | Expo (React Native) | Single codebase, OTA updates, push notifications built-in |
| Backend Platform | Supabase | Auth, DB, Realtime, Storage in one platform; generous free tier |
| Database | PostgreSQL (via Supabase) | Relational integrity, RLS for security, proven scalability |
| Real-time | Supabase Realtime | Built-in WebSocket subscriptions, no extra infrastructure |
| Auth Method | Phone/SMS | Matches social app patterns, reduces friction vs email |
| API Style | Direct Supabase Client + Edge Functions | Fastest to build, type-safe with TypeScript |

---

## 3. Component Architecture

### 3.1 Mobile Application (Expo)

```
src/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Auth screens (phone, code, profile)
│   │   ├── phone.tsx
│   │   ├── verify.tsx
│   │   └── profile.tsx
│   ├── (main)/            # Main app (authenticated)
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── feed.tsx       # Group feed
│   │   ├── pacts.tsx      # Pacts list
│   │   └── recap.tsx      # Weekly recap
│   ├── pact/
│   │   ├── [id].tsx       # Pact detail
│   │   └── create.tsx     # Create pact
│   ├── roast/
│   │   └── [id].tsx       # Roast thread
│   └── settings/
│       └── index.tsx      # Profile/settings
├── components/
│   ├── ui/                # Design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   └── ...
│   ├── feed/              # Feed-specific components
│   ├── pact/              # Pact-specific components
│   └── roast/             # Roast-specific components
├── hooks/
│   ├── useAuth.ts         # Auth state
│   ├── useGroup.ts        # Group data
│   ├── usePacts.ts        # Pacts data
│   ├── useRealtime.ts     # Realtime subscriptions
│   └── useNotifications.ts
├── lib/
│   ├── supabase.ts        # Supabase client init
│   ├── api.ts             # API helpers
│   └── storage.ts         # Async storage helpers
├── stores/
│   └── app.ts             # Zustand global state
├── types/
│   └── database.ts        # Generated Supabase types
└── utils/
    ├── date.ts
    ├── format.ts
    └── validation.ts
```

### 3.2 State Management

**Approach**: Zustand for global state + React Query for server state

```typescript
// stores/app.ts
interface AppStore {
  // Auth
  user: User | null;
  session: Session | null;

  // Current group
  currentGroup: Group | null;

  // UI state
  isCheckingIn: boolean;
  activeRoastThread: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setCurrentGroup: (group: Group | null) => void;
}
```

**Server State**: React Query (TanStack Query)
- Pacts list: `useQuery(['pacts', groupId])`
- Feed items: `useInfiniteQuery(['feed', groupId])`
- Roast thread: `useQuery(['roast', threadId])`

### 3.3 Real-time Architecture

```typescript
// hooks/useRealtime.ts
export function useGroupRealtime(groupId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`group:${groupId}`)
      // Listen for new check-ins
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `group_id=eq.${groupId}`
      }, handleNewCheckIn)
      // Listen for new roasts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'roast_responses',
      }, handleNewRoast)
      // Listen for new reactions
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
      }, handleReactionChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);
}
```

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌───────────────┐       ┌───────────────┐
│    users      │       │    groups     │
├───────────────┤       ├───────────────┤
│ id (PK)       │       │ id (PK)       │
│ phone         │       │ name          │
│ display_name  │       │ invite_code   │
│ avatar_url    │       │ created_by    │──┐
│ created_at    │       │ subscription  │  │
│ settings      │       │ created_at    │  │
└───────┬───────┘       └───────────────┘  │
        │                       │          │
        │                       │          │
        └───────────┬───────────┘          │
                    │                      │
            ┌───────▼───────┐              │
            │ group_members │              │
            ├───────────────┤              │
            │ group_id (FK) │              │
            │ user_id (FK)  │◄─────────────┘
            │ role          │
            │ joined_at     │
            │ settings      │
            └───────────────┘
                    │
                    │
            ┌───────▼───────┐       ┌───────────────────┐
            │    pacts      │       │ pact_participants │
            ├───────────────┤       ├───────────────────┤
            │ id (PK)       │◄──────│ pact_id (FK)      │
            │ group_id (FK) │       │ user_id (FK)      │
            │ name          │       │ joined_at         │
            │ description   │       └───────────────────┘
            │ frequency     │
            │ roast_level   │
            │ proof_req     │
            │ created_by    │
            │ start_date    │
            │ end_date      │
            │ status        │
            │ created_at    │
            └───────┬───────┘
                    │
                    │
            ┌───────▼───────┐
            │   check_ins   │
            ├───────────────┤
            │ id (PK)       │
            │ pact_id (FK)  │
            │ user_id (FK)  │
            │ status        │  (success/fold)
            │ excuse        │
            │ proof_url     │
            │ check_in_date │
            │ created_at    │
            └───────┬───────┘
                    │
                    │ (if fold)
            ┌───────▼───────┐
            │ roast_threads │
            ├───────────────┤
            │ id (PK)       │
            │ check_in_id   │──────────────┐
            │ status        │              │
            │ created_at    │              │
            │ closed_at     │              │
            └───────┬───────┘              │
                    │                      │
                    │                      │
            ┌───────▼────────┐      ┌──────▼────────┐
            │ roast_responses│      │   reactions   │
            ├────────────────┤      ├───────────────┤
            │ id (PK)        │      │ id (PK)       │
            │ thread_id (FK) │      │ target_type   │
            │ user_id (FK)   │      │ target_id     │
            │ content_type   │      │ user_id (FK)  │
            │ content        │      │ emoji         │
            │ is_pinned      │      │ created_at    │
            │ created_at     │      └───────────────┘
            └────────────────┘

            ┌───────────────┐
            │ weekly_recaps │
            ├───────────────┤
            │ id (PK)       │
            │ group_id (FK) │
            │ week_start    │
            │ week_end      │
            │ data (JSONB)  │
            │ created_at    │
            └───────────────┘
```

### 4.2 Database Schema (SQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 20),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Pacts table
CREATE TABLE pacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'muted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Roast responses
CREATE TABLE roast_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES roast_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'gif', 'image')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions (polymorphic)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('check_in', 'roast_response')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('skull', 'cap', 'clown', 'salute', 'fire', 'clap')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (target_type, target_id, user_id)
);

-- Weekly recaps
CREATE TABLE weekly_recaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, week_start)
);

-- Indexes for performance
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_pacts_group ON pacts(group_id) WHERE status = 'active';
CREATE INDEX idx_check_ins_pact_date ON check_ins(pact_id, check_in_date DESC);
CREATE INDEX idx_check_ins_user ON check_ins(user_id);
CREATE INDEX idx_roast_responses_thread ON roast_responses(thread_id);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
```

### 4.3 Row Level Security (RLS) Policies

```sql
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

-- Users: can read own profile, update own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Groups: members can read their groups
CREATE POLICY "Members can read their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Group members: can see members of their groups
CREATE POLICY "Can see group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Pacts: members can read pacts in their groups
CREATE POLICY "Members can read group pacts"
  ON pacts FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Check-ins: members can read check-ins in their groups
CREATE POLICY "Members can read group check-ins"
  ON check_ins FOR SELECT
  USING (
    pact_id IN (
      SELECT p.id FROM pacts p
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- Users can create their own check-ins
CREATE POLICY "Users can create own check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND pact_id IN (
      SELECT pact_id FROM pact_participants WHERE user_id = auth.uid()
    )
  );

-- Similar policies for roast_threads, roast_responses, reactions, weekly_recaps...
```

---

## 5. API Design

### 5.1 API Strategy

**Primary**: Direct Supabase Client SDK
- Most CRUD operations use Supabase client directly
- RLS handles authorization
- Real-time subscriptions built-in

**Secondary**: Edge Functions (for complex operations)
- Weekly recap generation
- Push notification dispatch
- Invite link handling
- Stats calculations

### 5.2 Edge Functions

```
supabase/functions/
├── generate-recap/        # Weekly recap generation (cron)
├── send-notification/     # Push notification dispatch
├── process-invite/        # Handle invite link joins
├── calculate-streaks/     # Update streak counts
└── auto-fold-checkins/    # Mark missed check-ins as folds (cron)
```

#### Example: generate-recap

```typescript
// supabase/functions/generate-recap/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get all active groups
  const { data: groups } = await supabase
    .from('groups')
    .select('id');

  for (const group of groups || []) {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    // Get check-ins for the week
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select(`
        *,
        user:users(id, display_name),
        pact:pacts(group_id)
      `)
      .eq('pact.group_id', group.id)
      .gte('check_in_date', weekStart)
      .lte('check_in_date', weekEnd);

    // Calculate awards
    const recapData = calculateRecapData(checkIns);

    // Store recap
    await supabase
      .from('weekly_recaps')
      .upsert({
        group_id: group.id,
        week_start: weekStart,
        week_end: weekEnd,
        data: recapData
      });

    // Send notifications
    await sendRecapNotifications(group.id, recapData);
  }

  return new Response(JSON.stringify({ success: true }));
});
```

### 5.3 Client SDK Usage Examples

```typescript
// lib/api.ts

// Get user's groups
export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group:groups(
        id,
        name,
        invite_code,
        subscription_status
      )
    `)
    .eq('user_id', userId);

  return { data: data?.map(d => d.group), error };
}

// Get group feed
export async function getGroupFeed(groupId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      *,
      user:users(id, display_name, avatar_url),
      pact:pacts(id, name, group_id),
      roast_thread:roast_threads(id, status),
      reactions(emoji, user_id)
    `)
    .eq('pact.group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data, error };
}

// Create check-in
export async function createCheckIn(
  pactId: string,
  userId: string,
  status: 'success' | 'fold',
  excuse?: string,
  proofUrl?: string
) {
  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      pact_id: pactId,
      user_id: userId,
      status,
      excuse,
      proof_url: proofUrl,
      check_in_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  // If fold, create roast thread
  if (status === 'fold' && data) {
    await supabase
      .from('roast_threads')
      .insert({ check_in_id: data.id });
  }

  return { data, error };
}

// Add reaction
export async function addReaction(
  targetType: 'check_in' | 'roast_response',
  targetId: string,
  emoji: string
) {
  const { data, error } = await supabase
    .from('reactions')
    .upsert({
      target_type: targetType,
      target_id: targetId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      emoji
    });

  return { data, error };
}
```

---

## 6. Authentication & Security

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHONE AUTH FLOW                              │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Enter   │    │  Twilio  │    │  Enter   │    │  Create  │ │
│  │  Phone   │───▶│  Sends   │───▶│  Code    │───▶│  Session │ │
│  │          │    │  SMS     │    │          │    │          │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Supabase Phone Auth Configuration**:
```typescript
// Phone sign-in
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+15551234567'
});

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+15551234567',
  token: '123456',
  type: 'sms'
});
```

### 6.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| Authentication | Supabase Auth (phone/SMS) |
| Authorization | Row Level Security (RLS) |
| Transport | HTTPS/WSS only |
| Token Storage | Secure storage (Keychain/Keystore) |
| Rate Limiting | Supabase built-in + Edge Function limits |
| Input Validation | Client + Server (PostgreSQL constraints) |
| SQL Injection | Parameterized queries (Supabase SDK) |
| XSS | React Native (no HTML rendering) |

### 6.3 Data Privacy

- Phone numbers stored hashed for auth, not displayed
- Profile photos stored in private Supabase Storage bucket
- RLS ensures users only see data from their groups
- Deleted accounts anonymized after 30 days
- No third-party analytics without consent

---

## 7. Push Notifications

### 7.1 Notification Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Event (Check-in, Roast, etc.)                                │
│              │                                                  │
│              ▼                                                  │
│   ┌──────────────────┐                                         │
│   │ Database Trigger │                                         │
│   │   (PostgreSQL)   │                                         │
│   └────────┬─────────┘                                         │
│            │                                                    │
│            ▼                                                    │
│   ┌──────────────────┐                                         │
│   │  Edge Function   │                                         │
│   │ send-notification│                                         │
│   └────────┬─────────┘                                         │
│            │                                                    │
│            ▼                                                    │
│   ┌──────────────────┐    ┌──────────────────┐                │
│   │   Expo Push      │───▶│   APNs / FCM     │                │
│   │   Service        │    │                  │                │
│   └──────────────────┘    └────────┬─────────┘                │
│                                    │                           │
│                                    ▼                           │
│                           ┌──────────────────┐                │
│                           │   User Device    │                │
│                           └──────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Notification Types

```typescript
// Notification payloads
const notificationTypes = {
  CHECK_IN_REMINDER: {
    title: "Clock's ticking... ⏰",
    body: "Don't forget to check in on {{pactName}}"
  },
  SOMEONE_FOLDED: {
    title: "{{userName}} folded 🔥",
    body: "Time to cook them on {{pactName}}"
  },
  TAGGED_IN_ROAST: {
    title: "You got called out 💀",
    body: "{{userName}} mentioned you in a roast"
  },
  NEW_ROAST: {
    title: "New roast dropped",
    body: "{{userName}}: {{preview}}"
  },
  WEEKLY_RECAP: {
    title: "Your receipts are ready 🧾",
    body: "This week's recap just dropped"
  }
};
```

### 7.3 Expo Push Implementation

```typescript
// hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

export function useNotificationSetup() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id'
    });

    // Store token in database
    await supabase
      .from('users')
      .update({ push_token: token.data })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);
  }
}
```

---

## 8. File Storage

### 8.1 Storage Structure

```
storage/
├── avatars/
│   └── {user_id}/
│       └── avatar.jpg
├── proofs/
│   └── {check_in_id}/
│       └── proof.jpg
└── roasts/
    └── {response_id}/
        └── image.jpg
```

### 8.2 Storage Policies

```sql
-- Avatar storage policy
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Proof storage policy
CREATE POLICY "Users can upload proofs for own check-ins"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proofs'
    AND EXISTS (
      SELECT 1 FROM check_ins
      WHERE id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
  );
```

### 8.3 Image Processing

- Client-side compression before upload (max 1MB)
- Supabase Image Transformation for thumbnails
- CDN caching for frequently accessed images

---

## 9. Performance Considerations

### 9.1 Optimization Strategies

| Area | Strategy |
|------|----------|
| Database | Proper indexes, query optimization, connection pooling |
| Real-time | Channel-based subscriptions, limit broadcast scope |
| Images | Compression, lazy loading, CDN caching |
| App | Code splitting, memo/callback optimization, virtualized lists |
| Network | Request batching, optimistic updates, offline support |

### 9.2 Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      cacheTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 2
    }
  }
});
```

### 9.3 Offline Support (Future)

- React Query persistence for offline viewing
- Queue mutations when offline
- Sync on reconnection

---

## 10. Monitoring & Observability

### 10.1 Error Tracking (Sentry)

```typescript
// App initialization
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: false,
  debug: __DEV__
});
```

### 10.2 Analytics (Mixpanel)

```typescript
// Key events to track
const events = {
  CHECK_IN_SUCCESS: 'Check In - Success',
  CHECK_IN_FOLD: 'Check In - Fold',
  ROAST_SENT: 'Roast Sent',
  REACTION_ADDED: 'Reaction Added',
  PACT_CREATED: 'Pact Created',
  GROUP_JOINED: 'Group Joined',
  RECAP_VIEWED: 'Recap Viewed',
  RECAP_SHARED: 'Recap Shared'
};
```

### 10.3 Supabase Dashboard

- Real-time database metrics
- Auth analytics
- API request logs
- Storage usage

---

## 11. Deployment & DevOps

### 11.1 Environments

| Environment | Purpose | Supabase Project |
|-------------|---------|------------------|
| Development | Local development | cooked-dev |
| Staging | Pre-production testing | cooked-staging |
| Production | Live app | cooked-prod |

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npx expo export

      - name: Deploy to Expo
        run: npx eas update --branch production
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 11.3 OTA Updates

- Expo EAS Update for instant updates
- Major version changes require app store submission
- Gradual rollouts for risky changes

---

## 12. Scalability Roadmap

### 12.1 Phase 1: MVP (0-1,000 users)

- Single Supabase project (free tier)
- Basic indexes
- Minimal Edge Functions

### 12.2 Phase 2: Growth (1,000-10,000 users)

- Supabase Pro tier
- Read replicas consideration
- CDN for static assets
- APM implementation

### 12.3 Phase 3: Scale (10,000+ users)

- Supabase Enterprise or self-hosted
- Database sharding by group
- Dedicated real-time infrastructure
- Multi-region deployment

---

## 13. Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase outage | Low | High | Graceful degradation, offline mode |
| Real-time latency | Medium | Medium | Optimistic updates, fallback polling |
| Push notification failures | Medium | Medium | In-app notification fallback |
| Database performance | Low | High | Proper indexes, query monitoring |
| App Store rejection | Low | High | Follow guidelines, document safety features |

---

## 14. References

- PRD: `/planning-artifacts/prd.md`
- UX Design: `/planning-artifacts/ux-design.md`
- Product Brief: `/planning-artifacts/product-brief.md`
- Research: `/planning-artifacts/research-competitive-analysis.md`

---

## 15. Appendix

### 15.1 Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Expo SDK | 50+ | Latest stable |
| React Native | 0.73+ | Via Expo |
| TypeScript | 5.0+ | Strict mode |
| Supabase JS | 2.x | Latest |
| React Query | 5.x | TanStack Query |
| Zustand | 4.x | State management |

### 15.2 Third-Party Service Costs (Estimated)

| Service | Free Tier | Projected Monthly (10k users) |
|---------|-----------|-------------------------------|
| Supabase | 500MB DB, 2GB storage | $25-50 (Pro) |
| Expo | Unlimited builds | $0 (free tier) |
| Twilio (SMS) | N/A | $50-100 |
| GIPHY | 100k/day | $0 (free tier) |
| Sentry | 5k events | $0-26 |
| Mixpanel | 100k events | $0 (free tier) |

**Total estimated monthly cost at 10k users**: $100-200

---

## Related Documents

- [[Product Brief]] - Product vision and strategy
- [[PRD]] - Full product requirements
- [[UX Design]] - Design system and screens
- [[Epics]] - Implementation epics and stories
