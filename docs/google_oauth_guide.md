# Google OAuth Integration Guide for Supabase & CredChain

This document details the exact steps to configure Google OAuth login through Supabase Auth for CredChain.

---

## Architecture Overview

```
React Frontend (Vite)
       │
       ▼  supabase.auth.signInWithOAuth({ provider: 'google' })
Supabase Auth Service
       │
       ▼  Redirects user to Google Consent Screen
Google Accounts (OAuth 2.0)
       │
       ▼  Authorized callback to Supabase
https://<your-project-ref>.supabase.co/auth/v1/callback
       │
       ▼  Issues Supabase JWT session
React App Session & Profile
```

---

## Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project or create a new project named `CredChain-SIH2026`.
3. Go to **APIs & Services ➔ OAuth consent screen**:
   * User Type: **External**
   * App Name: `CredChain`
   * User Support Email: Your email
   * Developer Contact Information: Your email
   * Click **Save and Continue**.
4. In **Scopes**, ensure the standard email and profile scopes are enabled:
   * `.../auth/userinfo.email`
   * `.../auth/userinfo.profile`
   * `openid`
5. Go to **APIs & Services ➔ Credentials**:
   * Click **+ CREATE CREDENTIALS ➔ OAuth client ID**.
   * Application type: **Web application**.
   * Name: `CredChain Web Client`.
   * Under **Authorized redirect URIs**, add your Supabase callback URL:
     ```plaintext
     https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     *(You can find this in your Supabase Dashboard ➔ Authentication ➔ Providers ➔ Google).*
   * Click **Create**.
6. Copy your **Client ID** and **Client Secret**.

---

## Step 2: Configure Google Provider in Supabase Dashboard

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication ➔ Providers ➔ Google**.
3. Toggle **Enable Google provider** to `ON`.
4. Paste the credentials obtained from Google Cloud Console:
   * **Client ID**: Paste your Google Client ID.
   * **Client Secret**: Paste your Google Client Secret.
5. Click **Save**.

---

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication ➔ URL Configuration**:
2. Set **Site URL** to:
   ```plaintext
   http://localhost:5173
   ```
3. Under **Redirect URLs**, add:
   ```plaintext
   http://localhost:5173
   http://localhost:5173/**
   http://localhost:5000/**
   ```
4. Click **Save**.

---

## Step 4: Testing Google Login in CredChain

1. Start the React frontend: `npm run dev:frontend`
2. Navigate to `http://localhost:5173/login`
3. Click **Continue with Google**
4. Authenticate with your Google Account
5. You will be redirected back into CredChain with an active session, role-mapped profile, and JWT token.
