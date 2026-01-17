---
title: "Cooked - Epics and Stories"
aliases:
  - "Epics"
  - "Stories"
  - "Backlog"
tags:
  - cooked
  - planning
  - epics
  - stories
  - implementation
status: draft
created: 2026-01-14
updated: 2026-01-14
related:
  - "[[Product Brief]]"
  - "[[PRD]]"
  - "[[Architecture]]"
  - "[[UX Design]]"
---

# Cooked - Epics and Stories

> [!info] Document Info
> **Status**: Draft | Auto-generated from PRD and Architecture

## Overview

This document provides the complete epic and story breakdown for Cooked, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & User Management**
- FR-AUTH-001: Phone Number Authentication (P0) - Users authenticate via phone number with SMS verification code
- FR-AUTH-002: User Profile (P0) - Users have a minimal profile (name, photo, phone)
- FR-AUTH-003: Account Deletion (P1) - Users can delete their account with data removal

**Group Management**
- FR-GROUP-001: Create Group (P0) - Users can create accountability groups (min 3, max 10 members)
- FR-GROUP-002: Join Group via Invite Link (P0) - Users join groups through shareable deep links
- FR-GROUP-003: Leave Group (P0) - Users can leave groups voluntarily
- FR-GROUP-004: Remove Member (P1) - Admins can remove members from groups
- FR-GROUP-005: Transfer Admin (P1) - Admins can transfer admin role to other members

**Pact System**
- FR-PACT-001: Create Pact (P0) - Users create accountability pacts with name, frequency, roast level, proof requirement
- FR-PACT-002: Pact Types (P1) - Support Individual, Group, and Relay pact structures
- FR-PACT-003: Edit Pact (P1) - Pact creator can modify pact settings
- FR-PACT-004: Archive Pact (P1) - End a pact without deleting history
- FR-PACT-005: Pact Stats (P1) - Track completion rate, streaks per participant

**Check-in System**
- FR-CHECKIN-001: Daily Check-in (P0) - Binary check-in: "I did it" or "I folded"
- FR-CHECKIN-002: Excuse Selection (P0) - Users select excuse when folding (preset or custom)
- FR-CHECKIN-003: Proof Submission (P1) - Users submit photo proof of completion
- FR-CHECKIN-004: Check-in Reminder (P0) - Push notification reminders at configured time
- FR-CHECKIN-005: Missed Check-in Handling (P0) - Auto-fold if no check-in by end of day

**Roast Thread System**
- FR-ROAST-001: Roast Thread Creation (P0) - Thread auto-opens when user folds
- FR-ROAST-002: Roast Responses (P0) - Text, GIF, image responses with emoji reactions
- FR-ROAST-003: Roast Level Enforcement (P0) - Limit features by roast level (Mild/Medium/Nuclear)
- FR-ROAST-004: Roast Polls (P1) - Quick polls in roast threads
- FR-ROAST-005: Best Roast Pin (P1) - Highlight most-reacted roast
- FR-ROAST-006: Mute/Pause Roasting (P0) - User safety controls (mute, safe word)

**Group Feed**
- FR-FEED-001: Activity Feed (P0) - Chronological group activity with real-time updates
- FR-FEED-002: Feed Item Types (P0) - Success, fold, new pact, new member, recap items
- FR-FEED-003: Quick Reactions (P0) - React to feed items with emoji

**Weekly Recap**
- FR-RECAP-001: Auto-Generated Recap (P0) - Weekly summary generated every Sunday
- FR-RECAP-002: Recap Contents (P0) - Awards, stats, highlights
- FR-RECAP-003: Shareable Recap Card (P1) - Image for social sharing

**Notifications**
- FR-NOTIF-001: Push Notification Types (P0) - Check-in reminder, fold, tagged, recap ready
- FR-NOTIF-002: Notification Preferences (P1) - Toggle types, quiet hours, frequency caps
- FR-NOTIF-003: Notification Copy (P1) - On-brand roasty notification text

**Subscription & Payments**
- FR-PAY-001: Free Tier (P0) - 1 group, 3 pacts max, basic features
- FR-PAY-002: Premium Tier (P1) - $4.99/month per group, unlimited pacts, full history
- FR-PAY-003: Payment Processing (P1) - App Store / Play Store billing integration
- FR-PAY-004: Stakes (P2) - Money stakes between friends (post-MVP)

### Non-Functional Requirements

**Performance**
- NFR-PERF-001: App Launch Time - Cold start < 3s, warm start < 1s
- NFR-PERF-002: Feed Load Time - Initial < 2s, pagination < 1s
- NFR-PERF-003: Real-time Updates - Latency < 500ms
- NFR-PERF-004: Concurrent Users - Support 10,000+, scalable to 100,000+

**Reliability**
- NFR-REL-001: Uptime - 99.5% availability
- NFR-REL-002: Data Durability - No data loss, daily backups, point-in-time recovery

**Security**
- NFR-SEC-001: Authentication - Phone verification, 30-day session tokens, secure storage
- NFR-SEC-002: Data Protection - HTTPS, encryption at rest, no PII in logs
- NFR-SEC-003: Content Safety - Moderation, report mechanism, rate limiting

**Scalability**
- NFR-SCALE-001: Horizontal Scaling - Stateless API, read replicas, CDN
- NFR-SCALE-002: Cost Efficiency - Optimize for Supabase free tier initially

**Usability**
- NFR-USE-001: Accessibility - AA contrast, screen reader compatible, 44x44pt touch targets
- NFR-USE-002: Localization - English only MVP, architecture supports i18n

**Compatibility**
- NFR-COMPAT-001: Platform Support - iOS 15+, Android 10+
- NFR-COMPAT-002: Device Support - iPhone 8+, Android devices from 2020+

### Additional Requirements

**From Architecture:**
- ARCH-001: Tech Stack - Expo (React Native) for cross-platform mobile app
- ARCH-002: Backend Platform - Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- ARCH-003: Database - PostgreSQL with Row Level Security (RLS) policies
- ARCH-004: Real-time - Supabase Realtime WebSocket subscriptions for live updates
- ARCH-005: Edge Functions - Deno/TypeScript functions for recap generation, notifications, invite processing, streak calculation, auto-fold handling
- ARCH-006: File Storage - Supabase Storage for avatars, proof images, roast images
- ARCH-007: External Services - Twilio (SMS), GIPHY API, Expo Push, Mixpanel, Sentry
- ARCH-008: State Management - Zustand for global state, React Query for server state
- ARCH-009: Project Structure - Expo Router file-based routing, component-based architecture

**From UX Design:**
- UX-001: Design System - Dark mode only, fire/orange accent colors (#FF4D00, #FF8A00)
- UX-002: Typography - Inter font family, defined type scale (Display to Caption)
- UX-003: Component Library - Buttons (Primary/Secondary/Ghost), Cards, Avatars, Reactions, Inputs
- UX-004: One-Tap Principle - All core actions achievable in one tap
- UX-005: Emotional Design - "Group chat energy", personality over polish
- UX-006: Safety UX - Mute/pause features prominent but non-intrusive
- UX-007: Screen Specifications - 10+ screens defined with wireframes
- UX-008: Animations - Check-in success confetti, fold reactions, haptic feedback

### FR Coverage Map

| FR ID | Epic | Description |
|-------|------|-------------|
| FR-AUTH-001 | Epic 1 | Phone Number Authentication |
| FR-AUTH-002 | Epic 1 | User Profile |
| FR-AUTH-003 | Epic 1 | Account Deletion |
| FR-GROUP-001 | Epic 2 | Create Group |
| FR-GROUP-002 | Epic 2 | Join Group via Invite Link |
| FR-GROUP-003 | Epic 2 | Leave Group |
| FR-GROUP-004 | Epic 2 | Remove Member |
| FR-GROUP-005 | Epic 2 | Transfer Admin |
| FR-FEED-001 | Epic 2 | Activity Feed |
| FR-FEED-002 | Epic 2 | Feed Item Types |
| FR-FEED-003 | Epic 2 | Quick Reactions |
| FR-PACT-001 | Epic 3 | Create Pact |
| FR-PACT-002 | Epic 3 | Pact Types |
| FR-PACT-003 | Epic 3 | Edit Pact |
| FR-PACT-004 | Epic 3 | Archive Pact |
| FR-PACT-005 | Epic 3 | Pact Stats |
| FR-CHECKIN-001 | Epic 4 | Daily Check-in |
| FR-CHECKIN-002 | Epic 4 | Excuse Selection |
| FR-CHECKIN-003 | Epic 4 | Proof Submission |
| FR-CHECKIN-004 | Epic 4 | Check-in Reminder |
| FR-CHECKIN-005 | Epic 4 | Missed Check-in Handling |
| FR-ROAST-001 | Epic 5 | Roast Thread Creation |
| FR-ROAST-002 | Epic 5 | Roast Responses |
| FR-ROAST-003 | Epic 5 | Roast Level Enforcement |
| FR-ROAST-004 | Epic 5 | Roast Polls |
| FR-ROAST-005 | Epic 5 | Best Roast Pin |
| FR-ROAST-006 | Epic 5 | Mute/Pause Roasting |
| FR-RECAP-001 | Epic 6 | Auto-Generated Recap |
| FR-RECAP-002 | Epic 6 | Recap Contents |
| FR-RECAP-003 | Epic 6 | Shareable Recap Card |
| FR-NOTIF-001 | Epic 6 | Push Notification Types |
| FR-NOTIF-002 | Epic 6 | Notification Preferences |
| FR-NOTIF-003 | Epic 6 | Notification Copy |
| FR-PAY-001 | Epic 7 | Free Tier |
| FR-PAY-002 | Epic 7 | Premium Tier |
| FR-PAY-003 | Epic 7 | Payment Processing |
| FR-PAY-004 | Epic 7 | Stakes (Post-MVP) |

## Epic List

### Epic 1: Foundation & Authentication
Users can download the app, create an account with their phone number, set up their profile, and manage their account settings. This epic establishes the technical foundation (Expo + Supabase setup) and core authentication flows.

**FRs Covered:** FR-AUTH-001, FR-AUTH-002, FR-AUTH-003

**Technical Notes:**
- Includes Expo project initialization with TypeScript
- Supabase project setup with phone auth
- Database schema for users table
- Design system foundation (colors, typography, components)

---

### Epic 2: Groups & Social Foundation
Users can create accountability groups, generate invite links to share with friends, join groups via deep links, and see a live activity feed. Admins can manage group membership.

**FRs Covered:** FR-GROUP-001, FR-GROUP-002, FR-GROUP-003, FR-GROUP-004, FR-GROUP-005, FR-FEED-001, FR-FEED-002, FR-FEED-003

**Technical Notes:**
- Groups, group_members tables with RLS
- Deep linking for invite flow
- Real-time feed subscriptions
- Reaction system (polymorphic)

---

### Epic 3: Pact Creation & Management
Users can create accountability pacts with customizable settings (frequency, roast level, proof requirements), manage pact participants, edit pact details, archive completed pacts, and view pact statistics.

**FRs Covered:** FR-PACT-001, FR-PACT-002, FR-PACT-003, FR-PACT-004, FR-PACT-005

**Technical Notes:**
- Pacts, pact_participants tables
- Support for Individual, Group, Relay pact types
- Streak calculation logic
- Pact stats aggregation

---

### Epic 4: Daily Check-ins
Users can check in on their active pacts with a single tap, submit optional proof photos, select excuses when folding, receive configurable reminders, and have missed check-ins automatically handled.

**FRs Covered:** FR-CHECKIN-001, FR-CHECKIN-002, FR-CHECKIN-003, FR-CHECKIN-004, FR-CHECKIN-005

**Technical Notes:**
- Check_ins table with date constraints
- Supabase Storage for proof images
- Push notification scheduling
- Edge Function for auto-fold cron job

---

### Epic 5: Roast Threads & Reactions
Users can participate in roast threads when someone folds, respond with text/GIFs/images, vote in polls, see the best roast pinned, and use safety controls to mute or pause roasting.

**FRs Covered:** FR-ROAST-001, FR-ROAST-002, FR-ROAST-003, FR-ROAST-004, FR-ROAST-005, FR-ROAST-006

**Technical Notes:**
- Roast_threads, roast_responses tables
- GIPHY API integration
- Roast level enforcement logic
- Poll system
- Real-time thread updates

---

### Epic 6: Weekly Recaps & Notifications
Users receive auto-generated weekly recaps with awards and stats, get push notifications for key events, can customize notification preferences, and share recap cards to social media.

**FRs Covered:** FR-RECAP-001, FR-RECAP-002, FR-RECAP-003, FR-NOTIF-001, FR-NOTIF-002, FR-NOTIF-003

**Technical Notes:**
- Weekly_recaps table with JSONB data
- Edge Function for recap generation (Sunday cron)
- Expo Push Notifications
- Share sheet integration
- Recap card image generation

---

### Epic 7: Monetization & Premium Features
Users can access the free tier with limited features, subscribe to premium for unlimited pacts and full history, manage their subscription through native app store billing.

**FRs Covered:** FR-PAY-001, FR-PAY-002, FR-PAY-003, FR-PAY-004

**Technical Notes:**
- App Store / Play Store in-app purchases
- Subscription status tracking
- Feature gating based on subscription
- FR-PAY-004 (Stakes) deferred to post-MVP

---

### Epic Web: Web Application
Users can access Cooked from web browsers with full feature parity to mobile app, enabling backend testing during development and cross-platform access in production. Includes dual authentication (email/password + phone/OTP), account linking, and all core features accessible via web interface.

**FRs Covered:** All mobile FRs (web implementation), plus:
- Web-AUTH-001: Dual Authentication (email/password + phone/OTP)
- Web-AUTH-002: Account Linking (email ↔ phone)
- Web-FEAT-001: Web Dashboard & Groups
- Web-FEAT-002: Web Pacts Management
- Web-FEAT-003: Web Check-in Interface
- Web-FEAT-004: Real-time Feed Updates
- Web-FEAT-005: Web Roast Threads
- Web-FEAT-006: Web Weekly Recaps

**Technical Notes:**
- Next.js 15 App Router
- Supabase SSR for authentication
- Shared types from `@cooked/shared` package
- Tailwind CSS (matches mobile design system)
- Real-time via Supabase Realtime WebSocket
- Responsive design (desktop-first, mobile-friendly)

---

## Epic 1: Foundation & Authentication

### Story 1.1: Project Setup and Design System Foundation

As a **developer**,
I want **an initialized Expo project with Supabase integration and design system foundation**,
So that **I have the technical infrastructure to build the app**.

**Acceptance Criteria:**

**Given** no existing project
**When** I run the project setup
**Then** an Expo project is created with TypeScript configuration
**And** Supabase client is initialized with environment variables
**And** Expo Router file-based routing is configured
**And** Design system tokens are defined (colors, typography, spacing per UX spec)
**And** Base UI components are created (Button, Card, Avatar, Input)
**And** Zustand store is set up for global state
**And** React Query is configured for server state

**Technical Notes:**
- Creates: Expo project structure per architecture spec
- Integrates: Supabase JS client
- Implements: ARCH-001, ARCH-002, ARCH-008, ARCH-009, UX-001, UX-002, UX-003

---

### Story 1.2: Phone Number Entry Screen

As a **new user**,
I want **to enter my phone number to start the sign-up process**,
So that **I can create an account using my phone**.

**Acceptance Criteria:**

**Given** I am on the welcome screen
**When** I tap "Get Started"
**Then** I see the phone number entry screen
**And** I can select my country code from a picker
**And** I can enter my phone number
**And** the phone number is validated for correct format (E.164)
**And** I see an error message if the format is invalid
**And** I can tap "Continue" to request an SMS code

**Given** I enter a valid phone number and tap Continue
**When** the system processes my request
**Then** Supabase Auth sends a 6-digit SMS code to my phone
**And** I am navigated to the code verification screen

**Technical Notes:**
- Creates: users table in Supabase (id, phone, display_name, avatar_url, created_at, settings)
- Implements: FR-AUTH-001 (partial)

---

### Story 1.3: SMS Code Verification

As a **user who requested an SMS code**,
I want **to enter the verification code I received**,
So that **I can verify my phone number and access my account**.

**Acceptance Criteria:**

**Given** I am on the code verification screen
**When** I enter the 6-digit code
**Then** each digit appears in its own input box
**And** the cursor automatically moves to the next box

**Given** I enter a valid code within 10 minutes
**When** the system verifies the code
**Then** my session is created
**And** I am navigated to profile setup (new user) or home (existing user)

**Given** I enter an invalid code
**When** the system rejects the code
**Then** I see an error message "Invalid code. Please try again."
**And** I can re-enter the code

**Given** I didn't receive a code
**When** 60 seconds have passed
**Then** I can tap "Resend code" to request a new one

**Technical Notes:**
- Implements: FR-AUTH-001 (complete)
- Uses: Supabase verifyOtp()

---

### Story 1.4: Profile Setup

As a **new user who verified their phone**,
I want **to set up my profile with a display name and optional photo**,
So that **my friends can recognize me in the app**.

**Acceptance Criteria:**

**Given** I am a new user on the profile setup screen
**When** I view the screen
**Then** I see a placeholder avatar I can tap to add a photo
**And** I see a text input for my display name

**Given** I tap the avatar placeholder
**When** the image picker opens
**Then** I can choose from camera or gallery
**And** the selected image is cropped to square
**And** the image is compressed to max 1MB
**And** the image is uploaded to Supabase Storage

**Given** I enter a display name
**When** I type in the input
**Then** the name must be 2-20 characters
**And** I see character count feedback
**And** I see an error if outside valid range

**Given** I complete my profile
**When** I tap "Let's Go"
**Then** my profile is saved to the database
**And** I am navigated to the create/join group screen

**Technical Notes:**
- Creates: avatars storage bucket in Supabase
- Implements: FR-AUTH-002

---

### Story 1.5: User Profile Viewing and Editing

As an **existing user**,
I want **to view and edit my profile information**,
So that **I can keep my information up to date**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Settings > Profile
**Then** I see my current avatar, display name, phone number (masked), and member since date

**Given** I want to change my avatar
**When** I tap on my avatar
**Then** I can select a new photo from camera or gallery
**And** the new photo replaces the old one

**Given** I want to change my display name
**When** I tap on my name
**Then** I can edit it inline
**And** the change is saved when I tap done

**Technical Notes:**
- Implements: FR-AUTH-002 (edit capability)

---

### Story 1.6: Account Deletion

As a **user who wants to leave the platform**,
I want **to delete my account and all my data**,
So that **my information is removed from the system**.

**Acceptance Criteria:**

**Given** I am on the Settings screen
**When** I tap "Delete Account"
**Then** I see a confirmation dialog explaining what will happen

**Given** I confirm account deletion
**When** the deletion is processed
**Then** I am logged out immediately
**And** my user record is marked for deletion
**And** I am removed from all groups
**And** my check-in history is anonymized (display name becomes "Deleted User")
**And** all my data is purged within 30 days

**Given** I cancel the deletion
**When** I tap "Cancel"
**Then** nothing happens and I remain on the Settings screen

**Technical Notes:**
- Implements: FR-AUTH-003
- Requires: Database trigger or Edge Function for cleanup

---

## Epic 2: Groups & Social Foundation

### Story 2.1: Create Group

As a **user who wants to start an accountability group**,
I want **to create a new group with a name**,
So that **I can invite my friends to join**.

**Acceptance Criteria:**

**Given** I am on the create/join group screen
**When** I tap "Create a Group"
**Then** I see a form to enter a group name

**Given** I enter a group name
**When** the name is 2-30 characters
**Then** the name is accepted
**And** I can tap "Create"

**Given** I tap Create with a valid name
**When** the group is created
**Then** a unique invite code is generated
**And** I am set as the group admin
**And** I am added as a member
**And** I am navigated to the group's invite screen

**Technical Notes:**
- Creates: groups table (id, name, invite_code, created_by, subscription_status, created_at)
- Creates: group_members table (group_id, user_id, role, joined_at, settings)
- Creates: RLS policies for groups and group_members
- Implements: FR-GROUP-001

---

### Story 2.2: Generate and Share Invite Link

As a **group admin**,
I want **to generate and share an invite link**,
So that **my friends can easily join my group**.

**Acceptance Criteria:**

**Given** I am a group admin
**When** I view the group or tap "Invite Friends"
**Then** I see the invite link displayed
**And** I see a "Copy Link" button
**And** I see a "Share" button

**Given** I tap "Copy Link"
**When** the action completes
**Then** the link is copied to clipboard
**And** I see a confirmation toast "Link copied!"

**Given** I tap "Share"
**When** the share sheet opens
**Then** I can share via Messages, WhatsApp, or other apps
**And** the link includes a deep link URL (cooked://join/{invite_code})

**Technical Notes:**
- Implements: FR-GROUP-002 (partial - link generation)
- Requires: Deep link URL scheme configuration

---

### Story 2.3: Join Group via Invite Link

As a **user with an invite link**,
I want **to join a group by clicking the link**,
So that **I can participate in accountability with my friends**.

**Acceptance Criteria:**

**Given** I click an invite link and don't have the app
**When** the link is opened
**Then** I am directed to the App Store / Play Store

**Given** I click an invite link and have the app but am not logged in
**When** the app opens
**Then** I complete authentication first
**And** then I am added to the group

**Given** I click an invite link and am logged in
**When** the app processes the invite
**Then** I am added to the group as a member
**And** a "welcome" activity is posted to the group feed
**And** I am navigated to the group feed

**Given** the group already has 10 members
**When** I try to join
**Then** I see an error "This group is full (max 10 members)"

**Technical Notes:**
- Implements: FR-GROUP-002 (complete)
- Creates: Edge Function for invite processing

---

### Story 2.4: Group Activity Feed

As a **group member**,
I want **to see a live feed of group activity**,
So that **I know what's happening with my friends' accountability**.

**Acceptance Criteria:**

**Given** I am a group member
**When** I open the app
**Then** I see the group feed as the home screen
**And** the feed shows activity in reverse chronological order

**Given** new activity occurs (check-in, fold, new member, etc.)
**When** I am viewing the feed
**Then** the new item appears at the top in real-time
**And** I don't need to manually refresh

**Given** there is more content than fits on screen
**When** I scroll down
**Then** older items are loaded (infinite scroll)
**And** pagination is < 1 second

**Given** I pull down on the feed
**When** the refresh gesture completes
**Then** the feed is refreshed with latest data

**Technical Notes:**
- Implements: FR-FEED-001
- Uses: Supabase Realtime subscriptions
- Implements: NFR-PERF-002

---

### Story 2.5: Feed Item Types and Display

As a **group member viewing the feed**,
I want **to see different types of activity clearly displayed**,
So that **I can understand what happened at a glance**.

**Acceptance Criteria:**

**Given** a member successfully checks in
**When** the feed item is displayed
**Then** I see "[User] crushed [Pact]" with a ✅ icon
**And** I see the user's avatar and timestamp

**Given** a member folds
**When** the feed item is displayed
**Then** I see "[User] folded on [Pact]" with a ❌ icon
**And** I see a link to view the roast thread

**Given** a new pact is created
**When** the feed item is displayed
**Then** I see "[User] created [Pact]" with a 📋 icon

**Given** a new member joins
**When** the feed item is displayed
**Then** I see "[User] joined the group" with a 👋 icon

**Given** a weekly recap is ready
**When** the feed item is displayed
**Then** I see "Your week in review" with a 📊 icon
**And** I can tap to view the full recap

**Technical Notes:**
- Implements: FR-FEED-002

---

### Story 2.6: Quick Reactions on Feed Items

As a **group member**,
I want **to react to feed items with emoji**,
So that **I can quickly acknowledge my friends' activity**.

**Acceptance Criteria:**

**Given** I see a feed item
**When** I long-press or tap the reaction button
**Then** I see reaction options: 💀 🧢 🤡 🫡 🔥 👏

**Given** I select a reaction
**When** I tap an emoji
**Then** my reaction is added to the item
**And** the reaction count updates
**And** other group members see the update in real-time

**Given** I already reacted to an item
**When** I tap a different reaction
**Then** my reaction changes to the new one
**And** the counts update accordingly

**Given** an item has reactions
**When** I view the item
**Then** I see reaction pills with emoji and counts
**And** my own reaction (if any) is highlighted

**Technical Notes:**
- Creates: reactions table (id, target_type, target_id, user_id, emoji, created_at)
- Implements: FR-FEED-003

---

### Story 2.7: Leave Group

As a **group member**,
I want **to leave a group I no longer want to be in**,
So that **I can stop participating in that accountability circle**.

**Acceptance Criteria:**

**Given** I am a group member (not sole admin)
**When** I go to Group Settings and tap "Leave Group"
**Then** I see a confirmation dialog

**Given** I confirm leaving
**When** the action completes
**Then** I am removed from the group
**And** my check-in history remains (with my name, not anonymized)
**And** active pacts show me as "left"
**And** I am navigated to the create/join group screen

**Given** I am the only admin
**When** I try to leave
**Then** I see a message "You must transfer admin to another member first"

**Technical Notes:**
- Implements: FR-GROUP-003

---

### Story 2.8: Remove Member (Admin)

As a **group admin**,
I want **to remove a member from my group**,
So that **I can manage who is in my accountability circle**.

**Acceptance Criteria:**

**Given** I am a group admin
**When** I view the member list
**Then** I see a "Remove" option next to each member (except myself)

**Given** I tap Remove on a member
**When** I confirm the action
**Then** the member is removed from the group
**And** the removed member receives a notification
**And** their data is handled the same as if they left

**Given** I try to remove myself
**When** I view my own entry
**Then** I don't see a Remove option

**Technical Notes:**
- Implements: FR-GROUP-004

---

### Story 2.9: Transfer Admin Role

As a **group admin**,
I want **to make another member an admin**,
So that **I can share management responsibilities or leave the group**.

**Acceptance Criteria:**

**Given** I am a group admin
**When** I view the member list
**Then** I see a "Make Admin" option next to non-admin members

**Given** I tap "Make Admin" on a member
**When** the action completes
**Then** that member becomes an admin
**And** both of us are now admins (multiple admins allowed)

**Given** I am an admin and there's at least one other admin
**When** I view my own entry
**Then** I see a "Remove Admin" option to demote myself

**Technical Notes:**
- Implements: FR-GROUP-005

---

## Epic 3: Pact Creation & Management

### Story 3.1: Create Basic Pact

As a **group member**,
I want **to create an accountability pact**,
So that **my group can track my commitment**.

**Acceptance Criteria:**

**Given** I am in a group with 3+ members
**When** I tap "Create Pact"
**Then** I see the pact creation form

**Given** I fill out the pact form
**When** I enter a name (2-50 chars)
**Then** the name is validated and accepted

**Given** I select participants
**When** I choose group members (including myself, min 1)
**Then** those members are added to the pact

**Given** I select frequency
**When** I choose Daily, Weekly, or Custom
**Then** the schedule is set (Custom shows day picker)

**Given** I select roast level
**When** I choose 🌶 Mild, 🌶🌶 Medium, or 🌶🌶🌶 Nuclear
**Then** the roast intensity is set

**Given** I select proof requirement
**When** I choose None, Optional, or Required
**Then** the proof setting is saved

**Given** I tap "Create Pact"
**When** all required fields are valid
**Then** the pact is created in the database
**And** participants are notified
**And** a "new pact" item appears in the feed

**Technical Notes:**
- Creates: pacts table (id, group_id, name, description, frequency, frequency_days, roast_level, proof_required, pact_type, created_by, start_date, end_date, status, created_at)
- Creates: pact_participants table (pact_id, user_id, joined_at)
- Implements: FR-PACT-001

---

### Story 3.2: Pact Types (Individual, Group, Relay)

As a **pact creator**,
I want **to choose different pact structures**,
So that **I can set up accountability that fits our needs**.

**Acceptance Criteria:**

**Given** I am creating a pact
**When** I see the pact type selector
**Then** I can choose Individual, Group, or Relay

**Given** I select Individual
**When** the pact is active
**Then** only selected participants have their own check-in
**And** each person's progress is tracked separately

**Given** I select Group
**When** the pact is active
**Then** everyone commits to the same goal
**And** the group streak only continues if everyone checks in

**Given** I select Relay
**When** the pact is active
**Then** each participant has assigned day(s)
**And** only the assigned person checks in that day

**Technical Notes:**
- Implements: FR-PACT-002

---

### Story 3.3: Edit Pact

As a **pact creator**,
I want **to modify my pact's settings**,
So that **I can adjust as our needs change**.

**Acceptance Criteria:**

**Given** I created a pact
**When** I view the pact details
**Then** I see an "Edit" button

**Given** I tap Edit
**When** the edit form opens
**Then** I can change: name, description, proof requirement
**And** I cannot change: frequency (for active pacts), existing participants

**Given** I can add participants
**When** I select new members
**Then** they are added to the pact

**Given** I save changes
**When** the update completes
**Then** the pact is updated
**And** participants are notified of the changes
**And** the change is logged in pact history

**Technical Notes:**
- Implements: FR-PACT-003

---

### Story 3.4: Archive Pact

As a **pact creator**,
I want **to archive a completed or abandoned pact**,
So that **it no longer appears in active pacts but history is preserved**.

**Acceptance Criteria:**

**Given** I created a pact
**When** I view the pact details
**Then** I see an "Archive" button

**Given** I tap Archive
**When** I confirm the action
**Then** the pact status changes to "archived"
**And** no new check-ins are accepted
**And** the pact moves to the "Archived" section
**And** all history and stats are preserved

**Given** I view archived pacts
**When** I tap on an archived pact
**Then** I can view its full history but cannot reactivate it

**Technical Notes:**
- Implements: FR-PACT-004

---

### Story 3.5: Pact Statistics

As a **pact participant**,
I want **to see statistics about the pact**,
So that **I can track our progress over time**.

**Acceptance Criteria:**

**Given** I am viewing a pact
**When** I tap on "Stats"
**Then** I see performance statistics

**Given** I view pact stats
**When** the stats load
**Then** I see completion rate per participant
**And** I see current streak per participant
**And** I see longest streak per participant
**And** I see total check-ins vs expected

**Given** the pact has been running for a while
**When** I view the stats
**Then** the numbers accurately reflect all check-in history

**Technical Notes:**
- Implements: FR-PACT-005
- May require: Edge Function for streak calculation

---

## Epic 4: Daily Check-ins

### Story 4.1: Daily Check-in (Success)

As a **pact participant**,
I want **to mark that I completed my commitment**,
So that **my group knows I followed through**.

**Acceptance Criteria:**

**Given** I have an active pact due today
**When** I view the Pacts tab
**Then** I see my pacts with a check-in button

**Given** I tap "I did it" ✅
**When** the check-in is recorded
**Then** my success is saved to the database
**And** a success item appears in the group feed
**And** my streak is incremented
**And** haptic feedback and confetti animation plays

**Given** I already checked in today for this pact
**When** I view the pact
**Then** I see "Checked in today" and cannot check in again

**Technical Notes:**
- Creates: check_ins table (id, pact_id, user_id, status, excuse, proof_url, check_in_date, is_late, created_at)
- Implements: FR-CHECKIN-001 (success path)

---

### Story 4.2: Daily Check-in (Fold) with Excuse Selection

As a **pact participant who didn't complete my commitment**,
I want **to acknowledge I folded and select an excuse**,
So that **I'm honest with my group about what happened**.

**Acceptance Criteria:**

**Given** I have an active pact due today
**When** I tap "I folded" ❌
**Then** I see the excuse selection screen

**Given** I see excuse options
**When** I view the list
**Then** I see preset options: "Long day", "Forgot", "Be honest, I just didn't want to", "Something came up"
**And** I see a "Custom" option for free text (100 char max)

**Given** I select an excuse
**When** I tap "Submit"
**Then** my fold is recorded with the excuse
**And** a fold item appears in the group feed
**And** a roast thread is automatically created
**And** my streak is reset to 0

**Technical Notes:**
- Implements: FR-CHECKIN-001 (fold path), FR-CHECKIN-002

---

### Story 4.3: Proof Photo Submission

As a **pact participant**,
I want **to submit photo proof when I check in**,
So that **my group can verify I actually did the thing**.

**Acceptance Criteria:**

**Given** my pact has proof requirement set to Optional or Required
**When** I check in
**Then** I see an option to add proof

**Given** proof is Required
**When** I try to check in without proof
**Then** I see a warning but can still submit (flagged as "no proof")

**Given** I tap "Add Proof"
**When** the image picker opens
**Then** I can take a photo or choose from gallery
**And** the image is compressed to max 1MB

**Given** I submit my check-in with proof
**When** the check-in is saved
**Then** the proof image is uploaded to Supabase Storage
**And** the proof is visible to group members in the feed item

**Technical Notes:**
- Creates: proofs storage bucket in Supabase
- Implements: FR-CHECKIN-003

---

### Story 4.4: Check-in Reminder Notifications

As a **pact participant**,
I want **to receive reminders to check in**,
So that **I don't forget my daily commitment**.

**Acceptance Criteria:**

**Given** I have active pacts
**When** my reminder time arrives (default 8 PM local)
**Then** I receive a push notification: "Clock's ticking... ⏰"

**Given** I want to customize my reminder time
**When** I go to Settings > Notifications
**Then** I can set my preferred reminder time

**Given** I receive a reminder and haven't checked in
**When** 11 PM arrives
**Then** I receive a "last chance" notification

**Given** I tap the reminder notification
**When** the app opens
**Then** I am taken directly to my pacts list

**Technical Notes:**
- Implements: FR-CHECKIN-004
- Requires: Expo Push Notifications setup

---

### Story 4.5: Missed Check-in Auto-Fold

As a **system**,
I want **to automatically mark missed check-ins as folds**,
So that **accountability is enforced even when users forget**.

**Acceptance Criteria:**

**Given** a user has an active pact due today
**When** midnight local time passes with no check-in
**Then** the system creates a fold check-in automatically
**And** the excuse is set to "Ghosted 👻"
**And** a roast thread is created
**And** a fold item appears in the group feed

**Given** a user was auto-folded
**When** they open the app the next day
**Then** they see a notification: "You ghosted yesterday"

**Given** the auto-fold runs
**When** it processes all due check-ins
**Then** it handles all pacts across all groups efficiently

**Technical Notes:**
- Creates: Edge Function for auto-fold cron job
- Implements: FR-CHECKIN-005
- Runs: Daily at midnight (per user timezone or UTC)

---

## Epic 5: Roast Threads & Reactions

### Story 5.1: Roast Thread Creation

As a **system**,
I want **to automatically create a roast thread when someone folds**,
So that **the group can respond to the fold**.

**Acceptance Criteria:**

**Given** a user folds (manually or auto-fold)
**When** the fold is recorded
**Then** a roast thread is automatically created
**And** the thread status is "open"
**And** the thread shows: user name, pact name, excuse, timestamp

**Given** a roast thread is created
**When** group members view the feed
**Then** they see a link to the roast thread from the fold item

**Given** 24 hours pass since thread creation
**When** the system checks thread age
**Then** the thread status changes to "closed"

**Technical Notes:**
- Creates: roast_threads table (id, check_in_id, status, created_at, closed_at)
- Implements: FR-ROAST-001

---

### Story 5.2: Text Roast Responses

As a **group member**,
I want **to write text roasts in response to a fold**,
So that **I can playfully call out my friend**.

**Acceptance Criteria:**

**Given** I open an active roast thread
**When** I view the thread
**Then** I see a text input at the bottom

**Given** I type a roast
**When** I enter text (max 280 characters)
**Then** I see character count
**And** I can tap Send to post

**Given** I send a roast
**When** the post is saved
**Then** my roast appears in the thread
**And** other group members see it in real-time
**And** reactions are available on my roast

**Technical Notes:**
- Creates: roast_responses table (id, thread_id, user_id, content_type, content, is_pinned, created_at)
- Implements: FR-ROAST-002 (text)

---

### Story 5.3: GIF and Image Roast Responses

As a **group member**,
I want **to respond with GIFs and images**,
So that **I can express my roast more creatively**.

**Acceptance Criteria:**

**Given** I am in a roast thread
**When** I tap the GIF button
**Then** a GIPHY picker opens
**And** I can search and select a GIF
**And** the GIF is posted as my response

**Given** I am in a roast thread
**When** I tap the Image button
**Then** I can select an image from gallery or camera
**And** the image is uploaded and posted

**Given** a GIF or image response is posted
**When** I view the thread
**Then** the media is displayed inline
**And** I can react to it like text responses

**Technical Notes:**
- Creates: roasts storage bucket for images
- Integrates: GIPHY API
- Implements: FR-ROAST-002 (GIF/image)

---

### Story 5.4: Roast Level Enforcement

As a **pact creator**,
I want **the roast level to limit what's allowed in threads**,
So that **I can control the intensity of roasting**.

**Acceptance Criteria:**

**Given** the pact is set to 🌶 Mild
**When** a roast thread opens
**Then** only emoji reactions are allowed
**And** text, GIF, and image responses are disabled
**And** polls are disabled

**Given** the pact is set to 🌶🌶 Medium
**When** a roast thread opens
**Then** text, GIFs, images, and emoji reactions are allowed
**And** polls are allowed
**And** pinning is not shown in leaderboard

**Given** the pact is set to 🌶🌶🌶 Nuclear
**When** a roast thread opens
**Then** all features are enabled
**And** pinned roasts appear in weekly leaderboard
**And** the roast thread is highlighted in the feed

**Technical Notes:**
- Implements: FR-ROAST-003

---

### Story 5.5: Roast Polls

As a **group member**,
I want **to vote in polls within roast threads**,
So that **we can collectively rate the fold**.

**Acceptance Criteria:**

**Given** the pact roast level is Medium or Nuclear
**When** I view a roast thread
**Then** I see preset polls displayed

**Given** I see the poll "How bad was this L? (1-10)"
**When** I tap a number
**Then** my vote is recorded
**And** I see the average score update

**Given** I see the poll "Was this avoidable?"
**When** I tap Yes/No/Barely
**Then** my vote is recorded
**And** I see the vote distribution

**Given** the roast level is Nuclear
**When** I am the thread creator
**Then** I can create a custom poll with custom options

**Technical Notes:**
- Creates: poll data structure (can be in roast_threads or separate table)
- Implements: FR-ROAST-004

---

### Story 5.6: Best Roast Pin

As a **group**,
I want **the best roast to be highlighted**,
So that **top-tier burns get the recognition they deserve**.

**Acceptance Criteria:**

**Given** a roast response has the most reactions in the thread
**When** the thread is active
**Then** that response is auto-pinned to the top
**And** it shows a "📌 BEST ROAST" badge

**Given** I am the person who folded (thread subject)
**When** I view the thread
**Then** I can manually pin a different roast (self-deprecating choice)

**Given** a roast is pinned
**When** the weekly recap is generated
**Then** the best pinned roast is included in highlights

**Technical Notes:**
- Implements: FR-ROAST-005

---

### Story 5.7: Mute and Safety Controls

As a **person who folded**,
I want **to mute or pause roasting**,
So that **I can step back if it gets too intense**.

**Acceptance Criteria:**

**Given** I am the subject of a roast thread
**When** I view the thread
**Then** I see a "Mute" button

**Given** I tap Mute
**When** the mute is activated
**Then** I stop receiving notifications for this thread
**And** the group sees "[User] muted this thread"

**Given** I have a safe word configured
**When** I type my safe word in the thread
**Then** the thread is immediately closed
**And** no further responses are allowed
**And** no penalty is applied for using the safe word

**Given** I want to configure my safe word
**When** I go to Settings > Safety
**Then** I can set a custom phrase that will close threads

**Technical Notes:**
- Implements: FR-ROAST-006

---

## Epic 6: Weekly Recaps & Notifications

### Story 6.1: Auto-Generated Weekly Recap

As a **group member**,
I want **to receive an automatic weekly summary**,
So that **I can see how the group performed**.

**Acceptance Criteria:**

**Given** it is Sunday at 6 PM local time
**When** the recap generation runs
**Then** a recap is generated for each active group
**And** the recap covers Monday-Sunday
**And** a push notification is sent to all members: "Your receipts are ready 🧾"

**Given** I receive the recap notification
**When** I tap it
**Then** I am taken to the recap screen

**Given** a recap is generated
**When** I view the group feed
**Then** the recap appears as a feed item

**Technical Notes:**
- Creates: weekly_recaps table (id, group_id, week_start, week_end, data, created_at)
- Creates: Edge Function for recap generation (cron: Sundays 6 PM)
- Implements: FR-RECAP-001

---

### Story 6.2: Recap Contents and Awards

As a **group member viewing the recap**,
I want **to see awards, stats, and highlights**,
So that **I can celebrate wins and acknowledge fails**.

**Acceptance Criteria:**

**Given** I view a weekly recap
**When** the recap loads
**Then** I see awards section with:
- 🏆 Most Consistent (highest check-in rate)
- 🤡 Biggest Fold (most folds)
- 🧢 Excuse Hall of Fame (most creative/repeated excuse)
- 🔥 Comeback Player (improved most from last week)
- 💀 Best Roast (most-reacted roast)

**Given** I view the stats section
**When** the data loads
**Then** I see group check-in rate, total active pacts, roast threads opened, individual leaderboard

**Given** I view the highlights section
**When** the data loads
**Then** I see top 3 roasts of the week, biggest improvement, longest active streak

**Technical Notes:**
- Implements: FR-RECAP-002

---

### Story 6.3: Shareable Recap Card

As a **group member**,
I want **to share a recap card to social media**,
So that **I can flex on my accountability or roast my friends publicly**.

**Acceptance Criteria:**

**Given** I am viewing a weekly recap
**When** I tap "Share Recap"
**Then** a shareable image card is generated

**Given** the card is generated
**When** I view it
**Then** it includes: Cooked branding, group name, week dates, top award winner
**And** it does NOT include sensitive data (phone numbers, full names if settings are private)

**Given** I confirm the share
**When** the share sheet opens
**Then** I can share to Instagram Stories, Twitter, Messages, etc.

**Technical Notes:**
- Implements: FR-RECAP-003
- Requires: Image generation (can use canvas library or server-side)

---

### Story 6.4: Push Notification Types

As a **user**,
I want **to receive push notifications for important events**,
So that **I stay engaged with my accountability group**.

**Acceptance Criteria:**

**Given** various events occur
**When** notifications are triggered
**Then** I receive appropriate push notifications:
- Check-in reminder: "Clock's ticking... ⏰"
- Someone folded: "[User] folded. Time to cook. 🔥"
- Tagged in roast: "You got called out in a roast 💀"
- New roast in my thread: "[User] dropped a roast on you"
- Weekly recap ready: "Your receipts are ready 🧾"
- New member joined: "[User] joined the group"
- Pact starting/ending: "Your pact [Name] starts today"

**Given** I tap a notification
**When** the app opens
**Then** I am deep-linked to the relevant screen

**Technical Notes:**
- Implements: FR-NOTIF-001, FR-NOTIF-003
- Uses: Expo Push Notifications

---

### Story 6.5: Notification Preferences

As a **user**,
I want **to customize which notifications I receive**,
So that **I'm not overwhelmed but stay informed**.

**Acceptance Criteria:**

**Given** I go to Settings > Notifications
**When** I view the preferences
**Then** I see toggles for each notification type

**Given** I toggle a notification type off
**When** that event occurs
**Then** I do not receive a push notification for it

**Given** I want quiet hours
**When** I configure quiet hours (e.g., 10 PM - 8 AM)
**Then** no notifications are delivered during that window

**Given** I want to limit notification frequency
**When** I set a frequency cap
**Then** I receive at most X notifications per hour

**Given** I want complete silence
**When** I toggle "Mute All"
**Then** all notifications are paused

**Technical Notes:**
- Implements: FR-NOTIF-002

---

## Epic 7: Monetization & Premium Features

### Story 7.1: Free Tier Implementation

As a **free user**,
I want **to use the core app features**,
So that **I can try the app before committing to payment**.

**Acceptance Criteria:**

**Given** I am a new user
**When** I complete onboarding
**Then** I am on the free tier by default

**Given** I am on the free tier
**When** I use the app
**Then** I can join 1 group
**And** I can have up to 3 active pacts
**And** I can use basic reactions
**And** I can view the current week's recap only

**Given** I try to create a 4th pact
**When** I tap "Create Pact"
**Then** I see a message about the limit
**And** I am prompted to upgrade to Premium

**Technical Notes:**
- Implements: FR-PAY-001

---

### Story 7.2: Premium Tier and Feature Gating

As a **premium subscriber**,
I want **access to unlimited features**,
So that **I can get the full Cooked experience**.

**Acceptance Criteria:**

**Given** my group has a premium subscription
**When** I use the app
**Then** I have access to:
- Unlimited pacts
- Full recap history (all past weeks)
- Advanced polls
- Custom roast prompts
- Group analytics
- Priority support

**Given** a feature is premium-only
**When** a free user tries to access it
**Then** they see the feature locked with an upgrade prompt

**Given** the subscription lapses
**When** the grace period ends
**Then** the group is downgraded to free tier
**And** existing pacts beyond the limit are archived (not deleted)

**Technical Notes:**
- Implements: FR-PAY-002

---

### Story 7.3: Subscription Payment Processing

As a **group admin**,
I want **to subscribe to premium via in-app purchase**,
So that **my group gets premium features**.

**Acceptance Criteria:**

**Given** I am a group admin
**When** I go to Group Settings > Upgrade to Premium
**Then** I see pricing: $4.99/month or $49.99/year (2 months free)

**Given** I tap Subscribe
**When** the native payment sheet appears (App Store / Play Store)
**Then** I can complete the purchase using my account

**Given** the purchase completes successfully
**When** the receipt is verified
**Then** the group subscription status updates to "premium"
**And** all group members get premium features
**And** I receive a confirmation notification

**Given** I want to manage my subscription
**When** I go to Group Settings > Manage Subscription
**Then** I can view status, cancel, or change plans

**Technical Notes:**
- Implements: FR-PAY-003
- Uses: App Store Connect / Google Play Billing APIs
- Requires: Receipt validation (can use Supabase Edge Function)

---

### Story 7.4: Stakes System (Post-MVP Placeholder)

As a **pact creator**,
I want **to add money stakes to pacts**,
So that **there are real financial consequences for folding**.

**Acceptance Criteria:**

**Note: This story is deferred to post-MVP. Placeholder for future implementation.**

**Given** the stakes feature is enabled (future)
**When** I create a pact
**Then** I can optionally add a stake amount

**Given** stakes are active
**When** someone folds
**Then** their stake goes to the pot
**And** winners split the pot

**Given** Cooked facilitates stakes
**When** money is transferred
**Then** Cooked takes a 5-10% facilitation fee

**Technical Notes:**
- Implements: FR-PAY-004
- Requires: Stripe Connect integration
- Status: DEFERRED to post-MVP

---

## Epic Web: Web Application

### Story Web.1: Dashboard, Groups, and Feed

As a **user accessing Cooked from the web**,
I want **to see my dashboard with groups and activity feed**,
So that **I can manage my accountability groups and see activity from my browser**.

**Acceptance Criteria:**

**Given** I am logged in and have no groups
**When** I view the dashboard
**Then** I see "Create a Group" and "Join with Link" options
**And** I see helper text about needing 3 friends

**Given** I am logged in and have groups
**When** I view the dashboard
**Then** I am automatically redirected to my first group's feed

**Given** I am on the create group page
**When** I enter a group name (2-30 characters)
**Then** I can create the group
**And** I am navigated to the group invite screen

**Given** I am on the join group page
**When** I enter a 6-character invite code
**Then** I can join the group
**And** I am navigated to the group feed

**Given** I am viewing a group feed
**When** the feed loads
**Then** I see check-in items with user info, status, and time
**And** I see an empty state if there's no activity
**And** I can create a pact via FAB button

**Technical Notes:**
- Implements: Web-FEAT-001
- Status: DONE (completed 2026-01-17)

---

### Story Web.2: Pacts Management

As a **user on the web app**,
I want **to view, create, and manage pacts**,
So that **I can set up accountability pacts from my browser**.

**Acceptance Criteria:**

**Given** I am viewing a group
**When** I navigate to pacts
**Then** I see a list of all active pacts in the group
**And** I can see pact details (name, frequency, roast level, participants)

**Given** I am viewing the pacts list
**When** I tap "Create Pact"
**Then** I see a form to create a new pact
**And** I can set name, frequency, roast level, proof requirements
**And** I can select pact type (individual, group, relay)

**Given** I am viewing a pact
**When** I am the pact creator
**Then** I can edit pact settings
**And** I can archive the pact

**Given** I am viewing pact statistics
**When** I view a pact
**Then** I see completion rates, streaks, and participant stats

**Technical Notes:**
- Implements: Web-FEAT-002
- Reuses mobile pact logic via shared types
- Requires: usePacts hook for web

---

### Story Web.3: Check-in Interface

As a **user on the web app**,
I want **to check in on my pacts**,
So that **I can mark my progress from my browser**.

**Acceptance Criteria:**

**Given** I am viewing a group
**When** I tap "Check In"
**Then** I see a list of pacts I need to check in for today
**And** I can mark each as "Success" or "Fold"

**Given** I mark a check-in as "Fold"
**When** I submit
**Then** I can select an excuse (preset or custom)
**And** the fold is recorded
**And** a roast thread is created (if applicable)

**Given** I mark a check-in as "Success"
**When** I submit
**Then** I can optionally upload proof photo
**And** the success is recorded
**And** my streak is updated

**Given** I view my check-in history
**When** I navigate to a pact
**Then** I see my past check-ins with dates and status

**Technical Notes:**
- Implements: Web-FEAT-003
- Reuses mobile check-in logic
- Requires: useCheckIns hook for web

---

### Story Web.4: Real-time Feed Updates

As a **user viewing the web feed**,
I want **to see updates in real-time**,
So that **I stay current with group activity**.

**Acceptance Criteria:**

**Given** I am viewing a group feed
**When** a new check-in is posted
**Then** the feed updates automatically without refresh
**And** I see a visual indicator of new activity

**Given** I am viewing a group feed
**When** a new member joins
**Then** I see a "member joined" feed item appear
**And** the feed updates in real-time

**Given** I am viewing a group feed
**When** a new pact is created
**Then** I see a "pact created" feed item appear
**And** the feed updates in real-time

**Technical Notes:**
- Implements: Web-FEAT-004
- Uses: Supabase Realtime WebSocket subscriptions
- Requires: useRealtimeSubscription hook for web

---

### Story Web.5: Roast Threads (Web)

As a **user on the web app**,
I want **to view and participate in roast threads**,
So that **I can roast my friends when they fold**.

**Acceptance Criteria:**

**Given** I am viewing a fold check-in
**When** I tap on it
**Then** I see the roast thread for that fold
**And** I can see all roast responses

**Given** I am viewing a roast thread
**When** I want to respond
**Then** I can post text, GIF, or image responses
**And** I can react to existing responses with emojis

**Given** I am viewing a roast thread
**When** roast level is enforced
**Then** I see appropriate features based on level (Mild/Medium/Nuclear)
**And** I can mute the thread if needed

**Technical Notes:**
- Implements: Web-FEAT-005
- Reuses mobile roast thread logic
- Requires: useRoastThreads hook for web

---

### Story Web.6: Weekly Recaps (Web)

As a **user on the web app**,
I want **to view weekly recaps**,
So that **I can see group performance summaries**.

**Acceptance Criteria:**

**Given** I am viewing a group
**When** a weekly recap is available
**Then** I see a recap feed item
**And** I can tap to view the full recap

**Given** I am viewing a weekly recap
**When** the recap loads
**Then** I see awards (most consistent, biggest fold, etc.)
**And** I see group statistics
**And** I see highlights and leaderboard

**Given** I am viewing a weekly recap
**When** I want to share
**Then** I can generate a shareable recap card image
**And** I can download or copy the image

**Technical Notes:**
- Implements: Web-FEAT-006
- Reuses mobile recap display logic
- Requires: useRecaps hook for web

---

## Related Documents

- [[Product Brief]] - Product vision and strategy
- [[PRD]] - Full product requirements
- [[Architecture]] - Technical architecture
- [[UX Design]] - Design system and screens
- [[Web App Design]] - Web application architecture and features
- [[Web App Auth Spec]] - Web authentication and account linking