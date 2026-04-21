# Phase 1: The Gateway & Workspace Hub

## 🎯 Objective
Establish the initial user journey. A user must be able to land on the site, authenticate via standard email/password, and route to a "Workspace Hub" where they can either create a new organization (becoming an Admin) or join an existing one (becoming an Employee).

## 🏗️ Architecture Stack
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS
* **Auth & Database:** Supabase (using `@supabase/ssr`)
* **State:** Server Actions & React Server Components (minimize client-side state where possible)

---

## 🗺️ Step-by-Step Implementation Plan

### Step 1: Supabase Environment & Client Setup
**Logic:** Connect the Next.js app to the Supabase backend securely.
* Install `@supabase/supabase-js` and `@supabase/ssr`.
* Set up `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* Create the Supabase utility files (server client, browser client, middleware client) following the official `@supabase/ssr` documentation.

### Step 2: The SQL Foundation (Junction Architecture)
**Logic:** Set up the database tables to support the Workspace model.
* **Tables Needed:**
    1.  `profiles` (links to `auth.users`, stores email/name).
    2.  `organizations` (stores org name, generates a unique 6-character `join_code`).
    3.  `organization_members` (The junction table linking `user_id` to `org_id` with a `role` of either 'admin' or 'employee').

### Step 3: The Hero Page (`/app/page.tsx`)
**UI/UX:** High contrast, brutalist/clean SaaS design.
* **Navbar:** Simple text logo left, `[Login]` button right.
* **Hero Section:** * Headline: "Stop Guessing. Let AI Build and Manage Your Tech Team."
    * Subtext: "The intelligent workspace for hackathons and fast-moving teams."
    * Primary CTA: `[Get Started]` -> routes to `/auth`.

### Step 4: Authentication Page (`/app/auth/page.tsx`)
**UI/UX:** Clean, centered card layout.
* **Form:** Email input, Password input.
* **Toggle:** A simple text toggle between "Sign Up" and "Log In".
* **Action:** Submit button fires a Next.js Server Action to `supabase.auth.signUp()` or `signInWithPassword()`.
* **Routing:** On success, redirect to `/workspaces`.

### Step 5: The Traffic Cop (`/middleware.ts`)
**Logic:** Route protection.
* Check for an active Supabase session.
* If a logged-out user tries to access `/workspaces` or `/org/*`, redirect them to `/auth`.
* If a logged-in user tries to access `/auth` or `/`, redirect them to `/workspaces`.

### Step 6: The Workspace Hub (`/app/workspaces/page.tsx`)
**UI/UX:** Split-screen or dual-card layout.
* **Header:** "Welcome. Let's get to work."
* **Card 1 (Create):** * Input: Organization Name.
    * Button: `[Create Workspace]`.
    * *Action:* Inserts into `organizations`, inserts into `organization_members` as 'admin', redirects to `/org/[org_id]/dashboard`.
* **Card 2 (Join):**
    * Input: 6-digit Join Code.
    * Button: `[Join Team]`.
    * *Action:* Looks up code, inserts into `organization_members` as 'employee', redirects to `/org/[org_id]/dashboard`.