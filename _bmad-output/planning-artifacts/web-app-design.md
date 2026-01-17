---
title: "Cooked - Web App Design & Architecture"
aliases:
  - "Web App"
  - "Web Application"
  - "Web Platform"
tags:
  - cooked
  - planning
  - web-app
  - architecture
  - authentication
status: draft
created: 2026-01-16
updated: 2026-01-16
related:
  - "[[Architecture]]"
  - "[[PRD]]"
  - "[[Epics]]"
---

# Cooked - Web App Design & Architecture

> [!info] Document Info
> **Version**: 1.0 | **Status**: Draft | **Priority**: High (Backend Testing)

## 1. Executive Summary

The Cooked web application serves two critical purposes:

1. **Backend Testing Platform**: Provides a straightforward environment to test Supabase backend functionality, Edge Functions, and database operations before deploying to mobile (avoiding Apple Developer costs during development)

2. **Cross-Platform Access**: Enables users to access Cooked from desktop/laptop browsers, complementing the mobile-first experience

**Key Requirement**: Users must be able to authenticate with **either email OR phone number**, and link both methods to the same account for seamless cross-platform access.

---

## 2. Purpose & Scope

### 2.1 Primary Goals

**Development Phase:**
- Test backend functionality without mobile app deployment
- Validate Edge Functions, database queries, and real-time subscriptions
- Debug authentication flows
- Test authentication linking (email ↔ phone)

**Production Phase:**
- Provide web access for users who prefer desktop
- Enable account management from web
- Support cross-platform user experience

### 2.2 Scope

**In Scope:**
- Dual authentication (email/password + phone/SMS)
- Account linking (connect email to phone account, vice versa)
- Core app features (groups, pacts, check-ins, feed)
- Real-time updates via Supabase Realtime
- Responsive design (mobile-friendly web)

**Out of Scope (MVP):**
- Full feature parity with mobile app
- Progressive Web App (PWA) installation
- Offline support
- Push notifications (web doesn't support native push)

---

## 3. Authentication Architecture

### 3.1 Dual Authentication System

Cooked supports **two independent authentication methods** that can be linked:

1. **Email/Password Authentication**
   - Traditional email + password signup/login
   - Password reset via email
   - Primary method for web app

2. **Phone/SMS Authentication**
   - Phone number + OTP verification
   - SMS code delivery
   - Primary method for mobile app

### 3.2 Account Linking Strategy

**Goal**: Allow users to log in with either method and access the same account.

**Implementation Approach:**

```
User Account (Supabase Auth)
├── Primary Identity: auth.users.id (UUID)
├── Email Identity: auth.users.email (if email auth used)
├── Phone Identity: auth.users.phone (if phone auth used)
└── Profile: users table (id, email, phone, display_name, avatar_url)
```

**Linking Flow:**

1. **User signs up with email** → Creates auth.users record with email
2. **User signs up with phone** → Creates auth.users record with phone
3. **User wants to link** → Add phone to existing email account (or vice versa)

**Supabase Account Linking:**
- Supabase Auth supports multiple identities per user
- Use `supabase.auth.linkIdentity()` to link phone to email account
- Use `supabase.auth.unlinkIdentity()` to remove a linked identity
- Both identities share the same `auth.users.id`

### 3.3 Authentication Flows

#### Flow 1: Email Signup (Web)
```
1. User enters email + password on /signup
2. Supabase creates auth.users record with email
3. Create users table record with id, email, phone=null
4. User can later link phone number
```

#### Flow 2: Phone Signup (Mobile)
```
1. User enters phone number on mobile app
2. Supabase sends SMS OTP
3. User verifies OTP
4. Supabase creates auth.users record with phone
5. Create users table record with id, phone, email=null
6. User can later link email address
```

#### Flow 3: Linking Phone to Email Account
```
1. User logged in with email (web)
2. Navigate to Settings > Link Phone
3. Enter phone number
4. Receive SMS OTP
5. Verify OTP
6. Call supabase.auth.linkIdentity() to link phone
7. Update users.phone in database
```

#### Flow 4: Linking Email to Phone Account
```
1. User logged in with phone (mobile)
2. Navigate to Settings > Link Email
3. Enter email + password
4. Call supabase.auth.linkIdentity() to link email
5. Update users.email in database
```

#### Flow 5: Login with Either Method
```
User can log in with:
- Email + password (web or mobile)
- Phone + OTP (mobile or web)

Both methods resolve to same auth.users.id
```

### 3.4 Database Schema

**users table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,  -- Can be null if phone-only account
  phone TEXT,  -- Can be null if email-only account
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one auth method
  CONSTRAINT has_auth_method CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
```

**Account States:**
- Email-only: `email` set, `phone` null
- Phone-only: `phone` set, `email` null
- Dual-auth: Both `email` and `phone` set

---

## 4. Web App Features

### 4.1 Core Features (MVP)

**Authentication:**
- Email/password signup
- Email/password login
- Phone/OTP login (for users who signed up on mobile)
- Account linking (add phone to email account, add email to phone account)
- Password reset
- Logout

**Dashboard:**
- User profile display
- Linked accounts display (email, phone)
- Account linking UI
- Logout

**Groups:**
- View groups user is member of
- Group feed (real-time)
- Group details

**Pacts:**
- View active pacts
- Create new pacts
- Check-in interface (success/fold)
- Pact statistics

**Feed:**
- Real-time activity feed
- Reactions
- Roast thread viewing

**Settings:**
- Profile editing
- Account linking management
- Notification preferences

### 4.2 Technical Implementation

**Tech Stack:**
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS (shared design system)
- **Auth**: Supabase SSR (`@supabase/ssr`)
- **State**: React Query for server state
- **Real-time**: Supabase Realtime subscriptions
- **Types**: Shared from `@cooked/shared` package

**File Structure:**
```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Email login + phone login option
│   │   ├── signup/
│   │   │   └── page.tsx          # Email signup
│   │   ├── phone-login/
│   │   │   └── page.tsx          # Phone/OTP login
│   │   └── verify-phone/
│   │       └── page.tsx          # OTP verification
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard
│   │   ├── groups/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Group view
│   │   ├── pacts/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Pact view
│   │   └── settings/
│   │       └── page.tsx          # Settings + account linking
│   └── layout.tsx
├── components/
│   ├── auth/
│   │   ├── EmailLoginForm.tsx
│   │   ├── PhoneLoginForm.tsx
│   │   └── LinkAccountForm.tsx
│   └── ui/                       # Shared UI components
├── hooks/
│   ├── useAuth.ts
│   ├── useAccountLinking.ts
│   └── useRealtime.ts
└── lib/
    └── supabase.ts               # Supabase SSR client
```

---

## 5. Account Linking Implementation

### 5.1 Linking Phone to Email Account

**User Journey:**
1. User logged in with email on web
2. Navigate to Settings > Security > Link Phone Number
3. Enter phone number
4. Receive SMS OTP
5. Enter OTP code
6. Phone linked to account

**Implementation:**
```typescript
// In Settings page
async function linkPhone(phone: string, otp: string) {
  // 1. Verify OTP with phone
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });

  if (verifyError) throw verifyError;

  // 2. Link phone identity to current user
  const { error: linkError } = await supabase.auth.linkIdentity({
    provider: 'phone',
    options: {
      phone
    }
  });

  if (linkError) throw linkError;

  // 3. Update users table
  await supabase
    .from('users')
    .update({ phone })
    .eq('id', user.id);
}
```

### 5.2 Linking Email to Phone Account

**User Journey:**
1. User logged in with phone on mobile
2. Navigate to Settings > Security > Link Email
3. Enter email + password
4. Email linked to account

**Implementation:**
```typescript
// In Settings page (mobile or web)
async function linkEmail(email: string, password: string) {
  // 1. Create email identity
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // Link to existing account
        phone: currentUser.phone
      }
    }
  });

  // 2. Link email identity to current phone user
  const { error: linkError } = await supabase.auth.linkIdentity({
    provider: 'email',
    options: {
      email,
      password
    }
  });

  if (linkError) throw linkError;

  // 3. Update users table
  await supabase
    .from('users')
    .update({ email })
    .eq('id', user.id);
}
```

### 5.3 Login with Either Method

**Web App Login Flow:**
```typescript
// Login page offers both options
function LoginPage() {
  return (
    <div>
      <EmailLoginForm />
      <Divider>OR</Divider>
      <PhoneLoginForm />
    </div>
  );
}

// Email login
async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  // If user has linked phone, both identities available
}

// Phone login
async function loginWithPhone(phone: string) {
  // Request OTP
  await supabase.auth.signInWithOtp({ phone });
  // Then verify OTP
  await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
  // If user has linked email, both identities available
}
```

---

## 6. Testing Strategy

### 6.1 Backend Testing Goals

**Primary Use Cases:**
1. Test Edge Functions without mobile deployment
2. Validate database queries and RLS policies
3. Test real-time subscriptions
4. Verify authentication flows
5. Test account linking functionality

**Testing Workflow:**
```
1. Develop feature in web app
2. Test backend functionality
3. Verify database operations
4. Test Edge Functions
5. Once validated, implement in mobile app
```

### 6.2 Test Scenarios

**Authentication Tests:**
- [ ] Email signup creates user record
- [ ] Phone signup creates user record
- [ ] Email login works
- [ ] Phone login works
- [ ] Linking phone to email account
- [ ] Linking email to phone account
- [ ] Login with either method after linking
- [ ] Password reset flow

**Backend Tests:**
- [ ] Create group via web app
- [ ] Create pact via web app
- [ ] Check-in via web app
- [ ] Real-time feed updates
- [ ] Edge Function triggers
- [ ] Database RLS policies

---

## 7. Design System

### 7.1 Shared Design Tokens

Web app uses same design system as mobile:
- Colors: Primary (#FF4D00), Background (#0F0F0F), Surface (#1A1A1A)
- Typography: Inter font family
- Spacing: 4px base unit
- Components: Shared from `@cooked/shared` where possible

### 7.2 Responsive Design

- Desktop-first design (primary use case)
- Mobile-responsive (works on tablets/phones)
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 8. Implementation Priority

### Phase 1: Authentication (Critical)
1. Email/password login
2. Phone/OTP login
3. Account linking UI
4. Settings page for account management

### Phase 2: Core Features
1. Dashboard with user profile
2. Groups list and view
3. Pacts list and view
4. Basic check-in interface

### Phase 3: Full Feature Parity
1. Real-time feed
2. Roast threads
3. Weekly recaps
4. All mobile features

---

## 9. Technical Considerations

### 9.1 Supabase Configuration

**Enable Both Auth Methods:**
```toml
[auth.email]
enable_signup = true
enable_confirmations = false

[auth.sms]
enable_signup = true
enable_confirmations = false
```

**Account Linking:**
- Enable `enable_manual_linking = true` in Supabase config
- Allows programmatic account linking

### 9.2 Security

- RLS policies apply to web app same as mobile
- Session tokens work across platforms
- HTTPS only (enforced by Supabase)
- CSRF protection via Supabase SSR

### 9.3 Performance

- Server-side rendering for initial load
- Client-side navigation for SPA feel
- Real-time subscriptions for live updates
- Optimistic UI updates

---

## 10. Success Criteria

**Development Phase:**
- ✅ Can test all backend functionality via web app
- ✅ Account linking works (email ↔ phone)
- ✅ Users can log in with either method
- ✅ Real-time features work in browser

**Production Phase:**
- ✅ Users can access Cooked from web
- ✅ Seamless cross-platform experience
- ✅ Account works on both mobile and web
- ✅ Feature parity with mobile (or clear limitations documented)

---

## Related Documents

- [[Architecture]] - Overall system architecture
- [[PRD]] - Product requirements
- [[Epics]] - User stories and implementation plan
