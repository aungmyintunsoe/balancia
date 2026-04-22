# Phase 3: The Execution Layer (No-AI Workflow)

## 🎯 Objective
Build the Employee's task interface, the Team Roster, and the Manager's manual controls. Most importantly, implement the "SOS" friction trigger so the app is ready for the AI Re-evaluation later.

---

## 🗺️ Step-by-Step Implementation

### Step 1: The Employee Workstation (`<MyActiveTasks />`)
**Location:** `/app/org/[orgId]/dashboard/page.tsx` (Rendered only for employees).
* **Data Fetching:** Query the `tasks` table where `assigned_to = auth.uid()`.
* **UI Components:** Render a list of `<TaskCard />` components.
* **The 3 Core Buttons:**
    1. `[Start Task]` -> Updates status to `in_progress`.
    2. `[Complete]` -> Updates status to `done`.
    3. `[I'm Stuck (SOS)]` -> **The Secret Weapon.** Opens a small modal asking "What's the issue?" and updates status to `blocked`.

### Step 2: The Server Actions (`/app/actions/taskActions.ts`)
**Logic:** Build the secure mutations to handle the Employee's buttons.
* **`updateTaskStatus(taskId: string, newStatus: string)`:** Standard state change.
* **`reportFriction(taskId: string, complaintText: string)`:** * Updates task status to `blocked`.
    * (Optional but recommended): Save the `complaintText` into a new column in the `tasks` table called `blocker_reason`.

### Step 3: The Manager's Manual Assignment
**Location:** Rendered on the Manager's view of the dashboard.
* **UI Component:** On any existing task card, add a `<SelectAssignee />` dropdown.
* **Data Fetching:** Fetch all users from `organization_members` for this `orgId` to populate the dropdown.
* **Server Action:** `assignTask(taskId: string, userId: string)`.

### Step 4: The Team Roster Sidebar (`<TeamSidebar />`)
**Location:** `layout.tsx` for the `/org/[orgId]` routes so it shows everywhere.
* **Data Fetching:** Query `organization_members` joined with `profiles` to get Names and Roles.
* **UI:** A simple vertical list of avatars/names. This proves the multi-tenant workspace is working.

### Step 5: The Manager's Friction Board (The Setup for AI)
**Location:** Manager's Dashboard.
* **UI:** A red banner or a specific column that only appears if a task has the status `blocked`. 
* **Functionality:** For now, the Manager just sees the Employee's complaint text and can manually reassign the task. (Later, this exact spot is where the AI will pop up and say "Pivot Recommended").