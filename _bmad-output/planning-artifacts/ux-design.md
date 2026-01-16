---
title: "Cooked - UX Design Specification"
aliases:
  - "UX Design"
  - "Design System"
  - "UI Spec"
tags:
  - cooked
  - planning
  - ux
  - design
  - ui
  - design-system
status: draft
created: 2026-01-13
updated: 2026-01-14
related:
  - "[[Product Brief]]"
  - "[[PRD]]"
  - "[[Architecture]]"
  - "[[Epics]]"
---

# Cooked - UX Design Specification

> [!info] Document Info
> **Version**: 1.0 | **Status**: Draft

## 1. Design Philosophy

### 1.1 Core Principles

**1. Group Chat Energy**
The app should feel like opening a group chat, not a productivity tool. Casual, fast, slightly chaotic—but organized enough to be useful.

**2. One-Tap Actions**
Every core action (check-in, react, roast) should be achievable in one tap. Complexity is the enemy of daily engagement.

**3. Personality Over Polish**
Bold, slightly irreverent design. The app has opinions and isn't afraid to show them. Memes > minimalism.

**4. Safety Without Friction**
Safety features (mute, roast levels) are prominent but never interrupt flow. Users feel in control without constant reminders.

### 1.2 Emotional Design Goals

| Moment | User Should Feel |
|--------|-----------------|
| Opening app | Curious, slightly anxious (good anxious) |
| Checking in (success) | Proud, validated |
| Checking in (fold) | Embarrassed but amused |
| Getting roasted | Laughing, maybe wincing |
| Roasting someone | Clever, connected |
| Viewing recap | Entertained, reflective |

---

## 2. Design System

### 2.1 Color Palette

**Primary Colors**
```
Background (Dark):     #0D0D0D (rich black)
Surface:               #1A1A1A (card backgrounds)
Surface Elevated:      #262626 (modals, sheets)
```

**Accent Colors**
```
Primary (Fire):        #FF4D00 (CTAs, highlights)
Secondary (Orange):    #FF8A00 (secondary actions)
Success:               #00D26A (check-ins, streaks)
Danger/Fold:           #FF3B3B (folds, warnings)
```

**Text Colors**
```
Text Primary:          #FFFFFF
Text Secondary:        #A0A0A0
Text Muted:            #666666
```

**Emoji/Reaction Colors**
```
Skull (💀):            #FFFFFF
Cap (🧢):              #4A90D9
Clown (🤡):            #FFB347
Salute (🫡):           #FFD700
Fire (🔥):             #FF4D00
```

### 2.2 Typography

**Font Family**: Inter (or SF Pro on iOS, Roboto on Android)

**Type Scale**
```
Display:      32px / 40px line-height / Bold
H1:           24px / 32px line-height / Bold
H2:           20px / 28px line-height / Semibold
H3:           18px / 24px line-height / Semibold
Body:         16px / 24px line-height / Regular
Body Small:   14px / 20px line-height / Regular
Caption:      12px / 16px line-height / Regular
Overline:     10px / 14px line-height / Bold / Uppercase / Tracking +1
```

**Special Typography**
- Roast text: Body, italic when quoting
- Stats/numbers: Mono font (SF Mono / Roboto Mono)
- Excuses: Body Small, italic, muted color

### 2.3 Spacing System

**Base Unit**: 4px

```
XS:   4px
S:    8px
M:    16px
L:    24px
XL:   32px
2XL:  48px
3XL:  64px
```

**Screen Padding**: 16px horizontal, 24px vertical safe area

### 2.4 Border Radius

```
Small (buttons, inputs):    8px
Medium (cards):            12px
Large (modals):            16px
Full (avatars, pills):     9999px
```

### 2.5 Shadows

```
Elevation 1 (subtle):     0 2px 4px rgba(0,0,0,0.2)
Elevation 2 (cards):      0 4px 8px rgba(0,0,0,0.25)
Elevation 3 (modals):     0 8px 24px rgba(0,0,0,0.4)
Glow (primary CTA):       0 0 20px rgba(255,77,0,0.4)
```

---

## 3. Component Library

### 3.1 Buttons

**Primary Button**
- Background: Primary (#FF4D00)
- Text: White, Bold
- Padding: 16px horizontal, 12px vertical
- Border radius: 8px
- Glow on press

**Secondary Button**
- Background: Surface (#1A1A1A)
- Border: 1px solid #333
- Text: White
- Same dimensions as primary

**Ghost Button**
- Background: Transparent
- Text: Primary color
- Underline on hover

**Icon Button**
- 44x44px touch target minimum
- Icon: 24px
- Optional badge for notifications

### 3.2 Cards

**Feed Card**
- Background: Surface
- Padding: 16px
- Border radius: 12px
- Contains: avatar, name, action, timestamp, reactions

**Pact Card**
- Background: Surface
- Accent left border (4px, color based on status)
- Contains: name, participants, streak, check-in button

### 3.3 Avatars

**Sizes**
```
XS: 24px (inline mentions)
S:  32px (list items)
M:  40px (feed items)
L:  64px (profile)
XL: 96px (detail views)
```

**States**
- Default: Image or initials on gradient
- Online: Green dot indicator (future)
- Folded: Red ring (in roast context)

### 3.4 Reactions

**Reaction Pill**
- Background: Surface elevated
- Padding: 8px 12px
- Border radius: full
- Emoji + count
- Tap to add/remove

**Reaction Bar**
- Horizontal scroll
- 8px gap between pills
- Selected state: border highlight

### 3.5 Input Fields

**Text Input**
- Background: Surface
- Border: 1px solid #333, 2px Primary on focus
- Padding: 12px 16px
- Border radius: 8px
- Placeholder: Muted color

**Roast Input**
- Multi-line textarea
- Character count (280 max)
- GIF button, Image button
- Send button (icon)

### 3.6 Bottom Sheet

- Background: Surface Elevated
- Border radius: 16px top only
- Handle: 36px wide, 4px tall, centered, muted color
- Max height: 90% screen
- Backdrop: Black 50% opacity

---

## 4. Screen Specifications

### 4.1 Onboarding Flow

#### Screen: Welcome
```
┌─────────────────────────────┐
│                             │
│      [Cooked Logo]          │
│                             │
│      "You said you'd        │
│       do it."               │
│                             │
│      [Illustration:         │
│       friends roasting]     │
│                             │
│    [Get Started Button]     │
│                             │
│    "Already have account?   │
│     Sign in"                │
└─────────────────────────────┘
```

#### Screen: Phone Entry
```
┌─────────────────────────────┐
│  ←                          │
│                             │
│  What's your number?        │
│                             │
│  ┌─────────────────────┐    │
│  │ +1  │ (555) 123-4567│    │
│  └─────────────────────┘    │
│                             │
│  We'll text you a code.     │
│  Standard rates apply.      │
│                             │
│    [Continue Button]        │
│                             │
└─────────────────────────────┘
```

#### Screen: Code Verification
```
┌─────────────────────────────┐
│  ←                          │
│                             │
│  Enter the code             │
│  Sent to +1 (555) 123-4567  │
│                             │
│    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐  │
│    │ │ │ │ │ │ │ │ │ │ │ │  │
│    └─┘ └─┘ └─┘ └─┘ └─┘ └─┘  │
│                             │
│  Didn't get it? Resend      │
│                             │
└─────────────────────────────┘
```

#### Screen: Profile Setup
```
┌─────────────────────────────┐
│  ←                          │
│                             │
│     [Avatar Upload]         │
│     (tap to add photo)      │
│                             │
│  What should we call you?   │
│                             │
│  ┌─────────────────────┐    │
│  │ Display name        │    │
│  └─────────────────────┘    │
│                             │
│  This is how friends will   │
│  see you in roast threads.  │
│                             │
│    [Let's Go Button]        │
│                             │
└─────────────────────────────┘
```

#### Screen: Create/Join Group
```
┌─────────────────────────────┐
│                             │
│  [Illustration]             │
│                             │
│  ┌─────────────────────┐    │
│  │ Create a Group      │ →  │
│  │ Start fresh         │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Join with Link      │ →  │
│  │ Got invited?        │    │
│  └─────────────────────┘    │
│                             │
│  You need at least 3        │
│  friends to start cooking.  │
│                             │
└─────────────────────────────┘
```

### 4.2 Main App Screens

#### Screen: Group Feed (Home)
```
┌─────────────────────────────┐
│  Cooked          [Profile]  │
│─────────────────────────────│
│  GROUP NAME           [⋮]   │
│─────────────────────────────│
│ ┌─────────────────────────┐ │
│ │ 🔥 Alex folded          │ │
│ │ Pact: Gym 3x/week       │ │
│ │ "Long day" • 2h ago     │ │
│ │                         │ │
│ │ [💀 12] [🧢 3] [🤡 5]   │ │
│ │                         │ │
│ │ [View Roast Thread →]   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✅ Jordan crushed       │ │
│ │ Pact: No drunk texts    │ │
│ │ 5h ago                  │ │
│ │                         │ │
│ │ [🔥 8] [👏 4]           │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📋 Sam created new pact │ │
│ │ "Side project 30min"    │ │
│ │ [View Details →]        │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│  [Feed] [Pacts] [Recap]     │
└─────────────────────────────┘
```

#### Screen: Pacts Tab
```
┌─────────────────────────────┐
│  Your Pacts                 │
│─────────────────────────────│
│                             │
│  TODAY'S CHECK-INS          │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🏋️ Gym 3x/week          │ │
│ │ 🔥 12 day streak        │ │
│ │ Due today               │ │
│ │                         │ │
│ │  [✅ Did it]  [❌ Folded]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📱 No drunk texts       │ │
│ │ ✓ Checked in today      │ │
│ │ 🔥 5 day streak         │ │
│ └─────────────────────────┘ │
│                             │
│  ACTIVE PACTS               │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💻 Side project 30min   │ │
│ │ Weekly • Mon, Wed, Fri  │ │
│ │ Next: Wednesday         │ │
│ └─────────────────────────┘ │
│                             │
│      [+ Create Pact]        │
│                             │
├─────────────────────────────┤
│  [Feed] [Pacts] [Recap]     │
└─────────────────────────────┘
```

#### Screen: Check-in Modal
```
┌─────────────────────────────┐
│                             │
│  ─────  (handle)            │
│                             │
│  🏋️ Gym 3x/week            │
│                             │
│  Did you do it today?       │
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │    ✅ I did it      │    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │    ❌ I folded      │    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  Add proof (optional)       │
│  [📷 Photo]                 │
│                             │
└─────────────────────────────┘
```

#### Screen: Fold Excuse Selector
```
┌─────────────────────────────┐
│                             │
│  ─────  (handle)            │
│                             │
│  What happened?             │
│                             │
│  ┌─────────────────────┐    │
│  │ 😔 Long day          │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 🤦 Forgot            │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 😬 Just didn't       │    │
│  │    want to           │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 🤷 Something came up │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ ✏️ Custom excuse...  │    │
│  └─────────────────────┘    │
│                             │
│  [Submit & Face the Music]  │
│                             │
└─────────────────────────────┘
```

#### Screen: Roast Thread
```
┌─────────────────────────────┐
│  ←  Roast Thread            │
│─────────────────────────────│
│                             │
│  ┌─────────────────────────┐│
│  │ [Alex Avatar]           ││
│  │ Alex folded             ││
│  │ 🏋️ Gym 3x/week          ││
│  │                         ││
│  │ Excuse: "Long day"      ││
│  │ 🌶🌶 Medium roast       ││
│  │                         ││
│  │ 2 hours ago             ││
│  └─────────────────────────┘│
│                             │
│  ROASTS                     │
│                             │
│  ┌─────────────────────────┐│
│  │ [Jordan] 📌 BEST ROAST  ││
│  │ "Long day" is crazy     ││
│  │ when you work from home ││
│  │                         ││
│  │ [💀 15] [🔥 8]          ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [Sam]                   ││
│  │ [GIF: disappointed]     ││
│  │                         ││
│  │ [💀 6] [🤡 4]           ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ POLL: How bad? (1-10)   ││
│  │ Average: 7.2            ││
│  │ [See votes]             ││
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│ [Type a roast...]  [GIF][📷]│
└─────────────────────────────┘
```

#### Screen: Create Pact
```
┌─────────────────────────────┐
│  ←  New Pact                │
│─────────────────────────────│
│                             │
│  Pact Name                  │
│  ┌─────────────────────┐    │
│  │ e.g., "Gym 3x/week" │    │
│  └─────────────────────┘    │
│                             │
│  Description (optional)     │
│  ┌─────────────────────┐    │
│  │ What counts?        │    │
│  └─────────────────────┘    │
│                             │
│  Who's in?                  │
│  [You ✓] [Jordan] [Sam]     │
│  [Alex]                     │
│                             │
│  Frequency                  │
│  ┌─────────────────────┐    │
│  │ Daily            ▼  │    │
│  └─────────────────────┘    │
│                             │
│  Roast Level                │
│  [🌶] [🌶🌶 ✓] [🌶🌶🌶]      │
│                             │
│  Proof Required?            │
│  [None ✓] [Optional] [Yes]  │
│                             │
│    [Create Pact]            │
│                             │
└─────────────────────────────┘
```

#### Screen: Weekly Recap
```
┌─────────────────────────────┐
│  ←  Week of Jan 6-12        │
│─────────────────────────────│
│                             │
│  ┌─────────────────────────┐│
│  │    🏆 MOST CONSISTENT   ││
│  │                         ││
│  │    [Sam Avatar]         ││
│  │    Sam                  ││
│  │    95% check-in rate    ││
│  └─────────────────────────┘│
│                             │
│  ┌───────────┐ ┌───────────┐│
│  │🤡 BIGGEST │ │💀 BEST    ││
│  │   FOLD    │ │   ROAST   ││
│  │           │ │           ││
│  │  Alex     │ │  Jordan   ││
│  │  4 folds  │ │  "Long    ││
│  │           │ │   day"... ││
│  └───────────┘ └───────────┘│
│                             │
│  GROUP STATS                │
│  ┌─────────────────────────┐│
│  │ Check-in rate: 78%      ││
│  │ Roast threads: 6        ││
│  │ Best streak: Sam (12)   ││
│  └─────────────────────────┘│
│                             │
│  LEADERBOARD                │
│  1. Sam      95%  🔥12      │
│  2. Jordan   82%  🔥8       │
│  3. Alex     64%  🔥3       │
│  4. You      71%  🔥5       │
│                             │
│    [Share Recap Card 📤]    │
│                             │
└─────────────────────────────┘
```

#### Screen: Profile / Settings
```
┌─────────────────────────────┐
│  ←  Profile                 │
│─────────────────────────────│
│                             │
│     [Large Avatar]          │
│     Your Name               │
│     Member since Jan 2026   │
│                             │
│     [Edit Profile]          │
│                             │
│─────────────────────────────│
│  YOUR STATS                 │
│                             │
│  🔥 Longest streak: 12 days │
│  📊 Avg check-in: 78%       │
│  🏆 Awards won: 3           │
│─────────────────────────────│
│  SETTINGS                   │
│                             │
│  Notifications         [>]  │
│  Check-in Reminder     [>]  │
│  Privacy              [>]   │
│─────────────────────────────│
│  GROUP                      │
│                             │
│  Invite Friends        [>]  │
│  Leave Group           [>]  │
│─────────────────────────────│
│  ACCOUNT                    │
│                             │
│  Manage Subscription   [>]  │
│  Delete Account        [>]  │
│                             │
│  [Log Out]                  │
│                             │
└─────────────────────────────┘
```

---

## 5. User Flows

### 5.1 First-Time User Flow

```
App Store → Download → Open App → Welcome Screen →
Phone Entry → Code Verification → Profile Setup →
Create/Join Group → [If Create] Name Group →
Share Invite Link → Wait for 3+ members →
Create First Pact → First Check-in → See Feed
```

### 5.2 Daily Check-in Flow (Success)

```
Push Notification → Open App → Pacts Tab →
Tap Check-in → "I did it" → Optional Proof →
Confirm → See Success Animation →
Return to Feed → See Reactions
```

### 5.3 Daily Check-in Flow (Fold)

```
Push Notification → Open App → Pacts Tab →
Tap Check-in → "I folded" → Select Excuse →
Submit → See "Brace Yourself" Message →
Roast Thread Opens → Friends Notified →
Roasts Arrive → React/Reply → Thread Closes
```

### 5.4 Roasting Flow

```
Notification: "Alex folded" → Open App →
View Fold in Feed → Tap "View Roast Thread" →
Type Roast / Pick GIF → Send →
See Others' Roasts → Vote in Poll →
See Best Roast Pinned
```

### 5.5 Weekly Recap Flow

```
Sunday 6PM Notification → Open App →
Recap Card in Feed → Tap to Expand →
View Awards → Check Leaderboard →
Tap "Share" → Generate Card →
Share to Instagram/Twitter →
Return to App
```

---

## 6. Interaction Patterns

### 6.1 Gestures

| Gesture | Action | Context |
|---------|--------|---------|
| Tap | Select/Activate | Everywhere |
| Long Press | Quick React | Feed items |
| Swipe Down | Pull to Refresh | Feed, Pacts |
| Swipe Left | Archive/Delete | Settings lists |
| Swipe Up | Dismiss | Modals, Sheets |

### 6.2 Animations

**Check-in Success**
- Confetti burst (subtle, 0.5s)
- Button transforms to checkmark
- Haptic feedback (success)

**Check-in Fold**
- Button pulses red
- Skull emoji floats up
- "Brace yourself" text fades in
- Haptic feedback (warning)

**New Roast**
- Card slides in from right
- Fire emoji animates
- Notification sound (optional)

**Reaction Added**
- Emoji bounces
- Count increments with pop
- Haptic feedback (light)

### 6.3 Empty States

**No Pacts Yet**
```
[Illustration: sleeping fire]
"Nothing to check in on"
Create a pact to get started
[Create Pact Button]
```

**No Roasts Yet**
```
[Illustration: crickets]
"No roasts yet"
Be the first to cook them
[Write a Roast]
```

**No Recap Available**
```
[Illustration: calendar]
"Recap drops Sunday"
Keep checking in this week
```

### 6.4 Error States

**Network Error**
```
[Illustration: broken phone]
"Can't connect"
Check your connection and try again
[Retry Button]
```

**Rate Limited**
```
[Illustration: slow turtle]
"Too fast!"
Wait a sec before trying again
```

---

## 7. Accessibility

### 7.1 Requirements

- **Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Touch Targets**: Minimum 44x44pt
- **Screen Reader**: All interactive elements labeled
- **Reduce Motion**: Respect system setting, disable confetti

### 7.2 Screen Reader Labels

| Element | Label |
|---------|-------|
| Check-in Success Button | "Mark as completed" |
| Check-in Fold Button | "Mark as not completed" |
| Reaction Button | "[Emoji name], [count] reactions. Double tap to add" |
| Avatar | "[Name]'s profile picture" |
| Streak Badge | "[Number] day streak" |

### 7.3 Focus Order

1. Header/Navigation
2. Primary Content (top to bottom)
3. Interactive Elements (left to right)
4. Bottom Navigation

---

## 8. Responsive Considerations

### 8.1 Device Sizes

**Small (iPhone SE)**
- Reduce padding slightly
- Stack elements vertically
- Smaller avatars in dense lists

**Large (iPhone Pro Max)**
- Same layout, more breathing room
- Larger touch targets

**Tablet (iPad)**
- Not optimized for MVP
- Phone layout in compatibility mode

### 8.2 Safe Areas

- Top: Dynamic Island / Notch respected
- Bottom: Home indicator spacing
- All interactive elements within safe area

---

## 9. Dark Mode

**MVP**: Dark mode only (default)

**Rationale**:
- Matches "roasty" brand energy
- Easier to maintain one theme
- Most social apps default dark
- Battery efficient on OLED

**Future**: Light mode option in settings

---

## 10. Shareable Assets

### 10.1 Weekly Recap Card

```
┌─────────────────────────────┐
│  🔥 COOKED                  │
│  Week of Jan 6-12           │
│─────────────────────────────│
│                             │
│  🏆 MOST CONSISTENT         │
│     Sam                     │
│                             │
│  🤡 BIGGEST FOLD            │
│     Alex (4 folds)          │
│                             │
│  78% group completion       │
│                             │
│─────────────────────────────│
│  cooked.app                 │
└─────────────────────────────┘
```

- Dimensions: 1080x1350 (Instagram)
- Format: PNG
- No PII on public cards

---

## 11. Design Deliverables

### 11.1 MVP Screens (Priority Order)

1. Group Feed
2. Check-in Modal
3. Roast Thread
4. Pacts Tab
5. Weekly Recap
6. Onboarding (5 screens)
7. Create Pact
8. Profile/Settings

### 11.2 Component Inventory

- Buttons (4 variants)
- Cards (3 variants)
- Avatars (5 sizes)
- Reactions (component)
- Input Fields (3 variants)
- Bottom Sheet
- Navigation Bar
- Tab Bar
- Notifications (in-app)
- Empty States
- Error States

---

## 12. References

- PRD: `/planning-artifacts/prd.md`
- Product Brief: `/planning-artifacts/product-brief.md`
- Research: `/planning-artifacts/research-competitive-analysis.md`

---

## Related Documents

- [[Product Brief]] - Product vision and strategy
- [[PRD]] - Full product requirements
- [[Architecture]] - Technical architecture
- [[Epics]] - Implementation epics and stories
