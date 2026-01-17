---
title: "Cooked - Product Requirements Document"
aliases:
  - "PRD"
  - "Product Requirements"
  - "Requirements"
tags:
  - cooked
  - planning
  - prd
  - requirements
  - mvp
status: draft
created: 2026-01-13
updated: 2026-01-14
related:
  - "[[Product Brief]]"
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
---

# Cooked - Product Requirements Document (PRD)

> [!info] Document Info
> **Version**: 1.0 | **Owner**: Foxx | **Status**: Draft

---

## 1. Overview

### 1.1 Product Summary
Cooked is a mobile application that enables friend groups to hold each other accountable through structured pacts, daily check-ins, and playful roasting mechanics. The app transforms the awkwardness of accountability into entertainment, using social pressure and humor as motivational levers.

### 1.2 Document Purpose
This PRD defines the functional and non-functional requirements for Cooked's Minimum Viable Product (MVP). It serves as the source of truth for design and development decisions.

### 1.3 Scope
**In Scope (MVP)**:
- User authentication (phone number + email/password)
- Dual authentication with account linking (email ↔ phone)
- Group creation and management
- Pact creation and tracking
- Daily check-in system
- Roast thread functionality
- Weekly recap generation
- Push notifications (mobile)
- Basic subscription/payment
- Web application (for backend testing + cross-platform access)

**Out of Scope (Post-MVP)**:
- AI-generated roasts
- Multiple groups per user
- Public/discovery features
- Advanced analytics dashboard
- Integration with fitness/productivity apps

---

## 2. User Personas & Journeys

### 2.1 Primary Personas

**Persona 1: The Instigator (Alex)**
- Age: 26
- Context: Creates the group, recruits friends
- Goals: Keep friends accountable, enjoy the banter
- Pain Points: Friends don't follow through on commitments
- Behavior: High engagement, creates pacts, active roaster

**Persona 2: The Folder (Jordan)**
- Age: 24
- Context: Joined because friends invited them
- Goals: Actually stick to their goals this time
- Pain Points: Lacks self-discipline, needs external motivation
- Behavior: Moderate engagement, frequent folder, appreciates accountability

**Persona 3: The Consistent One (Sam)**
- Age: 28
- Context: Naturally disciplined, enjoys group dynamics
- Goals: Support friends while maintaining own habits
- Pain Points: Friends aren't as committed
- Behavior: High check-in rate, moderate roasting, enjoys recaps

### 2.2 User Journeys

**Journey 1: New User Onboarding**
```
Download → Phone Auth → Create/Join Group → Invite Friends → Create First Pact → First Check-in
```

**Journey 2: Daily Check-in (Success)**
```
Notification → Open App → Tap "I did it" → See group reactions → Close
```

**Journey 3: Daily Check-in (Failure)**
```
Notification → Open App → Tap "I folded" → Select excuse → Roast thread opens → Friends roast → React to roasts → Close
```

**Journey 4: Roasting Someone**
```
See fold notification → Open thread → Write roast/send meme → Vote in poll → See best roast pinned
```

**Journey 5: Weekly Recap**
```
Sunday notification → Open recap → View awards/stats → Share to social → Discuss in group
```

---

## 3. Functional Requirements

### 3.1 Authentication & User Management

#### FR-AUTH-001: Phone Number Authentication
- **Description**: Users authenticate via phone number with SMS verification code
- **Priority**: P0 (Must Have)
- **Acceptance Criteria**:
  - User enters phone number in E.164 format
  - System sends 6-digit SMS code
  - Code expires after 10 minutes
  - User can request new code after 60 seconds
  - Successful verification creates/retrieves user account
  - Session persists until explicit logout

#### FR-AUTH-002: User Profile
- **Description**: Users have a minimal profile
- **Priority**: P0
- **Acceptance Criteria**:
  - Display name (required, 2-20 characters)
  - Profile photo (optional, default avatar)
  - Phone number (verified, not displayed to others)
  - Member since date

#### FR-AUTH-003: Account Deletion
- **Description**: Users can delete their account
- **Priority**: P1 (Should Have)
- **Acceptance Criteria**:
  - Confirmation required before deletion
  - All user data removed within 30 days
  - User removed from all groups
  - Check-in history anonymized (for group stats)

### 3.2 Group Management

#### FR-GROUP-001: Create Group
- **Description**: Users can create accountability groups
- **Priority**: P0
- **Acceptance Criteria**:
  - Group name (required, 2-30 characters)
  - Group creator becomes admin
  - Invite link generated automatically
  - Minimum 3 members required to activate pacts
  - Maximum 10 members per group (MVP)

#### FR-GROUP-002: Join Group via Invite Link
- **Description**: Users join groups through shareable links
- **Priority**: P0
- **Acceptance Criteria**:
  - Deep link opens app (or app store if not installed)
  - New users complete auth before joining
  - Existing users added immediately
  - Joining user sees welcome message in feed
  - Group notified of new member

#### FR-GROUP-003: Leave Group
- **Description**: Users can leave groups voluntarily
- **Priority**: P0
- **Acceptance Criteria**:
  - Confirmation dialog before leaving
  - User's check-in history remains (anonymized name optional)
  - Active pacts show user as "left"
  - Cannot leave if sole admin (must transfer first)

#### FR-GROUP-004: Remove Member (Admin)
- **Description**: Admins can remove members
- **Priority**: P1
- **Acceptance Criteria**:
  - Only admins can remove
  - Cannot remove self
  - Removed member notified
  - Member's data handled same as leave

#### FR-GROUP-005: Transfer Admin
- **Description**: Admins can transfer admin role
- **Priority**: P1
- **Acceptance Criteria**:
  - Any member can be made admin
  - Multiple admins allowed
  - Original admin can demote self after transfer

### 3.3 Pact System

#### FR-PACT-001: Create Pact
- **Description**: Users create accountability pacts for the group
- **Priority**: P0
- **Acceptance Criteria**:
  - Pact name (required, 2-50 characters)
  - Description (optional, max 200 characters)
  - Participants (select group members, min 1)
  - Frequency: Daily, Weekly, or Custom days
  - Roast level: 🌶 Mild, 🌶🌶 Medium, 🌶🌶🌶 Nuclear
  - Proof requirement: None, Optional, Required
  - Start date (default: immediately)
  - End date (optional, default: ongoing)

#### FR-PACT-002: Pact Types
- **Description**: Different pact structures
- **Priority**: P1
- **Acceptance Criteria**:
  - **Individual**: One person's goal, group watches
  - **Group**: Everyone commits to same goal
  - **Relay**: Rotating responsibility by day

#### FR-PACT-003: Edit Pact
- **Description**: Pact creator can modify pact settings
- **Priority**: P1
- **Acceptance Criteria**:
  - Can edit: name, description, proof requirement
  - Cannot edit: participants (add only), frequency (for active)
  - Edits visible in pact history
  - Participants notified of changes

#### FR-PACT-004: Archive Pact
- **Description**: End a pact without deleting history
- **Priority**: P1
- **Acceptance Criteria**:
  - Pact moves to "Archived" section
  - No new check-ins accepted
  - History and stats preserved
  - Can be viewed but not reactivated

#### FR-PACT-005: Pact Stats
- **Description**: Track pact performance
- **Priority**: P1
- **Acceptance Criteria**:
  - Completion rate per participant
  - Current streak per participant
  - Longest streak per participant
  - Total check-ins vs expected

### 3.4 Check-in System

#### FR-CHECKIN-001: Daily Check-in
- **Description**: Users record goal completion
- **Priority**: P0
- **Acceptance Criteria**:
  - Binary input: "I did it" ✅ or "I folded" ❌
  - One check-in per pact per day
  - Check-in window: based on pact schedule
  - Late check-ins allowed with "late" flag
  - Timestamp recorded

#### FR-CHECKIN-002: Excuse Selection (On Fold)
- **Description**: Users select excuse when folding
- **Priority**: P0
- **Acceptance Criteria**:
  - Preset options:
    - "Long day"
    - "Forgot"
    - "Be honest, I just didn't want to"
    - "Something came up"
    - "Custom" (free text, 100 char max)
  - Excuse visible in roast thread
  - Excuse stats tracked for recaps

#### FR-CHECKIN-003: Proof Submission
- **Description**: Users submit proof of completion
- **Priority**: P1
- **Acceptance Criteria**:
  - Photo upload (camera or gallery)
  - Image compressed to max 1MB
  - Proof visible to group members only
  - Optional even if pact requires (with flag)

#### FR-CHECKIN-004: Check-in Reminder
- **Description**: Remind users to check in
- **Priority**: P0
- **Acceptance Criteria**:
  - Push notification at configured time
  - Default: 8 PM local time
  - User can set custom reminder time
  - Snooze option (1 hour)
  - "Last chance" notification at 11 PM

#### FR-CHECKIN-005: Missed Check-in Handling
- **Description**: System handles missed check-ins
- **Priority**: P0
- **Acceptance Criteria**:
  - If no check-in by end of day: auto-marked as "folded"
  - Auto-fold triggers roast thread
  - Excuse auto-set to "Ghosted 👻"
  - Next day notification: "You ghosted yesterday"

### 3.5 Roast Thread System

#### FR-ROAST-001: Roast Thread Creation
- **Description**: Thread opens when user folds
- **Priority**: P0
- **Acceptance Criteria**:
  - Auto-created on fold check-in
  - Shows: user name, pact name, excuse, timestamp
  - Open for responses for 24 hours
  - Visible to all group members

#### FR-ROAST-002: Roast Responses
- **Description**: Members respond to folds
- **Priority**: P0
- **Acceptance Criteria**:
  - Text responses (max 280 characters)
  - GIF picker integration (GIPHY)
  - Meme/image upload
  - Emoji reactions on responses (💀 🧢 🤡 🫡 🔥)
  - Response limit based on roast level

#### FR-ROAST-003: Roast Level Enforcement
- **Description**: Limit roast intensity by setting
- **Priority**: P0
- **Acceptance Criteria**:
  - 🌶 Mild: Reactions only, no text roasts
  - 🌶🌶 Medium: Text + GIFs + polls
  - 🌶🌶🌶 Nuclear: All features + pinned shame + leaderboard entry

#### FR-ROAST-004: Roast Polls
- **Description**: Quick polls in roast threads
- **Priority**: P1
- **Acceptance Criteria**:
  - Preset polls:
    - "How bad was this L?" (1-10 scale)
    - "Was this avoidable?" (Yes/No/Barely)
    - "Best excuse we've heard?" (Yes/No)
  - Custom polls (Medium+ roast level)
  - Results visible to all

#### FR-ROAST-005: Best Roast Pin
- **Description**: Highlight top roast
- **Priority**: P1
- **Acceptance Criteria**:
  - Most-reacted response auto-pinned
  - Manual pin by thread subject (self-deprecating choice)
  - Pinned roast visible at top of thread
  - Pinned roasts tracked for weekly recap

#### FR-ROAST-006: Mute/Pause Roasting
- **Description**: User safety controls
- **Priority**: P0
- **Acceptance Criteria**:
  - "Mute" button pauses notifications for thread
  - "Safe word" (configurable) closes thread early
  - Mute status visible to group: "[User] muted this thread"
  - No penalty for using safety features

### 3.6 Group Feed

#### FR-FEED-001: Activity Feed
- **Description**: Chronological group activity
- **Priority**: P0
- **Acceptance Criteria**:
  - Shows: check-ins, folds, roast threads, new pacts, new members
  - Infinite scroll with pagination
  - Pull-to-refresh
  - Real-time updates (new items appear instantly)

#### FR-FEED-002: Feed Item Types
- **Description**: Different content in feed
- **Priority**: P0
- **Acceptance Criteria**:
  - ✅ Success check-in: "[User] crushed [Pact]"
  - ❌ Fold: "[User] folded on [Pact]" → links to roast thread
  - 📋 New pact: "[User] created [Pact]"
  - 👋 New member: "[User] joined the group"
  - 📊 Weekly recap: "Your week in review"

#### FR-FEED-003: Quick Reactions
- **Description**: React to feed items
- **Priority**: P0
- **Acceptance Criteria**:
  - Reaction options: 💀 🧢 🤡 🫡 🔥 👏
  - One reaction per user per item
  - Can change reaction
  - Reaction counts visible

### 3.7 Weekly Recap

#### FR-RECAP-001: Auto-Generated Recap
- **Description**: Weekly summary generated automatically
- **Priority**: P0
- **Acceptance Criteria**:
  - Generated every Sunday at 6 PM local
  - Covers Monday-Sunday
  - Push notification to all members
  - Visible in feed and dedicated recap section

#### FR-RECAP-002: Recap Contents
- **Description**: What's included in recap
- **Priority**: P0
- **Acceptance Criteria**:
  - **Awards**:
    - 🏆 Most Consistent (highest check-in rate)
    - 🤡 Biggest Fold (most folds)
    - 🧢 Excuse Hall of Fame (most creative/repeated excuse)
    - 🔥 Comeback Player (improved most from last week)
    - 💀 Best Roast (most-reacted roast)
  - **Stats**:
    - Group check-in rate
    - Total pacts active
    - Roast threads opened
    - Individual leaderboard
  - **Highlights**:
    - Top 3 roasts of the week
    - Biggest improvement
    - Longest active streak

#### FR-RECAP-003: Shareable Recap Card
- **Description**: Image for social sharing
- **Priority**: P1
- **Acceptance Criteria**:
  - Auto-generated image with key stats
  - Includes: group name, week, top award winner
  - Branded with Cooked logo
  - Share to Instagram Stories, Twitter, etc.
  - No sensitive data on shareable card

### 3.8 Notifications

#### FR-NOTIF-001: Push Notification Types
- **Description**: What triggers notifications
- **Priority**: P0
- **Acceptance Criteria**:
  - Check-in reminder (configurable time)
  - Someone folded (immediate)
  - Tagged in roast (immediate)
  - New roast in your thread (batched)
  - Weekly recap ready (Sunday)
  - New member joined (immediate)
  - Pact starting/ending (relevant day)

#### FR-NOTIF-002: Notification Preferences
- **Description**: User control over notifications
- **Priority**: P1
- **Acceptance Criteria**:
  - Toggle each notification type on/off
  - Quiet hours setting
  - Frequency caps (max X per hour)
  - "Mute all" option

#### FR-NOTIF-003: Notification Copy
- **Description**: Notification text style
- **Priority**: P1
- **Acceptance Criteria**:
  - On-brand, slightly roasty tone
  - Examples:
    - Reminder: "Clock's ticking... ⏰"
    - Fold: "[User] folded. Time to cook. 🔥"
    - Tagged: "You got called out in a roast 💀"
    - Recap: "Your receipts are ready 🧾"

### 3.9 Subscription & Payments

#### FR-PAY-001: Free Tier
- **Description**: Basic free functionality
- **Priority**: P0
- **Acceptance Criteria**:
  - 1 group membership
  - 3 active pacts max
  - Basic reactions
  - Weekly recap (current week only)
  - Standard roast features

#### FR-PAY-002: Premium Tier (Group)
- **Description**: Paid features for groups
- **Priority**: P1
- **Acceptance Criteria**:
  - Price: $4.99/month per group
  - Unlimited pacts
  - Full recap history
  - Advanced polls
  - Custom roast prompts
  - Group analytics
  - Priority support

#### FR-PAY-003: Payment Processing
- **Description**: Handle subscription payments
- **Priority**: P1
- **Acceptance Criteria**:
  - Integration with App Store / Play Store billing
  - Monthly and annual options (annual = 2 months free)
  - Group admin manages subscription
  - Graceful downgrade on lapse

#### FR-PAY-004: Stakes (Future)
- **Description**: Money stakes between friends
- **Priority**: P2 (Nice to Have)
- **Acceptance Criteria**:
  - Opt-in per pact
  - Configurable amount
  - Winner takes pot
  - Cooked takes 5-10% fee
  - Integration with Stripe Connect

---

## 4. Non-Functional Requirements

### 4.1 Performance

#### NFR-PERF-001: App Launch Time
- Cold start: < 3 seconds
- Warm start: < 1 second

#### NFR-PERF-002: Feed Load Time
- Initial load: < 2 seconds
- Pagination: < 1 second

#### NFR-PERF-003: Real-time Updates
- Latency: < 500ms for new check-ins/roasts

#### NFR-PERF-004: Concurrent Users
- Support 10,000 concurrent users at launch
- Architecture scalable to 100,000+

### 4.2 Reliability

#### NFR-REL-001: Uptime
- Target: 99.5% availability
- Planned maintenance windows: Sunday 2-4 AM

#### NFR-REL-002: Data Durability
- No data loss on check-ins or roasts
- Daily database backups
- Point-in-time recovery capability

### 4.3 Security

#### NFR-SEC-001: Authentication
- Phone verification required
- Session tokens expire after 30 days
- Secure token storage (Keychain/Keystore)

#### NFR-SEC-002: Data Protection
- All API traffic over HTTPS
- Sensitive data encrypted at rest
- No PII in logs

#### NFR-SEC-003: Content Safety
- User-generated content moderated (reactive)
- Report mechanism for abuse
- Rate limiting on posts

### 4.4 Scalability

#### NFR-SCALE-001: Horizontal Scaling
- Stateless API design
- Database read replicas for scaling
- CDN for static assets

#### NFR-SCALE-002: Cost Efficiency
- Optimize for Supabase free tier initially
- Clear upgrade path as usage grows

### 4.5 Usability

#### NFR-USE-001: Accessibility
- Minimum AA contrast ratios
- Screen reader compatible
- Touch targets minimum 44x44pt

#### NFR-USE-002: Localization
- English only for MVP
- Architecture supports future localization

### 4.6 Compatibility

#### NFR-COMPAT-001: Platform Support
- iOS 15+
- Android 10+

#### NFR-COMPAT-002: Device Support
- iPhone 8 and newer
- Most Android devices from 2020+

---

## 5. Data Requirements

### 5.1 Data Model (High-Level)

```
Users
├── id (uuid)
├── phone_number
├── display_name
├── avatar_url
├── created_at
└── settings (json)

Groups
├── id (uuid)
├── name
├── invite_code
├── created_by (user_id)
├── created_at
└── subscription_status

GroupMembers
├── group_id
├── user_id
├── role (admin/member)
├── joined_at
└── settings (json)

Pacts
├── id (uuid)
├── group_id
├── name
├── description
├── frequency
├── roast_level
├── proof_required
├── created_by (user_id)
├── start_date
├── end_date
└── status (active/archived)

PactParticipants
├── pact_id
├── user_id
└── joined_at

CheckIns
├── id (uuid)
├── pact_id
├── user_id
├── status (success/fold)
├── excuse
├── proof_url
├── check_in_date
└── created_at

RoastThreads
├── id (uuid)
├── check_in_id
├── status (open/closed)
├── created_at
└── closed_at

RoastResponses
├── id (uuid)
├── thread_id
├── user_id
├── content_type (text/gif/image)
├── content
├── is_pinned
└── created_at

Reactions
├── id (uuid)
├── target_type (check_in/response)
├── target_id
├── user_id
├── emoji
└── created_at

WeeklyRecaps
├── id (uuid)
├── group_id
├── week_start
├── week_end
├── data (json)
└── created_at
```

### 5.2 Data Retention
- Active data: Indefinite
- Deleted user data: Anonymized after 30 days
- Archived pacts: Retained indefinitely
- Backup retention: 30 days

---

## 6. API Requirements

### 6.1 API Design Principles
- RESTful design
- JSON request/response format
- JWT authentication
- Rate limiting: 100 requests/minute/user
- Versioned endpoints (/v1/)

### 6.2 Core Endpoints (High-Level)

**Authentication**
- POST /v1/auth/send-code
- POST /v1/auth/verify-code
- POST /v1/auth/logout
- DELETE /v1/auth/account

**Users**
- GET /v1/users/me
- PATCH /v1/users/me
- POST /v1/users/me/avatar

**Groups**
- POST /v1/groups
- GET /v1/groups/:id
- PATCH /v1/groups/:id
- POST /v1/groups/:id/join
- POST /v1/groups/:id/leave
- POST /v1/groups/:id/invite
- DELETE /v1/groups/:id/members/:user_id

**Pacts**
- POST /v1/groups/:id/pacts
- GET /v1/groups/:id/pacts
- GET /v1/pacts/:id
- PATCH /v1/pacts/:id
- POST /v1/pacts/:id/archive

**Check-ins**
- POST /v1/pacts/:id/checkins
- GET /v1/pacts/:id/checkins

**Roasts**
- GET /v1/roast-threads/:id
- POST /v1/roast-threads/:id/responses
- POST /v1/roast-threads/:id/reactions

**Feed**
- GET /v1/groups/:id/feed

**Recaps**
- GET /v1/groups/:id/recaps
- GET /v1/recaps/:id

### 6.3 Real-time Subscriptions
- Group feed updates
- Roast thread responses
- Check-in notifications
- Online presence (future)

---

## 7. Integration Requirements

### 7.1 Third-Party Services

| Service | Purpose | Priority |
|---------|---------|----------|
| Supabase | Backend, Auth, Real-time | P0 |
| GIPHY API | GIF picker | P1 |
| Expo Push | Notifications | P0 |
| Stripe | Payments (future) | P2 |
| Mixpanel | Analytics | P1 |
| Sentry | Error tracking | P1 |

### 7.2 Future Integrations (Post-MVP)
- Apple Health / Google Fit (proof automation)
- Calendar apps (schedule-based pacts)
- Social media (sharing)

---

## 8. Assumptions & Dependencies

### 8.1 Assumptions
- Users have smartphones with data/wifi
- Users are comfortable with phone number auth
- Friend groups have 3-10 members typically
- Users understand "roasting" concept culturally

### 8.2 Dependencies
- Supabase platform availability
- App Store / Play Store approval
- SMS delivery reliability
- GIPHY API availability

---

## 9. Success Criteria

### 9.1 MVP Launch Criteria
- All P0 requirements implemented
- 95%+ crash-free sessions
- < 3 second cold start
- Successful beta with 5+ friend groups

### 9.2 Post-Launch Success Metrics (30 days)
- D1 retention > 35%
- D7 retention > 20%
- D30 retention > 12%
- 50+ active groups
- 4+ star App Store rating

---

## 10. Appendix

### 10.1 Glossary
- **Pact**: A commitment made within a group
- **Fold**: Failing to complete a pact check-in
- **Roast**: Playful criticism from friends
- **Roast Level**: User-selected intensity of roasting
- **Recap**: Weekly summary of group activity

### 10.2 References
- Product Brief: `/planning-artifacts/product-brief.md`
- Research: `/planning-artifacts/research-competitive-analysis.md`
- User Brainstorm: ChatGPT session (imported)

### 10.3 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-13 | Foxx | Initial draft |
