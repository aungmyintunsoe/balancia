# Phase 2: The Command Center & Mock AI Engine

## 🎯 Objective
Build the Manager's dashboard where they can input a vague goal, and simulate the AI breaking that goal down into actionable tasks assigned to employees. We are prioritizing data flow and structure; deep UI polish will happen in a later phase.

## 🏗️ Architecture Stack
* **Framework:** Next.js (App Router)
* **Route:** `/app/org/[orgId]/dashboard/page.tsx`
* **State/Mutations:** Next.js Server Actions
* **Database:** Supabase (SQL)

---

## 🗺️ Step-by-Step Implementation Plan

### Step 1: The AI Target Schema (Database) which i finished already

```sql
-- 1. Projects (The Macro Vision)
create table public.projects (
  id uuid not null default extensions.uuid_generate_v4 (),
  org_id uuid null,
  vague_goal_text text not null,
  status character varying(50) null default 'analyzing'::character varying,
  created_at timestamp with time zone null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

-- 2. Structured Goals (The Breakdown)
create table public.structured_goals (
  id uuid not null default extensions.uuid_generate_v4 (),
  project_id uuid null,
  org_id uuid null,
  description text not null,
  constraint structured_goals_pkey primary key (id),
  constraint structured_goals_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint structured_goals_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

-- 3. Tasks (The Micro-Assignments)
create table public.tasks (
  id uuid not null default extensions.uuid_generate_v4 (),
  goal_id uuid null,
  org_id uuid null,
  description text not null,
  estimated_hours numeric(5, 2) null,
  assigned_to uuid null,
  status character varying(50) null default 'pending'::character varying,
  constraint tasks_pkey primary key (id),
  constraint tasks_assigned_to_fkey foreign KEY (assigned_to) references profiles (id) on delete set null,
  constraint tasks_goal_id_fkey foreign KEY (goal_id) references structured_goals (id) on delete CASCADE,
  constraint tasks_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

Step 2: The Dashboard UI (/app/org/[orgId]/dashboard/page.tsx)

Logic: A Server Component that checks the user's role in this specific workspace.

    Query: Fetch the user's role from organization_members where org_id matches the URL and user_id matches the logged-in user.

    If Admin (Manager):

        Render a JoinCodeWidget (shows the org's 6-digit code so others can join).

        Render an AIPromptBox component (A large <textarea> and a submit button).

        Render an ActiveProjectsGrid (Fetches and displays projects for this org).

    If Employee:

        Hide the AIPromptBox and JoinCodeWidget.

        Render a simple "Welcome, waiting for assignments" message (we will build their exact view in Phase 3).

Step 3: The "Mock Brain" Server Action (/app/actions.ts)

Logic: Simulate the AI so we can test the database inserts without an API key.

    Function: generateMockProject(formData: FormData, orgId: string)

    Flow:

        Extract the vagueGoalText from the form.

        Insert into the projects table. Get the new project_id.

        Use await new Promise(res => setTimeout(res, 2000)) to fake a 2-second AI thinking delay.

        Create a hardcoded JSON object simulating an AI response:
        JavaScript

        const mockData = {
          goals: [{
            description: "Build the landing page UI",
            tasks: [
              { description: "Design Figma mockups", hours: 4, assigned_to: null }, // We leave assigned_to null for now until employees join
              { description: "Code Tailwind layout", hours: 6, assigned_to: null }
            ]
          }]
        };

        Loop through mockData and perform inserts into structured_goals and tasks.

        Call revalidatePath('/org/[orgId]/dashboard') to refresh the UI.

Step 4: Loading States

Logic: Use the useFormStatus hook on the submit button inside AIPromptBox. When pending is true, change the button text to "AI Analyzing Team & Generating..." and disable it.