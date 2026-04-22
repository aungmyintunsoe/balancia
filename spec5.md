# Phase 5: Ilmu.ai Integration & "The Brain Transplant"

## 🤖 SYSTEM DIRECTIVES FOR AI ASSISTANT (READ FIRST)
You are acting as a Senior AI/Backend Engineer working on a Next.js 15 (App Router) application. We are replacing our mocked AI data generation with live calls to the `Ilmu.ai` model (a DeepSeek-based, OpenAI API-compatible LLM).
**CRITICAL RULES:**
1. **Context Absorption:** Read the "App Lore & Context" section thoroughly. Do not write generic task management code. You are building an autonomous orchestration engine.
2. **Audit Existing Files:** Before modifying `app/actions/taskActions.ts` or `app/actions/generateProject.ts`, ask me to provide their current contents so you don't overwrite my UI/plumbing.
3. **Strict JSON:** You must aggressively enforce JSON schema output from the LLM. 
4. **Environment:** The API key is in `process.env.ILMU_API_KEY`. The base URL will follow standard OpenAI SDK patterns but point to Ilmu's endpoint (refer to `docs.ilmu.ai`).

---

## 📖 APP LORE & CONTEXT (WHAT THIS APP ACTUALLY DOES)
This is not a standard To-Do app. It is a highly reactive, AI-orchestrated workspace.
* **The Core Loop:** Managers input a vague goal -> AI breaks it down and assigns tasks based on real employee skills -> Employees execute -> If an employee gets stuck, they hit `[SOS]`. 
* **The Friction System (SOS):** When an employee hits SOS, the task status changes to `blocked` and their text input is saved to the `blocker_reason` column in the `tasks` table. 
* **The DB Schema (Strict 3NF):**
  * `projects` (id, vague_goal_text, status)
  * `structured_goals` (id, project_id, description)
  * `tasks` (id, goal_id, description, estimated_hours, assigned_to, status, blocker_reason)
  * `employee_skills` (user_id, skill_name, proficiency_level) and etc.....

---

## 🎯 FEATURE 1: "The Architect" (Project Generation)
**Goal:** Replace the mocked project generator with a live Ilmu.ai call.
**Location:** Server Action (`generateProject`)

1. **Context Gathering:** Query Supabase to fetch all users in the current `orgId` and join their data from `employee_skills`.
2. **The System Prompt:** * "You are 'Opti', an AI Tech Lead. Break the user's project goal into 2-3 structured goals, and 2-4 micro-tasks per goal. You MUST assign each task to a specific user ID based on their skills. Return ONLY valid JSON matching this exact schema: 
   `{ "goals": [ { "description": "string", "tasks": [ { "description": "string", "estimated_hours": number, "assigned_to": "uuid-string" } ] } ] }`"
3. **The Payload:** Send `vague_goal_text` + `JSON.stringify(teamRosterWithSkills)`.
4. **Database Execution:** Parse the JSON response. Perform a batch insert: first into `structured_goals`, returning the IDs, then mapping those IDs to the `tasks` array and inserting into the `tasks` table. Update project status to `active`.

---

## 🚨 FEATURE 2: "The Pivot" (Friction Resolution)
**Goal:** This is the hackathon winner. When a manager clicks `[Resolve Friction]` on a blocked task, the AI reads the `blocker_reason` and suggests a reassignment.
**Location:** Server Action (`generatePivotStrategy`)

1. **Context Gathering:** Fetch the blocked task data (including `blocker_reason`). Fetch the team roster, their skills, AND their current active task count (workload).
2. **The System Prompt:** * "An employee is stuck on a task. Read their 'blocker_reason'. Review the rest of the team's skills and current workload. Suggest a new employee to reassign this task to. The new assignee must have the right skills and the lowest current workload. Return ONLY valid JSON:
   `{ "recommended_user_id": "uuid-string", "reasoning": "A short, 1-sentence explanation of why this person was chosen based on skills/workload." }`"
3. **The Payload:** Send Task Data + `JSON.stringify(teamContext)`.
4. **UI Integration:** Return this JSON object to the frontend so the Manager's `<AIPivotDialog>` can display the `reasoning` and a button to officially execute the transfer.

---

## 🗺️ THE IMPLEMENTATION ROADMAP

**Step 1: The API Client Setup**
* Help me set up the Ilmu API connection using the `@ai-sdk/openai` package or a native `fetch` wrapper. Let's ensure it handles the `ILMU_API_KEY` securely on the server.

**Step 2: Upgrading 'The Architect'**
* I will paste my current `generateProject.ts` file. Rewrite it to include the Context Gathering (Step 1 of Feature 1) and the live Ilmu API call. Wrap the JSON parsing in a robust `try/catch` block to handle LLM hallucinations.

**Step 3: Building 'The Pivot'**
* We will create a brand new Server Action called `generatePivotStrategy`. Write the Supabase queries required to get the current team workload, and construct the prompt to return the reassignment JSON.