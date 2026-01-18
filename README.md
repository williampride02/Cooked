# Cooked Monorepo

Hold your friends accountable. Get roasted when you fold.

## 📁 Structure

```
Cooked/
├── apps/
│   ├── mobile/         # React Native/Expo mobile app
│   └── web/            # Next.js web app
├── packages/
│   └── shared/         # Shared types, constants, and config
└── supabase/           # Supabase backend (database, edge functions)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- iOS: Xcode (needed only if you build iOS locally)
- Android: Android Studio (needed only if you build Android locally)
- Supabase account

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run mobile app
pnpm mobile

# Run web app
pnpm web

# Build web app for production
pnpm build:web
```

## 📱 Mobile App (Expo)

Located in `apps/mobile/`

### Native folders (CNG)

This repo uses **Expo CNG (Continuous Native Generation)**, so `apps/mobile/ios/` and `apps/mobile/android/` are generated during builds and are not committed.
See `docs/expo-cng-workflow.md` for details.

### Running on iOS

```bash
cd apps/mobile
npx expo start --dev-client

# Native build (generates ios/ locally)
npx expo run:ios
```

### Running E2E Tests

```bash
cd apps/mobile
./scripts/run-e2e.sh
```

## 🌐 Web App (Next.js)

Located in `apps/web/`

### Local Development

```bash
pnpm web
# Opens at http://localhost:3000
```

### Deploying to Vercel

1. **Connect GitHub Repo to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Build Settings**
   - Root Directory: `apps/web`
   - Framework Preset: Next.js
   - Build Command: `pnpm build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel automatically detects the monorepo structure

## 📦 Shared Package

Located in `packages/shared/`

Contains:
- TypeScript types for all database models
- Supabase configuration helpers
- App constants (colors, limits, etc.)

Import in either app:
```typescript
import { User, Group, COLORS } from '@cooked/shared';
```

## 🗄️ Database (Supabase)

Located in `supabase/`

### Local Development

```bash
supabase start
supabase db reset  # Reset and apply migrations
```

### Migrations

```bash
supabase migration new my_migration
# Edit migration file
supabase db push
```

## 🔑 Environment Variables

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_TENOR_API_KEY=
EXPO_PUBLIC_REVENUECAT_API_KEY=
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `pnpm mobile` | Start Expo mobile app |
| `pnpm web` | Start Next.js web app |
| `pnpm build:web` | Build web app for production |
| `pnpm build:mobile` | Build mobile app |

## 🎨 Design System

Both apps share the same design system:

- **Primary**: `#FF4D00` (Cooked Orange)
- **Background**: `#0F0F0F`
- **Surface**: `#1A1A1A`
- **Text**: `#FFFFFF`, `#A0A0A0`, `#666666`

Using Tailwind CSS for web and NativeWind for mobile.

## 📚 Tech Stack

### Mobile
- React Native / Expo
- expo-router (file-based routing)
- NativeWind (Tailwind for React Native)
- Supabase (auth, database, storage)
- TanStack Query (data fetching)

### Web
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- Supabase SSR
- TypeScript

### Shared Backend
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Row-level security policies
- Real-time subscriptions

## 📄 License

MIT
