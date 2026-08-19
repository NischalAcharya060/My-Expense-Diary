# Supabase + Google OAuth Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign in / Create account
2. Click **"New Project"**
3. Choose a name, set a database password, pick a region
4. Wait ~2 minutes for it to spin up

## Step 2: Get Your Supabase Keys

1. In your project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** → looks like `https://xxxxx.supabase.co`
   - **Anon Public Key** → starts with `eyJ...`

3. Paste them into your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key...
```

## Step 3: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** → Create
   - Fill in App name: `My Expense Diary`
   - Add your email as developer contact
   - Save and continue through the steps
4. Go to **APIs & Services** → **Credentials**
5. Click **"+ Create Credentials"** → **OAuth client ID**
6. Choose **Web application**
7. Set a name like `Expense Diary`
8. Under **Authorized redirect URIs**, add this exact URL:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (Replace `xxxxx` with your actual Supabase project ID)
9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

## Step 4: Add Google Provider in Supabase

1. Back in Supabase dashboard → Go to **Authentication** (left sidebar)
2. Click **Providers** (under Configuration)
3. Find **Google** and click to expand
4. Toggle it **ON**
5. Paste your **Client ID** from Google Cloud
6. Paste your **Client Secret** from Google Cloud
7. Click **Save**

## Step 5: Update Redirect URLs (Important)

In the same Google provider settings in Supabase, set the **Site URL**:

```
http://localhost:3000
```

## Step 6: Run the App

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Click **Notes** or **Settings** in the sidebar (or **Sign in** at the bottom)
3. You'll see the login page → click **Continue with Google**
4. Sign in with your Google account
5. You're redirected back and logged in

## Quick Checklist

| Step | Done? |
|------|-------|
| Supabase project created | ☐ |
| `.env` has URL + Anon Key | ☐ |
| Google Cloud OAuth consent screen | ☐ |
| Google OAuth client created | ☐ |
| Redirect URI = `https://YOUR-PROJECT.supabase.co/auth/v1/callback` | ☐ |
| Supabase → Authentication → Providers → Google → ON | ☐ |
| Client ID + Secret pasted in Supabase | ☐ |

Once all checked, `npm run dev` and the Google login will work.
