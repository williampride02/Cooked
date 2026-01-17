---
title: "Incomplete Issues - Cooked Project"
aliases:
  - "Cooked TODOs"
  - "Pending Issues"
tags:
  - cooked
  - project-management
  - technical-debt
  - todo
status: in-progress
created: 2026-01-16
updated: 2026-01-16
---

# Incomplete Issues - Cooked Project

> [!abstract] Overview
> This document tracks all incomplete issues, pending tasks, and technical debt for the Cooked project. Issues are organized by priority and category.

---

## 🔴 Critical Issues

### 1. Verify Signup/Login Flow Works End-to-End

**Status:** ⏳ Waiting for Vercel deployment

**Context:**
- Fixed database schema to make `phone` field nullable
- Updated signup code to pass `null` instead of `''` for email-based signups
- Pushed changes to trigger Vercel rebuild
- Need to test signup with: `williampridere@gmail.com` / `Test123`

**Next Steps:**
1. Wait 1-2 minutes for Vercel deployment to complete
2. Visit https://cooked-web-six.vercel.app/signup
3. Create account with email `williampridere@gmail.com`
4. Verify user is created in Supabase `users` table
5. Test login flow
6. Verify dashboard redirect works

**Files:**
- `apps/web/src/app/signup/page.tsx:45` - Phone field set to null
- `supabase/migrations/20260116000000_make_phone_nullable.sql` - Migration

---

### 2. Apply All Database Migrations to Production

**Status:** ⚠️ Partially Complete

**Context:**
Only one migration has been confirmed applied to production:
- ✅ `20260116000000_make_phone_nullable.sql` - Applied

**Migrations that may not be applied:**
- ❓ `20260114000000_initial_schema.sql` - Core schema (users, groups, pacts, etc.)
- ❓ `20260114000001_disable_rls_for_dev.sql` - RLS policies
- ❓ `20260114000002_add_polls.sql` - Polls feature
- ❓ `20260114000003_create_storage_buckets.sql` - Storage setup
- ❓ `20260114000004_add_weekly_recap_cron.sql` - Cron jobs
- ❓ `20260114000005_add_pact_templates.sql` - Templates
- ❓ `20260114000006_add_achievements.sql` - Achievements

**Next Steps:**
1. Check Supabase dashboard → Database → Migrations to see what's applied
2. Run `supabase db push` to apply all pending migrations
3. Verify tables exist in production database

> [!danger] Critical
> The initial schema migration creates the core `users`, `groups`, `pacts` tables. If this hasn't been applied, the app won't work at all.

**Command:**
```bash
cd /Users/williampride/Projects/Cooked
supabase db push
```

---

### 3. Email Verification Disabled for Security

**Status:** 🔓 Security Risk

**Context:**
- Disabled "Confirm email" in Supabase auth settings to fix 500 errors
- This means anyone can sign up without verifying their email address
- **This is NOT production-ready**

**Trade-offs:**
- ✅ Allows signup to work without email delivery setup
- ❌ No email verification means potential spam accounts
- ❌ Users can sign up with fake/invalid email addresses

**Next Steps (for production):**
1. Set up email delivery in Supabase:
   - Option A: Use Supabase's built-in email service (limited free tier)
   - Option B: Configure custom SMTP (Sendgrid, AWS SES, etc.)
2. Re-enable "Confirm email" in Supabase dashboard
3. Customize email templates in Supabase → Authentication → Email Templates

**Supabase Dashboard:**
https://supabase.com/dashboard/project/nxnhqtsfugikzykxwkxk/auth/providers

> [!warning] For Development Only
> Email confirmation is currently disabled. This is acceptable for development but **must be enabled before production launch**.

---

## 🟡 High Priority Issues

### 4. Storage Buckets Not Created

**Status:** ❌ Not Started

**Context:**
The migration file `20260114000003_create_storage_buckets.sql` mentions that storage buckets need to be created manually in the Supabase dashboard:

```sql
-- Note: Run these in the Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('roasts', 'roasts', false);
```

**Required Buckets:**
1. **avatars** (public) - User profile pictures
2. **proofs** (private) - Check-in proof images
3. **roasts** (private) - Roast response GIFs/images

**Next Steps:**
1. Go to Supabase Dashboard → Storage
2. Create three buckets with the settings above
3. Configure RLS policies for each bucket
4. Test image uploads from the app

**Supabase Dashboard:**
https://supabase.com/dashboard/project/nxnhqtsfugikzykxwkxk/storage/buckets

---

### 5. Mobile App Environment Not Tested

**Status:** ⏸️ On Hold

**Context:**
- Mobile app has `.env` file configured with Supabase credentials
- Haven't tested if the Expo app builds and connects to Supabase
- May need additional mobile-specific setup

**Files:**
- `apps/mobile/.env` - Environment variables configured
- `apps/mobile/src/lib/supabase.ts` - Supabase client setup

**Next Steps:**
1. Start Expo development server: `cd apps/mobile && pnpm start`
2. Test on iOS simulator or physical device
3. Verify Supabase connection works
4. Test signup/login flow on mobile

---

### 6. Dashboard is Placeholder Only

**Status:** 🚧 Not Implemented

**Context:**
The dashboard page at `/dashboard` shows a "coming soon" message:

```tsx
<div className="mt-8 p-4 bg-background rounded-lg border border-text-muted/20">
  <p className="text-text-secondary text-sm">
    🚧 Dashboard coming soon! Groups, pacts, and check-ins will appear here.
  </p>
</div>
```

**Next Steps:**
1. Design dashboard layout (groups list, active pacts, recent activity)
2. Implement groups fetching from Supabase
3. Implement pacts fetching
4. Add navigation to create group/join group
5. Add quick check-in buttons for active pacts

**Files:**
- `apps/web/src/app/dashboard/page.tsx:94-98` - Placeholder content

---

## 🟢 Medium Priority Issues

### 7. Improve Error Handling in Auth Pages

**Status:** 📝 Enhancement Needed

**Context:**
Current error handling in signup/login is basic:
- Shows error message in a red box
- No specific error codes or user-friendly messages
- No loading states beyond button text change

**Improvements Needed:**
1. **Better error messages:**
   - "Email already exists" → "An account with this email already exists. Try logging in instead?"
   - "Invalid password" → "Password must be at least 6 characters"
   - Network errors → "Connection failed. Please check your internet and try again."

2. **Loading states:**
   - Disable form fields while submitting
   - Show spinner in button
   - Prevent double-submission

3. **Success feedback:**
   - Show success toast/notification
   - Smooth transition to dashboard

**Files:**
- `apps/web/src/app/signup/page.tsx:20-63` - Signup handler
- `apps/web/src/app/login/page.tsx:28-49` - Login handler

---

### 8. Vercel Environment Variables Not Using Sensitive Mode

**Status:** 🔐 Security Enhancement

**Context:**
Added environment variables to Vercel manually through dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Issue:**
The anon key is marked as "public" (NEXT_PUBLIC prefix) which means it's embedded in client-side JavaScript. This is **intentional** for Supabase's security model (Row Level Security protects data), but we should verify:

1. RLS policies are properly configured
2. Anon key has appropriate permissions
3. No sensitive operations are exposed to public

**Next Steps:**
1. Review RLS policies in Supabase dashboard
2. Test that users can only read/write their own data
3. Consider adding service role key as server-side env var for admin operations

---

### 9. Supabase CLI Outdated

**Status:** 🔄 Minor Update

**Context:**
Current version: `v2.67.1`
Latest version: `v2.72.7`

**Warning message:**
```
A new version of Supabase CLI is available: v2.72.7 (currently installed v2.67.1)
We recommend updating regularly for new features and bug fixes
```

**Next Steps:**
```bash
brew upgrade supabase
# or
npm install -g supabase@latest
```

---

## 🔵 Low Priority / Nice-to-Have

### 10. Missing Favicon

**Status:** 🎨 UI Polish

**Console error:**
```
favicon.ico:1 Failed to load resource: the server responded with a status of 404
```

**Next Steps:**
1. Create favicon.ico file
2. Place in `apps/web/public/favicon.ico`
3. Add to Next.js metadata configuration

---

### 11. PropGen Studio Extension Errors

**Status:** ℹ️ External Tool Issue

**Console errors:**
```
page-events.js:6 Uncaught TypeError: Cannot read properties of undefined (reading 'length')
```

**Context:**
This appears to be from a Chrome extension ("PropGen Studio") interfering with the page. Not a bug in our code.

**Next Steps:**
- Can be ignored for now
- If it causes issues, disable the extension while testing

---

### 12. Add .gitignore for Next.js

**Status:** ✅ Partially Complete

**Context:**
Created `apps/web/.gitignore` during the session but should verify it includes all necessary Next.js patterns.

**Recommended .gitignore entries:**
```
# Next.js
.next/
out/
build/
dist/

# Environment
.env*.local
.env.production

# Vercel
.vercel

# Dependencies
node_modules/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

**Files:**
- `apps/web/.gitignore` - Verify and expand

---

## 📊 Technical Debt Summary

| Category | Count | Priority |
|----------|-------|----------|
| Critical | 3 | 🔴 |
| High | 4 | 🟡 |
| Medium | 3 | 🟢 |
| Low | 3 | 🔵 |
| **Total** | **13** | |

---

## 🎯 Recommended Next Actions

1. **Verify signup works** (5 min)
   - Test signup at deployed URL
   - Create test account

2. **Apply all migrations** (10 min)
   - Check which migrations are applied
   - Run `supabase db push` to apply pending

3. **Create storage buckets** (5 min)
   - Create avatars, proofs, roasts buckets in Supabase

4. **Set up email verification** (30 min)
   - Choose email provider
   - Configure SMTP settings
   - Re-enable email confirmation

5. **Test mobile app** (15 min)
   - Start Expo dev server
   - Verify Supabase connection

---

## 📝 Notes

> [!tip] Testing Checklist
> When testing signup/login:
> - [ ] Signup creates user in `auth.users`
> - [ ] Signup creates profile in `public.users`
> - [ ] Login redirects to dashboard
> - [ ] Dashboard shows user info
> - [ ] Logout works and redirects to home

> [!bug] Known Issues
> - Email confirmation disabled (security risk)
> - Storage buckets don't exist yet
> - Dashboard is placeholder

> [!info] Environment URLs
> - **Production Web App:** https://cooked-web-six.vercel.app
> - **Supabase Dashboard:** https://supabase.com/dashboard/project/nxnhqtsfugikzykxwkxk
> - **Vercel Project:** https://vercel.com/william-prides-projects/cooked-web
> - **GitHub Repo:** https://github.com/williampride02/Cooked

---

## Related Documents

- [[CLAUDE.md]] - Project setup and monorepo guide
- [[TROUBLESHOOTING-IPHONE-INSTALL.md]] - Mobile app installation issues
- [[Supabase Migrations]] - Database schema documentation

---

*Last updated: 2026-01-16*
*Generated during Vercel deployment troubleshooting session*
