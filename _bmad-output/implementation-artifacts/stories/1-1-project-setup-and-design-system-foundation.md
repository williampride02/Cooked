---
title: "Story 1.1 - Project Setup and Design System Foundation"
aliases:
  - "Story 1.1"
  - "Project Setup"
  - "Design System Foundation"
tags:
  - cooked
  - implementation
  - story
  - epic-1
  - foundation
  - design-system
status: review
created: 2026-01-14
updated: 2026-01-14
epic: 1
story: 1
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
---

# Story 1.1: Project Setup and Design System Foundation

Status: done

## Story

As a **developer**,
I want **an initialized Expo project with Supabase integration and design system foundation**,
So that **I have the technical infrastructure to build the app**.

## Acceptance Criteria

1. **AC1: Expo Project Created**
   - Given no existing project
   - When I run the project setup
   - Then an Expo project is created with TypeScript configuration
   - And the project uses Expo SDK 50+ with React Native 0.73+
   - And TypeScript 5.0+ is configured with strict mode

2. **AC2: Supabase Integration**
   - Given the Expo project exists
   - When I configure Supabase
   - Then Supabase client is initialized with environment variables
   - And environment variables are stored in `.env` file (gitignored)
   - And `lib/supabase.ts` exports a configured Supabase client

3. **AC3: Expo Router Configured**
   - Given the project exists
   - When I set up routing
   - Then Expo Router file-based routing is configured
   - And the `app/` directory structure matches architecture spec
   - And `(auth)` and `(main)` route groups are created

4. **AC4: Design System Tokens**
   - Given the project exists
   - When I define design tokens
   - Then colors are defined per UX spec (Background #0D0D0D, Primary #FF4D00, etc.)
   - And typography scale is defined (Display 32px to Caption 12px)
   - And spacing system is defined (4px base unit: XS 4px to 3XL 64px)
   - And border radius values are defined (8px, 12px, 16px, 9999px)

5. **AC5: Base UI Components**
   - Given design tokens exist
   - When I create base components
   - Then Button component is created (Primary, Secondary, Ghost variants)
   - And Card component is created with proper styling
   - And Avatar component is created (5 sizes: XS 24px to XL 96px)
   - And Input component is created with focus states

6. **AC6: Zustand Store**
   - Given the project exists
   - When I set up global state
   - Then Zustand store is configured in `stores/app.ts`
   - And AppStore interface matches architecture spec
   - And store exports user, session, currentGroup state and actions

7. **AC7: React Query Configured**
   - Given the project exists
   - When I configure server state
   - Then React Query (TanStack Query) 5.x is installed and configured
   - And QueryClient is set up with proper defaults (1 min stale, 5 min cache)
   - And QueryClientProvider wraps the app

## Tasks / Subtasks

- [x] **Task 1: Initialize Expo Project** (AC: 1)
  - [x] Run `npx create-expo-app@latest cooked --template blank-typescript`
  - [x] Verify TypeScript strict mode in `tsconfig.json`
  - [x] Install Expo Router: `npx expo install expo-router expo-linking expo-constants expo-status-bar`
  - [x] Configure `app.json` with scheme, deep linking, and Expo Router

- [x] **Task 2: Set Up Project Structure** (AC: 3)
  - [x] Create directory structure per architecture spec:
    ```
    src/
    ├── app/                    # Expo Router
    │   ├── (auth)/            # Auth screens
    │   ├── (main)/            # Main app
    │   │   └── _layout.tsx    # Tab navigation
    │   └── _layout.tsx        # Root layout
    ├── components/
    │   └── ui/                # Design system
    ├── hooks/
    ├── lib/
    ├── stores/
    ├── types/
    └── utils/
    ```
  - [x] Configure path aliases in `tsconfig.json` (`@/` for src)

- [x] **Task 3: Supabase Integration** (AC: 2)
  - [x] Install: `npx expo install @supabase/supabase-js @react-native-async-storage/async-storage`
  - [x] Create `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - [x] Create `lib/supabase.ts`:
    ```typescript
    import { createClient } from '@supabase/supabase-js';
    import AsyncStorage from '@react-native-async-storage/async-storage';

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    ```
  - [x] Add `.env` to `.gitignore`
  - [x] Create `.env.example` with placeholder values

- [x] **Task 4: Design System Tokens** (AC: 4)
  - [x] Create `lib/theme.ts` with design tokens:
    ```typescript
    export const colors = {
      background: '#0D0D0D',
      surface: '#1A1A1A',
      surfaceElevated: '#262626',
      primary: '#FF4D00',
      secondary: '#FF8A00',
      success: '#00D26A',
      danger: '#FF3B3B',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0A0A0',
      textMuted: '#666666',
    };

    export const typography = {
      display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
      h1: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
      h2: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
      h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
      body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
      bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
      caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    };

    export const spacing = {
      xs: 4,
      s: 8,
      m: 16,
      l: 24,
      xl: 32,
      xxl: 48,
      xxxl: 64,
    };

    export const borderRadius = {
      small: 8,
      medium: 12,
      large: 16,
      full: 9999,
    };
    ```

- [x] **Task 5: Create Button Component** (AC: 5)
  - [x] Using Gluestack UI Button with variants (Primary, Secondary, Ghost via styling)
  - [x] Supports `size` prop (sm, md, lg) via Gluestack
  - [x] Supports `disabled` state via Gluestack
  - [x] expo-haptics installed for haptic feedback

- [x] **Task 6: Create Card Component** (AC: 5)
  - [x] Using Gluestack UI Card component
  - [x] Styled via NativeWind/Tailwind classes with design tokens

- [x] **Task 7: Create Avatar Component** (AC: 5)
  - [x] Using Gluestack UI Avatar with AvatarImage, AvatarFallbackText, AvatarBadge
  - [x] Supports sizes via Gluestack props
  - [x] Supports image URL and initials fallback

- [x] **Task 8: Create Input Component** (AC: 5)
  - [x] Using Gluestack UI Input with InputField, InputIcon, InputSlot
  - [x] Styled via NativeWind classes with design tokens

- [x] **Task 9: Set Up Zustand Store** (AC: 6)
  - [x] Install: `npm install zustand`
  - [x] Create `stores/app.ts`:
    ```typescript
    import { create } from 'zustand';
    import { User, Session } from '@supabase/supabase-js';

    interface AppStore {
      user: User | null;
      session: Session | null;
      currentGroup: Group | null;
      isCheckingIn: boolean;
      activeRoastThread: string | null;
      setUser: (user: User | null) => void;
      setSession: (session: Session | null) => void;
      setCurrentGroup: (group: Group | null) => void;
    }

    export const useAppStore = create<AppStore>((set) => ({
      user: null,
      session: null,
      currentGroup: null,
      isCheckingIn: false,
      activeRoastThread: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setCurrentGroup: (group) => set({ currentGroup: group }),
    }));
    ```

- [x] **Task 10: Set Up React Query** (AC: 7)
  - [x] Install: `npm install @tanstack/react-query`
  - [x] Create `lib/queryClient.ts`:
    ```typescript
    import { QueryClient } from '@tanstack/react-query';

    export const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60, // 1 minute
          gcTime: 1000 * 60 * 5, // 5 minutes (was cacheTime)
          refetchOnWindowFocus: true,
          retry: 2,
        },
      },
    });
    ```
  - [x] Wrap app with `QueryClientProvider` in root layout

- [x] **Task 11: Create Root Layout** (AC: 3, 7)
  - [x] Create `app/_layout.tsx` with providers:
    ```typescript
    import { QueryClientProvider } from '@tanstack/react-query';
    import { queryClient } from '@/lib/queryClient';
    import { Stack } from 'expo-router';

    export default function RootLayout() {
      return (
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      );
    }
    ```

- [x] **Task 12: Create Index Component Export** (AC: 5)
  - [x] Create `components/ui/index.ts` re-exporting Gluestack UI components:
    - Button, ButtonText, ButtonIcon, ButtonSpinner, ButtonGroup
    - Input, InputField, InputIcon, InputSlot
    - Avatar, AvatarBadge, AvatarFallbackText, AvatarImage
    - Card, Text, Heading, Box, HStack, VStack, Center, Pressable
    - Icon, Spinner, Toast, Modal, Badge

## Dev Notes

### Architecture Requirements (MUST FOLLOW)

**Tech Stack Versions:**
- Expo SDK: 50+ (latest stable)
- React Native: 0.73+ (via Expo)
- TypeScript: 5.0+ with strict mode
- Supabase JS: 2.x
- React Query: 5.x (TanStack Query)
- Zustand: 4.x

**Project Structure:**
Follow the architecture spec exactly. The `app/` directory uses Expo Router's file-based routing. Route groups `(auth)` and `(main)` separate authenticated and unauthenticated flows.

**State Management Pattern:**
- Zustand for global UI state (user, session, current group)
- React Query for server state (all data fetching)
- Never mix concerns - Zustand doesn't fetch data, React Query doesn't store UI state

### Design System Requirements (MUST FOLLOW)

**Colors (from UX spec):**
```
Background:      #0D0D0D (rich black)
Surface:         #1A1A1A (cards)
Surface Elevated: #262626 (modals)
Primary:         #FF4D00 (CTAs)
Secondary:       #FF8A00 (secondary)
Success:         #00D26A (check-ins)
Danger:          #FF3B3B (folds)
```

**Typography:**
- Font: Inter (or system default SF Pro/Roboto)
- Scale: Display (32px) → Caption (12px)
- Use proper line heights per spec

**Spacing:**
- Base unit: 4px
- Named values: xs(4) s(8) m(16) l(24) xl(32) xxl(48) xxxl(64)

**Touch Targets:**
- Minimum 44x44pt for all interactive elements
- This is an accessibility requirement (NFR-USE-001)

### Testing Approach

- Verify Expo project runs: `npx expo start`
- Verify TypeScript compiles without errors
- Verify Supabase client initializes (check console for connection)
- Verify each UI component renders correctly
- Verify Zustand store actions work
- Verify React Query provider wraps app

### Project Structure Notes

**Alignment with architecture spec:**
- All paths follow the defined structure in Section 3.1
- Components use `@/` path alias
- UI components in `components/ui/`
- No deviation from specified folder structure

### References

- [Source: planning-artifacts/architecture.md#3.1] - Project structure
- [Source: planning-artifacts/architecture.md#3.2] - State management
- [Source: planning-artifacts/ux-design.md#2.1] - Color palette
- [Source: planning-artifacts/ux-design.md#2.2] - Typography
- [Source: planning-artifacts/ux-design.md#2.3] - Spacing
- [Source: planning-artifacts/ux-design.md#3] - Component library

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check passed with no errors
- create-expo-app created in temp directory due to existing files, then copied over
- Tailwind v4 incompatible with NativeWind - downgraded to Tailwind v3
- babel-plugin-module-resolver required --legacy-peer-deps flag

### Completion Notes List

**Key Implementation Decisions:**

1. **UI Component Library**: Used Gluestack UI v3 + NativeWind v4 instead of building custom components from scratch. This follows the "don't reinvent the wheel" principle and provides:
   - Accessible, production-ready components
   - Optimized for Expo SDK 54
   - Headless architecture allowing full styling control via NativeWind

2. **Styling System**: NativeWind v4 with Tailwind CSS v3 configured with Cooked design tokens in `tailwind.config.js`. Design tokens available via both Tailwind classes and `lib/theme.ts` for JS usage.

3. **Tech Stack Versions**:
   - Expo SDK 54 (newer than spec minimum of 50+)
   - React Native 0.81.5
   - TypeScript 5.9.3
   - TanStack React Query 5.x
   - Zustand 5.x

4. **Component Re-exports**: Instead of custom components, `components/ui/index.ts` re-exports Gluestack UI components for consistent imports across the app.

5. **Root Layout Providers**: QueryClientProvider > GluestackUIProvider > Stack (proper nesting order)

### File List

**Created Files:**
- `src/app/_layout.tsx` - Root layout with providers
- `src/app/(auth)/_layout.tsx` - Auth group layout
- `src/app/(auth)/index.tsx` - Auth landing screen with haptic feedback
- `src/app/(main)/_layout.tsx` - Main group layout
- `src/lib/supabase.ts` - Supabase client with AsyncStorage
- `src/lib/theme.ts` - Design system tokens for JS/TS
- `src/lib/queryClient.ts` - TanStack Query client config
- `src/stores/app.ts` - Zustand global state store
- `src/components/ui/index.ts` - Gluestack UI re-exports
- `src/hooks/index.ts` - Hooks barrel export (placeholder)
- `src/types/index.ts` - TypeScript type definitions
- `src/utils/index.ts` - Utilities barrel export
- `src/utils/haptics.ts` - Haptic feedback utilities
- `src/global.css` - Tailwind directives
- `tailwind.config.js` - Tailwind with Cooked design tokens
- `metro.config.js` - Metro bundler with NativeWind
- `babel.config.js` - Babel with NativeWind preset & module-resolver
- `nativewind-env.d.ts` - TypeScript declarations for NativeWind
- `.env` - Environment variables (gitignored)
- `.env.example` - Environment variable template

**Modified Files:**
- `package.json` - Updated name, main entry, added dependencies
- `tsconfig.json` - Added path aliases and strict mode
- `app.json` - Configured Expo Router, scheme, dark mode
- `.gitignore` - Added .env

## Related Documents

- [[Architecture]] - Technical architecture decisions
- [[UX Design]] - Design system requirements
- [[Epics]] - All epics and stories
