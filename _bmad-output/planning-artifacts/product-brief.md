---
title: "Cooked - Product Brief"
aliases:
  - "Product Brief"
  - "Brief"
tags:
  - cooked
  - planning
  - product-brief
  - mvp
status: draft
created: 2026-01-13
updated: 2026-01-14
related:
  - "[[PRD]]"
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
---

# Cooked - Product Brief

> [!info] Document Info
> **Version**: 1.0 | **Author**: Foxx (via BMad Method) | **Status**: Draft

---

## 1. Product Vision

### One-Liner
**Cooked** is a group accountability app where friends hold each other accountable through pacts, daily check-ins, and friendly roasting.

### The Problem
Productivity apps fail because they don't know your friends. Solo accountability doesn't work—people need social stakes that feel real but aren't punishing. Current solutions are either:
- **Too serious**: Financial punishment apps (Beeminder, StickK) that feel clinical
- **Too supportive**: Habit trackers (HabitShare, Habitica) that lack real social pressure
- **Too solo**: Individual streaks that die when motivation dips

### The Solution
Cooked makes accountability **fun** by turning missed goals into roast-worthy moments. Instead of losing money or breaking streaks alone, you face your friends—who will lovingly call you out with memes, polls, and receipts.

### Core Insight

> [!quote] Key Insight
> "The app should feel better after missing than pretending nothing happened."

People don't need another reminder notification. They need their friends to say "bro, you said you'd do this." That social contract—delivered with humor—is more powerful than any gamification system.

---

## 2. Target Users

### Primary: The Friend Group
- **Age**: 18-35
- **Context**: Existing friend groups (3-8 people) who already roast each other
- **Behavior**: Use group chats actively, share memes, playfully competitive
- **Goals**: Fitness, side hustles, breaking bad habits, career moves
- **Not**: Strangers looking for accountability partners (different product)

### User Personas

**"The Instigator"**
- Creates the group, pushes friends to join
- Loves calling people out
- First to roast, first to get roasted
- Will pay for premium features

**"The Folder"**
- Joins because friends made them
- Needs the social pressure to follow through
- Secretly grateful for accountability
- Most likely to improve over time

**"The Consistent One"**
- Rarely misses check-ins
- Enjoys the weekly recaps
- Becomes the group's moral compass
- Helps retain other users

### Anti-Personas (Not Our Users)
- Solo productivity enthusiasts (use Todoist)
- People seeking professional coaching (use Coach.me)
- Those who can't handle playful teasing
- Users who want strangers as accountability partners

---

## 3. Core Value Proposition

### For Users
| Without Cooked | With Cooked |
|----------------|-------------|
| Miss a goal, feel guilty alone | Miss a goal, get roasted, laugh it off, try again |
| Streaks break silently | Group knows and responds |
| No one checks if you followed through | Friends have receipts |
| Motivation is solo | Motivation is social |

### For Friend Groups
| Without Cooked | With Cooked |
|----------------|-------------|
| Accountability convos are awkward | App normalizes check-ins |
| No shared visibility on goals | Everyone sees progress |
| Inside jokes stay in chat | Inside jokes become features |
| Hard to track who's doing what | Weekly recaps show everything |

---

## 4. Core Mechanics

### The Loop
1. **Make a Pact** → Group commits to a goal (gym 3x/week, no drunk texting, etc.)
2. **Set Roast Level** → Choose how hard friends can go (🌶 to 🌶🌶🌶)
3. **Daily Check-In** → One tap: "I did it" or "I folded"
4. **Face the Group** → If you fold, roast thread opens
5. **Weekly Recap** → Stats, awards, receipts, shareable card

### Pact Types
- **Individual Pacts**: Your goal, group watches
- **Group Pacts**: Everyone does the same thing
- **Relay Pacts**: Each person has assigned days

### Roast Levels (User-Selected)
| Level | Description | What Happens |
|-------|-------------|--------------|
| 🌶 Mild | Sarcastic disappointment | Light reactions only |
| 🌶🌶 Medium | Memes + nicknames | Polls + GIF responses |
| 🌶🌶🌶 Nuclear | Full receipts | Screenshots, leaderboards, pinned shame |

### Safety Rails
- **Roasts are opt-in**: You pick your level
- **Mute anytime**: Step back without leaving
- **Safe words**: Immediately pause roasting
- **Friends only**: No strangers, no public

---

## 5. MVP Scope (5 Screens)

### Screen 1: Group Feed (Home)
The heart of the app. Shows:
- Latest check-ins (who did it, who folded)
- Active roast threads
- Quick reactions (💀 🧢 🤡 🫡)
- New pacts / group activity

### Screen 2: Create/Join Pact
- Pact name
- Who's in it
- Frequency (daily/weekly)
- Roast level 🌶
- Proof type (optional/required/vibes-based)

### Screen 3: Daily Check-In
One tap:
- ✅ "I did it"
- ❌ "I folded"

If folded, optional excuse selector:
- "Long day"
- "Forgot"
- "Be honest, I just didn't want to"

### Screen 4: Roast Thread
Opens when someone folds:
- Roast replies (text, memes, GIFs)
- Polls ("How bad was this?" "Was this avoidable?")
- Best roast gets pinned
- Reaction summary

### Screen 5: Weekly Recap
Auto-generated every Sunday:
- 🏆 Most Consistent
- 🤡 Biggest Fold
- 🧢 Excuse Hall of Fame
- 🔥 Comeback Player
- Shareable recap card

### Explicitly NOT in MVP
- AI roasting
- Public feeds/discovery
- Badges/achievements beyond recap
- Multiple group support (start with 1)
- Web version (mobile-first)
- Dark mode toggle (dark by default)

---

## 6. Differentiation

### vs. Beeminder/StickK (Money Apps)
| Them | Cooked |
|------|--------|
| Financial stakes | Social stakes |
| Solo + referee | Group-first |
| Analytical graphs | Memes and polls |
| Lose money | Get roasted |

### vs. HabitShare/Habitica (Social Habit Apps)
| Them | Cooked |
|------|--------|
| Supportive/earnest | Playfully disrespectful |
| Encouragement | Accountability |
| Streaks | Roast threads |
| High fives | Receipts |

### vs. Group Chats
| Group Chat | Cooked |
|------------|--------|
| Goals get lost | Pacts are structured |
| No visibility | Check-ins are tracked |
| Awkward to call out | App normalizes calling out |
| No recaps | Weekly summaries |

---

## 7. Success Metrics

### North Star Metric
**Weekly Active Groups** (WAG)
- A group that has at least 3 check-ins in a week
- Indicates real engagement, not just downloads

### Leading Indicators
| Metric | Target (MVP) | Why It Matters |
|--------|--------------|----------------|
| D1 Retention | >35% | Above industry average (26%) |
| D7 Retention | >20% | Group dynamics kick in |
| D30 Retention | >12% | Habit formation window |
| Check-ins/user/week | >4 | Active engagement |
| Roast threads/group/week | >2 | Feature is working |
| Invite rate | >0.5 invites/user | Viral growth |

### Business Metrics
| Metric | Target (6 months) |
|--------|-------------------|
| Total groups | 500 |
| Paid conversion | 10% |
| MRR | $2,500 |
| CAC | <$5/group |

---

## 8. Business Model

### Revenue Streams

**1. Group Subscriptions (Primary)**
- Free: 1 group, 3 pacts max, basic features
- Premium: $5/month per group
  - Unlimited pacts
  - Full recap history
  - Polls + advanced reactions
  - Custom roast prompts
  - Group stats/analytics

**Why per-group**: Friends split it. $5 ÷ 5 people = $1/person feels invisible.

**2. Stakes Facilitation (Secondary)**
- Optional money stakes between friends
- Loser pays winner via integrated payment
- Cooked takes 5-10% facilitation fee
- Fully opt-in, not gambling

**3. Anonymous Insight Reports (Tertiary)**
- Aggregated behavioral data (never PII)
- Sold to researchers, brands, HR consultants
- Example products:
  - "How People Actually Fail" quarterly report
  - Habit category benchmarks
  - Accountability effectiveness research

---

## 9. Go-to-Market Strategy

### Launch Strategy: "Tight Groups"
1. **Seed with 10-20 real friend groups** (not random users)
2. **Observe what works** (which pacts, which roast levels)
3. **Iterate on tone** (copy, prompts, reactions)
4. **Enable sharing** (weekly recap cards)
5. **Let it spread organically**

### Growth Loops
1. **Invite Loop**: Can't play alone → must invite friends
2. **Recap Loop**: Shareable weekly cards → social media exposure
3. **Roast Loop**: Good roasts get screenshotted → word of mouth

### Marketing Channels
| Channel | Strategy | Priority |
|---------|----------|----------|
| TikTok | Roast compilations, recap cards | High |
| Instagram | Weekly recap stories | High |
| Twitter/X | "Cooked moments" | Medium |
| Word of mouth | Friend-to-friend | High |
| Influencers | Micro (friend groups, not individuals) | Low |

### Launch Copy
- "You said you'd do it."
- "Accountability, but disrespectful."
- "Get it done or get cooked."
- "Receipts over excuses."

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Roasting becomes toxic | Medium | High | Opt-in levels, mute, safe words, moderation guidelines |
| Low retention like other habit apps | Medium | High | Group-first model, weekly recaps, humor retains |
| Friends won't pay | Medium | Medium | Per-group pricing, free tier is usable |
| Copycat competition | Low | Low | Tone/brand is the moat |
| App Store rejection (bullying concerns) | Low | Medium | Safety features prominently documented |

---

## 11. Technical Direction

### Recommended Stack
- **Frontend**: Expo (React Native) - cross-platform, OTA updates
- **Backend**: Supabase - auth, database, real-time, edge functions
- **Notifications**: Expo Push Notifications
- **Payments**: Stripe (for stakes and subscriptions)
- **Analytics**: Mixpanel or Amplitude

### Why This Stack
- Fast to build (2-week MVP possible)
- Real-time features built-in (crucial for roast threads)
- Scales affordably
- React ecosystem = easy hiring

---

## 12. Open Questions (For PRD)

1. **Proof mechanics**: How strict? Photo required? Location? Honor system?
2. **Group size limits**: Min 3, but max? 8? 10? Unlimited?
3. **Multiple groups**: MVP = 1 group. When to add multi-group?
4. **Notification strategy**: How many nudges before annoying?
5. **Moderation**: How to handle actual bullying vs playful roasting?
6. **Onboarding**: Tutorial? Or learn by doing?

---

## 13. Appendix: Brainstorm Artifacts

### Original Vision (from ChatGPT session)
> "Side note I want to create an app to help friend groups hold each other accountable"

### Tone Pillars
- Playful disrespect
- Inside-joke energy
- Receipts > excuses
- Roast with love, not cruelty

### Key Insight
> "Productivity apps fail because they don't know your friends."

### Vibe Check
The app should feel like:
- Group chat energy

Not like:
- Corporate habit tracker
- Therapy app
- Nagging reminder system

---

## Related Documents

- [[PRD]] - Full product requirements
- [[UX Design]] - Design system and screens
- [[Architecture]] - Technical architecture
- [[Epics]] - Implementation epics and stories

---

> [!success] Next Steps
> **Next Steps**: [[PRD]] → [[UX Design]] → [[Architecture]] → [[Epics]]
