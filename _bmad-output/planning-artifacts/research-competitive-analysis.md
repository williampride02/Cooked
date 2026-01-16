---
title: "Cooked - Competitive Analysis"
aliases:
  - "Competitive Analysis"
  - "Research"
  - "Market Research"
tags:
  - cooked
  - planning
  - research
  - competitive-analysis
  - market
status: completed
created: 2026-01-13
updated: 2026-01-14
related:
  - "[[Product Brief]]"
  - "[[PRD]]"
---

# Cooked - Competitive & Technical Research

> [!info] Document Info
> **Type**: Competitive Analysis | **Status**: Completed

**Generated**: 2026-01-13
**Research Type**: Competitive Analysis + Technical Feasibility
**Project**: Cooked - Roasty Group Accountability App

---

## Executive Summary

The accountability app market is established but fragmented, with most players focusing on either **financial punishment** (Beeminder, StickK) or **gamification** (Habitica). The **social accountability with humor** niche that Cooked targets is significantly underserved. Existing social habit apps (HabitShare, Habitat, Squad) are earnest and supportive—none embrace the "roasty" friend group energy that drives real social dynamics.

**Key Opportunity**: No current app combines group accountability + humor/roasting + low-friction check-ins + viral social mechanics.

---

## Competitive Landscape

### Tier 1: Financial Punishment Apps

| App | Model | Strengths | Weaknesses |
|-----|-------|-----------|------------|
| **Beeminder** | Data-driven + money stakes | Integrations (Fitbit, Todoist, GitHub), graphs, bot reminders | Cold/analytical, no social, requires quantifiable goals |
| **StickK** | Commitment contracts + referee | Anti-charity donations, Yale-backed psychology | Needs manual referee, no group dynamics |
| **GoFuckingDoIt** | Money pledges | Simple, bold branding | Basic features, no community |

**Insight**: These apps use fear/money as the lever. Cooked uses **social shame + humor**—which is free and more fun.

### Tier 2: Social Habit Trackers

| App | Model | Strengths | Weaknesses |
|-----|-------|-----------|------------|
| **HabitShare** | Share habits with friends | Privacy controls, GIF reactions, streaks | Supportive only—no roasting, no stakes |
| **Habitat** | Group "habitats" | Group + individual streaks, $2.99/mo | Earnest tone, no humor, small user base |
| **Squad** | Group challenges | Atomic Habits methodology, 10-30 day challenges | Pre-set challenges only, no custom pacts |
| **Folksable** | Photo check-ins | Visual accountability | No group interaction beyond photos |
| **Cohorty** | Cohort-based matching | Strangers-to-friends, pre-made challenges | No existing friend groups, strangers |
| **Habit Hive** | Friend groups | Group framework, community | Generic, no personality |

**Insight**: All social apps are **supportive and earnest**. None have roasting, polls, meme reactions, or "call out" mechanics. This is Cooked's wedge.

### Tier 3: Gamification Apps

| App | Model | Strengths | Weaknesses |
|-----|-------|-----------|------------|
| **Habitica** | RPG game | Parties (4-30), shared health, quests | Complex, requires game commitment, nerdy |

**Insight**: Gamification works for some, but most friend groups won't commit to a full RPG. Cooked's "game" is simpler: **don't get roasted**.

### Tier 4: Coaching/Marketplace

| App | Model | Pricing | Notes |
|-----|-------|---------|-------|
| **Coach.me** | Human coaches | $25+/week | Professional, not friend-based |
| **ActionBuddy** | Partner matching | Free/premium | Strangers, not existing friends |

**Insight**: These solve a different problem (stranger accountability). Cooked is for **people who already know each other**.

---

## Cooked's Competitive Advantages

| Factor | Competitors | Cooked |
|--------|-------------|--------|
| **Tone** | Supportive, earnest, clinical | Fun, roasty, group chat energy |
| **Stakes** | Money or health points | Social embarrassment (free, renewable) |
| **Group Model** | Individual + optional sharing | Group-first (can't use alone) |
| **Content** | Check-ins, streaks | Roast threads, polls, memes, weekly recaps |
| **Virality** | None built-in | Shareable recaps, invite mechanics |
| **Monetization** | Per-user subscriptions | Per-group (friends split = cheaper feel) |

---

## Market Size & Opportunity

### Habit Tracking App Market
- **Global market size (2025)**: Growing rapidly with health/wellness trends
- **User base**: Millions of downloads across category leaders
- **Primary demographics**: 18-35, health-conscious, goal-oriented

### Retention Challenge (Critical Insight)
- **52% of users** discontinue habit apps within 30 days
- **44% lose motivation** after breaking streaks
- **Average 30-day retention**: Just 6-8% across all apps
- **Day 1 retention benchmark**: 26-30%

**Why This Matters for Cooked**:
Most apps fail because they're **solo experiences**. Social accountability increases completion rates by **65%** (American Society of Training and Development). Group membership makes users **95% more likely** to complete goals.

Cooked's group-first model directly addresses the retention crisis.

---

## Technical Feasibility Analysis

### Recommended Stack: Supabase + React Native/Expo

**Why Supabase**:
1. **Real-time subscriptions**: Built-in WebSocket support for live roast threads
2. **Authentication**: Phone number auth out of the box
3. **Database**: PostgreSQL with instant APIs
4. **Edge Functions**: Serverless logic for notifications, recap generation
5. **Cost**: Generous free tier, scales affordably

**Supabase Realtime Architecture**:
- Uses PostgreSQL's logical replication for change data capture
- Elixir-based server handles thousands of concurrent connections
- Channel-based subscriptions for group-specific updates
- Optimistic UI patterns for instant feedback

**Key Technical Considerations**:
| Feature | Implementation | Complexity |
|---------|---------------|------------|
| Group feed | Supabase Realtime subscriptions | Low |
| Check-ins | Simple insert + broadcast | Low |
| Roast threads | Nested comments + reactions | Medium |
| Weekly recap | Edge Function + cron job | Medium |
| Push notifications | Expo Push + Supabase triggers | Medium |
| Invite links | Deep links + group membership | Low |

**Mobile Framework Options**:
| Option | Pros | Cons |
|--------|------|------|
| **Expo/React Native** | Cross-platform, fast iteration, OTA updates | Some native limitations |
| **Flutter** | Good performance, growing ecosystem | Dart learning curve |
| **Native (Swift/Kotlin)** | Best performance | 2x development cost |

**Recommendation**: Expo + Supabase for MVP. Proven combo for social apps with real-time features.

---

## Monetization Analysis

### Current Market Pricing

| App | Model | Price |
|-----|-------|-------|
| Habitat | Monthly sub | $2.99/mo |
| Done | Premium | $4.99/mo |
| Streaks | One-time | $6.99 |
| Coach.me | Weekly coaching | $25+/week |
| Tability | Per-seat | $4-8/user/mo |

### Cooked's Proposed Model

**Primary: Group Subscription**
- Free: 1 group, basic features
- Premium: $5/month per group
- Why per-group: Friends split it ($1/person in 5-person group)

**Secondary: Stakes Facilitation**
- Optional money stakes between friends
- Cooked takes 5-10% facilitation fee
- Not gambling—voluntary, friend-to-friend

**Tertiary: Anonymous Insight Reports**
- Aggregated behavioral data (not PII)
- Sold to researchers, brands, HR firms
- Example: "How people actually fail at habits"

### Revenue Projections (Conservative)

| Milestone | Groups | MRR | ARR |
|-----------|--------|-----|-----|
| 6 months | 500 | $2,500 | $30,000 |
| 12 months | 1,000 | $5,000 | $60,000 |
| 24 months | 5,000 | $25,000 | $300,000 |

---

## Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Roasting becomes toxic | Medium | High | Opt-in levels, mute, safe words |
| Low retention like other habit apps | Medium | High | Group-first model, weekly recaps, humor |
| Friends don't pay | Medium | Medium | Per-group pricing feels cheap |
| Competition copies feature | Low | Low | Tone/brand hard to copy |

---

## Strategic Recommendations

1. **Nail the tone**: The app's personality IS the product. Invest in copywriting.

2. **Group-first onboarding**: Require 3+ friends to start. Solo users aren't the target.

3. **Weekly recap as viral loop**: Shareable recap cards = organic growth.

4. **Safety rails**: Roast levels, mute options, safe words. Fun ≠ toxic.

5. **Launch tight**: 5 screens only. Don't overbuild before validation.

---

## Sources

- [ActionBuddy - Accountability Apps](https://actionbuddy.io/blog/accountability-apps)
- [Cohorty - Best Habit Tracking Apps with Friends](https://www.cohorty.app/blog/best-habit-tracking-apps-with-friends)
- [Beeminder Help - Beeminder vs StickK](https://help.beeminder.com/article/49-why-should-i-use-beeminder-over-stickk)
- [HabitShare](https://habitshareapp.com/)
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Plotline - Mobile App Retention Rates](https://www.plotline.so/blog/retention-rates-mobile-apps-by-industry)
- [GetStream - App Retention Guide 2026](https://getstream.io/blog/app-retention-guide/)
- [Business of Apps - App Monetization](https://www.businessofapps.com/marketplace/app-marketing/research/app-monetization-models/)

---

## Related Documents

- [[Product Brief]] - Product vision informed by this research
- [[PRD]] - Requirements built on competitive insights
