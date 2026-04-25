/**
 * Safe, minimal "chunking" for LLM prompts: bounded per-member payloads + roster split
 * into sequential JSON blocks (one HTTP request). No members or user_ids are dropped.
 */

const DEFAULTS = {
    maxSkillsPerMember: 30,
    maxSkillNameChars: 80,
    maxDisplayNameChars: 100,
    membersPerChunk: 12,
    /** Safety clip for pivot prompts if DB fields are unexpectedly huge */
    maxPivotTaskSnippetChars: 1200,
} as const

/** Re-export for call sites (pivot task description / blocker clipping). */
export const PIVOT_PROMPT_SNIPPET_MAX_CHARS = DEFAULTS.maxPivotTaskSnippetChars

function truncate(str: string, max: number): string {
    if (str.length <= max) return str
    return str.slice(0, max) + "…"
}

export function clipForPrompt(value: string | null | undefined, max: number): string {
    return truncate((value ?? "").trim(), max)
}

function takeTopSkills(
    skills: { skill_name: string; proficiency_level: number }[],
    maxCount: number,
    maxNameLen: number,
): { skill_name: string; proficiency_level: number }[] {
    return [...skills]
        .sort(
            (a, b) =>
                b.proficiency_level - a.proficiency_level ||
                a.skill_name.localeCompare(b.skill_name),
        )
        .slice(0, maxCount)
        .map((s) => ({
            skill_name: truncate(s.skill_name, maxNameLen),
            proficiency_level: s.proficiency_level,
        }))
}

function coalesceSkillRows(
    raw: unknown,
): { skill_name: string; proficiency_level: number }[] {
    if (!raw) return []
    if (Array.isArray(raw)) {
        return raw
            .filter((r): r is { skill_name: string; proficiency_level: number } =>
                Boolean(r && typeof (r as any).skill_name === "string"),
            )
            .map((r) => ({
                skill_name: String((r as any).skill_name),
                proficiency_level: Number((r as any).proficiency_level) || 0,
            }))
    }
    if (typeof raw === "object") {
        const r = raw as any
        if (typeof r.skill_name === "string") {
            return [
                {
                    skill_name: r.skill_name,
                    proficiency_level: Number(r.proficiency_level) || 0,
                },
            ]
        }
    }
    return []
}

export type OrchestrationRosterMember = {
    user_id: string
    display_name: string
    role: string
    role_priority: string
    skills: { skill_name: string; proficiency_level: number }[]
}

/**
 * Roster text for project orchestration: skills capped per member, names clipped,
 * members grouped into labeled JSON chunks (full team preserved across chunks).
 */
export function buildChunkedTeamRosterContext(
    roster: OrchestrationRosterMember[],
    options?: Partial<typeof DEFAULTS>,
): string {
    const o = { ...DEFAULTS, ...options }
    const normalized = roster.map((m) => ({
        user_id: m.user_id,
        display_name: truncate(m.display_name, o.maxDisplayNameChars),
        role: m.role,
        role_priority: m.role_priority,
        skills: takeTopSkills(m.skills, o.maxSkillsPerMember, o.maxSkillNameChars),
    }))

    const slices: OrchestrationRosterMember[][] = []
    for (let i = 0; i < normalized.length; i += o.membersPerChunk) {
        slices.push(normalized.slice(i, i + o.membersPerChunk))
    }
    if (slices.length === 0) {
        slices.push([])
    }

    const header =
        "Sequential roster chunks (same team; every user_id may receive tasks). Read all chunks before assigning."

    const body = slices
        .map((slice, idx) => {
            const label = `Roster chunk ${idx + 1} of ${slices.length}`
            return `### ${label}\n${JSON.stringify(slice, null, 2)}`
        })
        .join("\n\n")

    return `${header}\n\n${body}`
}

export type PivotCandidate = {
    user_id: string
    role: string
    employee_skills?: unknown
    current_workload_count: number
}

/** Pivot prompt roster: same caps + optional multi-chunk layout for large candidate lists. */
export function buildChunkedPivotCandidatesContext(
    candidates: PivotCandidate[],
    options?: Partial<typeof DEFAULTS>,
): string {
    const o = { ...DEFAULTS, ...options }
    const normalized = candidates.map((c) => ({
        user_id: c.user_id,
        role: c.role,
        current_workload_count: c.current_workload_count,
        employee_skills: takeTopSkills(
            coalesceSkillRows(c.employee_skills),
            o.maxSkillsPerMember,
            o.maxSkillNameChars,
        ),
    }))

    type PivotRow = (typeof normalized)[number]
    const slices: PivotRow[][] = []
    for (let i = 0; i < normalized.length; i += o.membersPerChunk) {
        slices.push(normalized.slice(i, i + o.membersPerChunk))
    }
    if (slices.length === 0) slices.push([])

    const header =
        "Sequential candidate chunks (same reassignment pool). Read all chunks before choosing recommended_user_id."

    const body = slices
        .map((slice, idx) => {
            const label = `Candidate chunk ${idx + 1} of ${slices.length}`
            return `### ${label}\n${JSON.stringify(slice, null, 2)}`
        })
        .join("\n\n")

    return `${header}\n\n${body}`
}

