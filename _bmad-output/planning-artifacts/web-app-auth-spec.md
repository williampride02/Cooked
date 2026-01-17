---
title: "Cooked - Web App Authentication Specification"
aliases:
  - "Web Auth Spec"
  - "Dual Authentication"
  - "Account Linking"
tags:
  - cooked
  - planning
  - authentication
  - web-app
  - spec
status: draft
created: 2026-01-16
updated: 2026-01-16
related:
  - "[[Web App Design]]"
  - "[[Architecture]]"
---

# Cooked - Web App Authentication Specification

> [!info] Document Info
> **Version**: 1.0 | **Status**: Draft | **Priority**: Critical

## 1. Overview

This document specifies the dual authentication system for Cooked, allowing users to authenticate with either **email/password** or **phone/SMS**, and link both methods to the same account.

---

## 2. Authentication Methods

### 2.1 Email/Password Authentication

**Use Case**: Primary method for web app, also available on mobile

**Flow:**
1. User enters email + password
2. Supabase validates credentials
3. Session created
4. User profile loaded from `users` table

**Supabase API:**
```typescript
// Signup
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword'
});

// Login
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});

// Password Reset
await supabase.auth.resetPasswordForEmail('user@example.com');
```

### 2.2 Phone/SMS Authentication

**Use Case**: Primary method for mobile app, also available on web

**Flow:**
1. User enters phone number
2. Supabase sends SMS OTP
3. User enters OTP code
4. Supabase verifies OTP
5. Session created
6. User profile loaded from `users` table

**Supabase API:**
```typescript
// Request OTP
await supabase.auth.signInWithOtp({
  phone: '+15551234567'
});

// Verify OTP
await supabase.auth.verifyOtp({
  phone: '+15551234567',
  token: '123456',
  type: 'sms'
});
```

---

## 3. Account Linking

### 3.1 Concept

**Goal**: One user account, multiple authentication methods

**Supabase Implementation:**
- Supabase Auth supports multiple identities per user
- Each identity (email or phone) can be linked to the same `auth.users.id`
- User can log in with any linked identity
- All identities share the same session and permissions

### 3.2 Linking Phone to Email Account

**Scenario**: User signed up with email, wants to add phone

**Steps:**
1. User logged in with email
2. Navigate to Settings > Link Phone
3. Enter phone number
4. Receive SMS OTP
5. Enter OTP
6. Link phone identity to current user

**Implementation:**
```typescript
async function linkPhoneToAccount(phone: string, otp: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  // 1. Verify OTP (this creates a temporary session)
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });

  if (verifyError) throw verifyError;

  // 2. If OTP verification created a new user, we need to merge
  // Otherwise, link the phone identity to current user
  if (verifyData.user && verifyData.user.id !== user.id) {
    // New user was created - need to merge accounts
    // This is complex - see section 3.4
  } else {
    // Link phone to current user
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
}
```

### 3.3 Linking Email to Phone Account

**Scenario**: User signed up with phone, wants to add email

**Steps:**
1. User logged in with phone
2. Navigate to Settings > Link Email
3. Enter email + password
4. Link email identity to current user

**Implementation:**
```typescript
async function linkEmailToAccount(email: string, password: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  // 1. Create email identity (signup with email)
  // Note: This might create a new user if email doesn't exist
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    // If email already exists, try to link
    if (signUpError.message.includes('already registered')) {
      // User exists - need to link
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'email',
        options: {
          email,
          password
        }
      });
      
      if (linkError) throw linkError;
    } else {
      throw signUpError;
    }
  } else if (signUpData.user && signUpData.user.id !== user.id) {
    // New user was created - need to merge accounts
    // This is complex - see section 3.4
  } else {
    // Email linked successfully
    // Update users table
    await supabase
      .from('users')
      .update({ email })
      .eq('id', user.id);
  }
}
```

### 3.4 Account Merging (Edge Case)

**Problem**: If user tries to link an identity that already belongs to another account

**Solution Options:**

1. **Prevent Linking** (Recommended for MVP):
   - Show error: "This email/phone is already associated with another account"
   - User must log in to that account first, then link from there

2. **Account Merging** (Complex, Post-MVP):
   - Merge two accounts into one
   - Transfer all data (groups, pacts, check-ins) to primary account
   - Delete secondary account
   - Requires careful data migration

**MVP Implementation:**
```typescript
async function linkPhoneToAccount(phone: string, otp: string) {
  // ... verify OTP ...
  
  // Check if phone already belongs to another account
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existingUser && existingUser.id !== currentUser.id) {
    throw new Error('This phone number is already associated with another account. Please log in to that account first.');
  }

  // Proceed with linking...
}
```

---

## 4. Login Flow

### 4.1 Web App Login Page

**UI Design:**
```
┌─────────────────────────────┐
│        Cooked               │
│   Log in to your account    │
├─────────────────────────────┤
│                             │
│  [Email Login Tab] [Phone] │
│                             │
│  Email: [____________]      │
│  Password: [_________]       │
│                             │
│  [Log In]                   │
│                             │
│  ─────── OR ───────         │
│                             │
│  Phone: [+1][________]       │
│                             │
│  [Send Code]                │
│                             │
└─────────────────────────────┘
```

**Implementation:**
```typescript
// apps/web/src/app/login/page.tsx
'use client';

export default function LoginPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  
  return (
    <div>
      <Tabs value={method} onChange={setMethod}>
        <Tab value="email">Email</Tab>
        <Tab value="phone">Phone</Tab>
      </Tabs>
      
      {method === 'email' ? (
        <EmailLoginForm />
      ) : (
        <PhoneLoginForm />
      )}
    </div>
  );
}
```

### 4.2 Email Login

```typescript
async function handleEmailLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // Handle error (wrong password, user not found, etc.)
    return;
  }

  // Success - redirect to dashboard
  router.push('/dashboard');
}
```

### 4.3 Phone Login

```typescript
async function handlePhoneLogin(phone: string) {
  // Step 1: Request OTP
  const { error: otpError } = await supabase.auth.signInWithOtp({
    phone
  });

  if (otpError) throw otpError;

  // Step 2: Show OTP input form
  setShowOtpInput(true);
}

async function handleOtpVerify(phone: string, otp: string) {
  // Step 3: Verify OTP
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });

  if (error) throw error;

  // Success - redirect to dashboard
  router.push('/dashboard');
}
```

---

## 5. User Profile Management

### 5.1 Users Table Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one auth method exists
  CONSTRAINT has_auth_method CHECK (email IS NOT NULL OR phone IS NOT NULL),
  
  -- Ensure email uniqueness if set
  CONSTRAINT email_unique UNIQUE (email) WHERE email IS NOT NULL,
  
  -- Ensure phone uniqueness if set
  CONSTRAINT phone_unique UNIQUE (phone) WHERE phone IS NOT NULL
);
```

### 5.2 Profile Sync

**On Signup:**
```typescript
// Email signup
const { data: authData } = await supabase.auth.signUp({
  email,
  password
});

await supabase.from('users').insert({
  id: authData.user.id,
  email: authData.user.email,
  phone: null,
  display_name: name
});

// Phone signup
const { data: authData } = await supabase.auth.verifyOtp({
  phone,
  token: otp,
  type: 'sms'
});

await supabase.from('users').insert({
  id: authData.user.id,
  email: null,
  phone: authData.user.phone,
  display_name: name
});
```

**On Account Linking:**
```typescript
// After linking phone
await supabase
  .from('users')
  .update({ phone: linkedPhone })
  .eq('id', user.id);

// After linking email
await supabase
  .from('users')
  .update({ email: linkedEmail })
  .eq('id', user.id);
```

---

## 6. Settings UI

### 6.1 Account Linking Settings

**UI Design:**
```
┌─────────────────────────────┐
│  Account & Security         │
├─────────────────────────────┤
│                             │
│  Linked Accounts:           │
│                             │
│  ✓ Email: user@example.com  │
│  ✗ Phone: Not linked        │
│    [Link Phone Number]      │
│                             │
│  OR                         │
│                             │
│  ✓ Phone: +1 555-123-4567   │
│  ✗ Email: Not linked        │
│    [Link Email Address]     │
│                             │
└─────────────────────────────┘
```

**Implementation:**
```typescript
// apps/web/src/app/settings/page.tsx
export default function SettingsPage() {
  const { user, profile } = useAuth();
  
  return (
    <div>
      <h2>Account & Security</h2>
      
      <div>
        <h3>Linked Accounts</h3>
        
        {profile?.email ? (
          <div>
            <span>✓ Email: {profile.email}</span>
          </div>
        ) : (
          <div>
            <span>✗ Email: Not linked</span>
            <LinkAccountForm type="email" />
          </div>
        )}
        
        {profile?.phone ? (
          <div>
            <span>✓ Phone: {profile.phone}</span>
          </div>
        ) : (
          <div>
            <span>✗ Phone: Not linked</span>
            <LinkAccountForm type="phone" />
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 7. Testing Checklist

### 7.1 Authentication Tests

- [ ] Email signup creates account
- [ ] Phone signup creates account
- [ ] Email login works
- [ ] Phone login works
- [ ] Password reset works
- [ ] OTP resend works
- [ ] Invalid credentials show error
- [ ] Expired OTP shows error

### 7.2 Account Linking Tests

- [ ] Link phone to email account
- [ ] Link email to phone account
- [ ] Prevent linking duplicate phone
- [ ] Prevent linking duplicate email
- [ ] Login with linked phone after email signup
- [ ] Login with linked email after phone signup
- [ ] Unlink account (if implemented)

### 7.3 Cross-Platform Tests

- [ ] Sign up on web with email, log in on mobile with phone (after linking)
- [ ] Sign up on mobile with phone, log in on web with email (after linking)
- [ ] Session persists across platforms
- [ ] Profile data syncs correctly

---

## 8. Implementation Priority

### Phase 1: Basic Auth (Week 1)
1. Email/password login
2. Email/password signup
3. Phone/OTP login (basic)
4. User profile display

### Phase 2: Account Linking (Week 2)
1. Link phone to email account
2. Link email to phone account
3. Settings UI for account management
4. Error handling for duplicate accounts

### Phase 3: Polish (Week 3)
1. Password reset flow
2. OTP resend functionality
3. Account unlinking (optional)
4. Comprehensive error messages

---

## Related Documents

- [[Web App Design]] - Overall web app architecture
- [[Architecture]] - System architecture
- [[PRD]] - Product requirements
