# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cooked** is a group accountability app (mobile + web) where friends hold each other accountable through pacts, daily check-ins, and friendly roasting. Built as a monorepo with Expo (React Native), Next.js, and Supabase.

### Monorepo Structure

```
Cooked/
├── apps/
│   ├── mobile/          # Expo/React Native app
│   └── web/             # Next.js web app
├── packages/
│   └── shared/          # Shared types, constants, config
└── supabase/            # Backend (PostgreSQL, Auth, Edge Functions)
```

**Package Manager**: pnpm (workspace support)

## Tech Stack

### Mobile App (`apps/mobile/`)
- **Framework**: Expo SDK 54+ (React Native 0.76+)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for React Native)
- **State**: Zustand + TanStack Query
- **Language**: TypeScript 5.0+ (strict mode)

### Web App (`apps/web/`)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Supabase SSR
- **Language**: TypeScript 5.0+

### Shared Backend
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (phone + email)
- **Storage**: Supabase Storage
- **Edge Functions**: Deno runtime
- **Realtime**: Supabase Realtime WebSocket

## Project Structure

### Mobile App (`apps/mobile/src/`)
```
app/                    # Expo Router (file-based routing)
├── (auth)/            # Auth screens (unauthenticated)
└── (main)/            # Main app (authenticated)
components/
└── ui/                # Design system components
hooks/                 # Custom React hooks
lib/                   # Supabase client, API helpers
stores/                # Zustand stores
types/                 # TypeScript types
utils/                 # Utility functions
```

### Web App (`apps/web/src/`)
```
app/                   # Next.js App Router
├── page.tsx          # Landing page
├── login/            # Login page
└── signup/           # Signup page
lib/                  # Supabase client
```

### Shared Package (`packages/shared/src/`)
```
types.ts              # All shared TypeScript types
constants.ts          # App constants (colors, limits)
config.ts             # Supabase config helper
index.ts              # Main export
```

## Development Commands

### Monorepo (Root)
```bash
# Install all dependencies
pnpm install

# Run mobile app
pnpm mobile

# Run web app
pnpm web

# Build web for production
pnpm build:web
```

### Mobile App (`apps/mobile/`)
```bash
cd apps/mobile

# Start Expo dev server
npx expo start
npx expo start --dev-client  # For dev build with Metro

# Run on devices
npx expo run:ios
npx expo run:android

# Run E2E tests
./scripts/run-e2e.sh

# TypeScript check
npx tsc --noEmit
```

### Web App (`apps/web/`)
```bash
cd apps/web

# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Supabase Commands

```bash
# Login to Supabase CLI
supabase login

# Link to project (required before other commands)
supabase link --project-ref <project-id>

# Generate TypeScript types from database
supabase gen types typescript --linked > src/types/database.ts

# Push local migrations to remote
supabase db push

# Create new migration
supabase migration new <name>
```

## Architecture Patterns

**State Management**:
- Zustand for UI state (user, session, currentGroup)
- React Query for server state (all data fetching)
- Never mix: Zustand doesn't fetch, React Query doesn't store UI state

**Real-time**:
- Use Supabase Realtime WebSocket subscriptions
- Channel pattern: `supabase.channel('group:${groupId}')`

**Database**:
- PostgreSQL with Row Level Security (RLS)
- Tables created just-in-time when stories need them

## Design System

- **Dark mode only**: Background #0D0D0D, Surface #1A1A1A
- **Primary color**: #FF4D00 (orange/fire theme)
- **Font**: Inter (or system default)
- **Spacing**: 4px base unit
- **Touch targets**: Minimum 44x44pt

## BMad Method Workflow

This project uses BMad Method for planning and implementation:

- **Planning docs**: `_bmad-output/planning-artifacts/`
- **Implementation**: `_bmad-output/implementation-artifacts/`
- **Sprint tracking**: `sprint-status.yaml`
- **Story files**: `stories/` folder

Key workflows:
- `/bmad:bmm:workflows:dev-story` - Implement a story
- `/bmad:bmm:workflows:create-story` - Create next story
- `/bmad:bmm:workflows:code-review` - Review implementation

## Environment Variables

Required in `.env` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Key References

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Design: `_bmad-output/planning-artifacts/ux-design.md`
- Epics/Stories: `_bmad-output/planning-artifacts/epics.md`

---

## Monorepo Setup Guide

This project was converted to a monorepo on 2026-01-15 to support both mobile and web apps sharing the same Supabase backend.

### Why Monorepo?

- **Code sharing**: Types, constants, and config shared between mobile/web
- **Single source of truth**: One Supabase backend, consistent data models
- **Simplified deployment**: Web deploys to Vercel, mobile to app stores
- **Better DX**: One `pnpm install`, workspace dependencies auto-linked

### Step-by-Step Conversion Process

#### 1. Install pnpm (Workspace Support)

```bash
npm install -g pnpm
```

#### 2. Create Monorepo Structure

```bash
mkdir -p apps/mobile apps/web packages/shared/src
```

#### 3. Create Workspace Config

**File: `pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**File: `package.json` (root)**
```json
{
  "name": "cooked-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "mobile": "pnpm --filter @cooked/mobile start",
    "web": "pnpm --filter @cooked/web dev",
    "build:mobile": "pnpm --filter @cooked/mobile build",
    "build:web": "pnpm --filter @cooked/web build"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

#### 4. Move Mobile App

```bash
# Move all mobile app files to apps/mobile/
mv src app.json babel.config.js metro.config.js \
   tsconfig.json package.json assets ios .env \
   tailwind.config.js eas.json apps/mobile/
```

Update `apps/mobile/package.json`:
```json
{
  "name": "@cooked/mobile",  // Changed from "cooked"
  "dependencies": {
    "@cooked/shared": "workspace:*",  // Added
    // ... rest of dependencies
  }
}
```

#### 5. Create Shared Package

**File: `packages/shared/package.json`**
```json
{
  "name": "@cooked/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

**File: `packages/shared/src/types.ts`**
- Copy all types from `apps/mobile/src/types/index.ts`
- Remove constants (they go in separate file)

**File: `packages/shared/src/constants.ts`**
```typescript
export const COLORS = {
  primary: '#FF4D00',
  background: '#0F0F0F',
  // ... etc
};

export const FREE_TIER_LIMITS = {
  max_groups: 1,
  max_pacts_per_group: 3,
  recap_history_weeks: 1,
};
```

**File: `packages/shared/src/config.ts`**
```typescript
export const getSupabaseConfig = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ||
              process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { url, anonKey };
};
```

**File: `packages/shared/src/index.ts`**
```typescript
export * from './types';
export * from './constants';
export * from './config';
```

#### 6. Create Next.js Web App

Create directory structure:
```bash
mkdir -p apps/web/src/app/{login,signup} apps/web/src/lib apps/web/public
```

**File: `apps/web/package.json`**
```json
{
  "name": "@cooked/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@cooked/shared": "workspace:*",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.39.3",
    "next": "15.1.2",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "15.1.2",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

**File: `apps/web/tailwind.config.ts`**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4D00',
        background: '#0F0F0F',
        surface: '#1A1A1A',
        'surface-elevated': '#242424',
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#666666',
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**File: `apps/web/src/lib/supabase.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from '@cooked/shared';

const { url, anonKey } = getSupabaseConfig();

export const supabase = createBrowserClient(url, anonKey);
```

**File: `apps/web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://nxnhqtsfugikzykxwkxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

#### 7. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for all packages and links workspace dependencies.

#### 8. Test Build

```bash
# Test web build
pnpm build:web

# Test mobile app still works
cd apps/mobile && npx expo start
```

### Common Issues & Solutions

**Issue: "Cannot find module @cooked/shared"**
```bash
pnpm install  # Re-link workspace dependencies
```

**Issue: React version mismatch**
- Ensure both apps use same React version (19.1.0)
- Check `apps/web/package.json` and `apps/mobile/package.json`

**Issue: Duplicate exports in shared package**
- Don't export constants from both `types.ts` and `constants.ts`
- Move all `export const` to `constants.ts`

**Issue: TypeScript can't find types from mobile lib**
- Comment out imports from `../lib/pactTemplates` in shared types
- These are mobile-specific and should stay in mobile app

### Deploying Web to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Convert to monorepo"
git push
```

2. **Connect to Vercel**
- Go to vercel.com
- Import GitHub repo

3. **Configure**
- Root Directory: `apps/web`
- Build Command: `pnpm build` (auto-detected)
- Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**
```
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
```

5. **Deploy**
- Click Deploy
- Vercel auto-detects monorepo structure

### Best Practices

1. **Always use workspace protocol**
   ```json
   "@cooked/shared": "workspace:*"
   ```

2. **Keep shared package lean**
   - Only types, constants, and config
   - No UI components or platform-specific code

3. **Environment variables**
   - Mobile: `EXPO_PUBLIC_*`
   - Web: `NEXT_PUBLIC_*`
   - Shared config handles both

4. **Imports**
   ```typescript
   // Good
   import { User, COLORS } from '@cooked/shared';

   // Bad
   import { User } from '../../../packages/shared/src/types';
   ```

5. **Testing**
   - Test both apps after any shared package changes
   - Run `pnpm build:web` to catch type errors early
