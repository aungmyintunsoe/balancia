# Phase 4: UI & Vertical Slice Integration (Master Spec)

## 🤖 SYSTEM DIRECTIVES FOR AI ASSISTANT (READ FIRST)
You are acting as a Senior Frontend Developer assisting with a Next.js 15 App Router codebase. Before generating any code for the slices below, you MUST adhere to these rules:
1. **Audit Existing Code:** Before modifying any route (e.g., `/app/page.tsx`, `middleware.ts`, `/app/auth`), you must ask to review the current file contents to understand the existing logic and styling. Do not blindly overwrite my work.
2. **Audit Database Schema:** Always reference the existing Supabase tables (`profiles`, `organizations`, `organization_members`, `projects`, `structured_goals`, `tasks`). Do not invent columns that do not exist.
3. **The "Vertical Slice" Rule:** We will build this one slice at a time. When building a slice, write the UI component (Tailwind/Shadcn) AND its required Supabase Server Action simultaneously. 
4. **No Mock Data:** Do not use `useState` or hardcoded arrays to fake data fetching. Use Next.js Server Components to fetch real data from Supabase.

---

## 🎯 The High-Level Overview
This phase transforms the raw data layer into an interactive, polished SaaS UI based on Figma designs. 
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS + Shadcn UI components.
* **Aesthetic:** Clean, high-contrast SaaS look. Subtle borders, clear typographic hierarchy.
* **Icons:** Lucide React.
* **Database:** Supabase (Server Components for reading, Server Actions for writing).

---

## 🗺️ The Implementation Roadmap (Slice by Slice)

### Slice 1: The Gateway & Hub (Refining the Entry Point)
**Goal:** Clean up the entry points, keeping text neutral and workflows simple.
* **Hero (Page 1):** Keep it clean. Skip complex mascot graphics for now; use a simple gradient text treatment or abstract SVG.
* **Auth (Page 2):** Ensure the copy is neutral: "Sign in to your workspace."
* **The Hub (Bridge):** Build a simple split-screen or dual-card layout at `/workspaces`. 
    * Left Card: "Create Organization" (inputs name, generates code). 
    * Right Card: "Join Organization" (inputs 6-digit code).

### Slice 2: The Global Workspace Shell (Merging Pages 6 & 9)
**Goal:** Create the persistent navigation (`layout.tsx`) and simplify the Team/Org management into a single sidebar.
* **Target:** `/app/org/[orgId]/layout.tsx`
* **Cut vs. Merge:** Skip complex "Add Employee via Email" UI. Merge the Org settings and Employee roster into this sidebar.
* **UI Components:**
    * **Nav Links:** Command Center, My Tasks.
    * **Team Snapshot (Bottom Sidebar):** A mapped list of `organization_members`. Display small Shadcn `Avatar` components with the user's name and role.
    * **Org Join Code:** A highly visible `Badge` at the top of the sidebar displaying the 6-character code with a "click to copy" Lucide icon.

### Slice 3: The Command Center (Merging Pages 4, 5, 8)
**Goal:** Build the Manager's God-View. This merges Analytics, Goals, and Dashboard into one screen.
* **Target:** `/app/org/[orgId]/dashboard/page.tsx`
* **Cut vs. Merge:** Cut standalone analytics (faking charts takes too long). Cut drag-and-drop file uploads for goals.
* **UI Components:**
    * **KPI Header:** 3 simple Shadcn `Card` components showing basic stats.
    * **The AI Architect Prompt:** A massive, prominent `<Textarea>` centered on the screen. Placeholder: *"E.g., Build a TikTok clone by Friday."* Includes a glowing submit button. (Connect this to our existing `generateProject` server action).
    * **Active Projects Grid:** A CSS Grid layout mapping over the `projects` table. Each project is a Shadcn `Card` showing `vague_goal_text` and status.

### Slice 4: The Friction Board (The "Wow" Feature)
**Goal:** A highly visible alert system for Managers to see when employees hit the "SOS" button.
* **Target:** Rendered at the very top of the Command Center (Slice 3).
* **Data Fetching:** `SELECT * FROM tasks WHERE status = 'blocked' AND org_id = orgId`.
* **UI Component:** * A full-width `Alert` banner (using Shadcn `Alert` with a `destructive` variant).
    * Displays the assigned user, the task description, and the `blocker_reason`.
    * Contains a distinct `[Resolve Friction]` button.

### Slice 5: The Employee Execution Board (Page 7)
**Goal:** Build the "My Tasks" view where employees execute work and trigger the SOS.
* **Target:** `/app/org/[orgId]/tasks/page.tsx`
* **Data Fetching:** `SELECT * FROM tasks WHERE assigned_to = auth.uid()`.
* **UI Component:** A clean data table or Kanban-style card list.
    * Each Task Card shows `description`, `estimated_hours`.
* **The 3 Core Interaction Buttons (Connected to Server Actions):**
    1. **`[Start Task]`**: Primary button. Updates status to `in_progress`.
    2. **`[Mark Complete]`**: Success button. Updates status to `done`.
    3. **`[I'm Stuck (SOS)]`**: Destructive button. Opens a Shadcn `Dialog` asking "What's the issue?". Submitting this modal writes to the `blocker_reason` column and changes status to `blocked`.