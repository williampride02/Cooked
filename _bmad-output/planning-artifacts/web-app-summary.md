---
title: "Cooked - Web App Summary"
aliases:
  - "Web App Overview"
tags:
  - cooked
  - planning
  - web-app
  - summary
status: draft
created: 2026-01-16
updated: 2026-01-16
related:
  - "[[Web App Design]]"
  - "[[Web App Auth Spec]]"
---

# Cooked - Web App Summary

## Quick Reference

**Purpose**: Backend testing platform + cross-platform access

**Key Feature**: Dual authentication (email OR phone) with account linking

**Status**: In development - critical for backend testing before Apple Developer costs

---

## Key Documents

1. **[[Web App Design]]** - Complete architecture and feature specification
2. **[[Web App Auth Spec]]** - Detailed authentication and account linking implementation

---

## Critical Requirements

### ✅ Must Have

1. **Dual Authentication**
   - Users can sign up/login with email/password
   - Users can sign up/login with phone/OTP
   - Both methods work on web and mobile

2. **Account Linking**
   - Users can link phone to email account
   - Users can link email to phone account
   - Users can log in with either method after linking

3. **Backend Testing**
   - Test all Supabase functionality
   - Test Edge Functions
   - Test database operations
   - Test real-time subscriptions

### 🎯 Implementation Priority

**Phase 1 (Now)**: Authentication + Account Linking
- Email/password auth
- Phone/OTP auth
- Account linking UI
- Settings page

**Phase 2 (Next)**: Core Features
- Dashboard
- Groups view
- Pacts view
- Check-in interface

**Phase 3 (Later)**: Full Parity
- Real-time feed
- Roast threads
- Weekly recaps

---

## Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Supabase SSR (`@supabase/ssr`)
- **Styling**: Tailwind CSS (shared design system)
- **State**: React Query
- **Real-time**: Supabase Realtime
- **Types**: `@cooked/shared` package

---

## Account Linking Flow

```
User signs up with email (web)
  ↓
User can link phone number
  ↓
User can now log in with EITHER email OR phone
  ↓
Same account, same data, cross-platform access
```

---

## Testing Strategy

**Before Mobile Deployment:**
1. Develop feature in web app
2. Test backend functionality
3. Verify database operations
4. Test Edge Functions
5. Once validated, implement in mobile

**Benefits:**
- No Apple Developer costs during development
- Faster iteration
- Easier debugging
- Direct database access

---

## Next Steps

1. ✅ Planning docs created
2. ⏳ Implement email/password auth (enhance existing)
3. ⏳ Implement phone/OTP auth on web
4. ⏳ Implement account linking
5. ⏳ Build core features for testing

---

## Related Documents

- [[Web App Design]] - Full specification
- [[Web App Auth Spec]] - Authentication details
- [[Architecture]] - System architecture
- [[PRD]] - Product requirements
