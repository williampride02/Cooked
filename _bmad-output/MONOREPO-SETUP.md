---
title: "Monorepo Setup Complete"
tags:
  - deployment
  - monorepo
  - vercel
status: completed
created: 2026-01-15
updated: 2026-01-15
---

# Monorepo Setup Complete

The Cooked project has been successfully converted to a monorepo structure.

---

## Structure

```
Cooked/
├── apps/
│   ├── mobile/          # Expo/React Native app (existing)
│   └── web/             # Next.js web app (new)
├── packages/
│   └── shared/          # Shared types & constants
├── supabase/            # Backend (unchanged)
└── pnpm-workspace.yaml  # Workspace config
```

---

## What Was Created

### 1. Next.js Web App (`apps/web/`)

- Landing page with branding
- Login/Signup pages (UI only - needs auth implementation)
- Same design system as mobile (dark theme, Cooked orange)
- Supabase client configured
- Tailwind CSS setup

### 2. Shared Package (`packages/shared/`)

Contains shared code:
- All TypeScript types (User, Group, Pact, etc.)
- App constants (colors, limits)
- Supabase config helper

Both apps can import:
```typescript
import { User, COLORS, getSupabaseConfig } from '@cooked/shared';
```

### 3. Workspace Configuration

- Using `pnpm` for package management
- Root `package.json` with scripts:
  - `pnpm mobile` - Run mobile app
  - `pnpm web` - Run web app
  - `pnpm build:web` - Build web for production

---

## Deploying to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Convert to monorepo with Next.js web app"
git push
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repo

### Step 3: Configure Project

In Vercel's project settings:

**Root Directory**: `apps/web`

**Build & Development Settings**:
- Framework Preset: Next.js (auto-detected)
- Build Command: `pnpm build`
- Output Directory: `.next`

**Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=https://nxnhqtsfugikzykxwkxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 4: Deploy

Click "Deploy" and Vercel will:
1. Detect the monorepo structure
2. Install dependencies with `pnpm`
3. Build the Next.js app
4. Deploy to production

Your web app will be live at: `https://cooked-<hash>.vercel.app`

---

## Next Steps

### For the Web App

1. **Implement Auth**
   - Add email/password signup in `/signup/page.tsx`
   - Add login logic in `/login/page.tsx`
   - Create auth context/hooks

2. **Build Dashboard**
   - Groups overview
   - Pacts list
   - Check-in flow
   - Roast threads

3. **Add Linking**
   - Link accounts (phone + email)
   - Share data between mobile/web

### For Mobile App

1. **Update Imports**
   - Replace local types with `@cooked/shared` imports
   - Test that everything still works

2. **Add Email Auth**
   - Let users sign up with email
   - Link email to existing phone accounts

---

## Testing

### Web App (Local)

```bash
pnpm web
# Visit http://localhost:3000
```

### Mobile App (Still Works)

```bash
pnpm mobile
# Or: cd apps/mobile && npx expo start --dev-client
```

### Build Check

```bash
# Web
pnpm build:web

# Both
pnpm build:web && pnpm build:mobile
```

---

## Troubleshooting

### "Cannot find module @cooked/shared"

Run `pnpm install` at the root to link workspace packages.

### Vercel Build Fails

- Ensure `apps/web/.env.local` is gitignored (it is)
- Add environment variables in Vercel dashboard
- Check Root Directory is set to `apps/web`

### Mobile App Broken After Move

Paths should still work - everything's in `apps/mobile/` now.

If imports break, they may need updating to `@cooked/shared`.

---

## File Locations

| Before | After |
|--------|-------|
| `/src/` | `/apps/mobile/src/` |
| `/package.json` | `/apps/mobile/package.json` |
| N/A | `/apps/web/` (new) |
| N/A | `/packages/shared/` (new) |
| `/supabase/` | `/supabase/` (unchanged) |

---

## Current Status

✅ Monorepo structure created
✅ Mobile app moved to `apps/mobile/`
✅ Web app created in `apps/web/`
✅ Shared package with types & constants
✅ Web app builds successfully
✅ Dependencies installed

🎯 Ready to deploy to Vercel
🎯 Ready to implement auth in web app
🎯 Ready to build dashboard features
