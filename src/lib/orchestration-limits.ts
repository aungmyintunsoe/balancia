/** Max characters for the free-text project goal shown on the goals orchestration form. */
export const ORCHESTRATION_GOAL_MAX_CHARS = 1200;

/**
 * Hard cap on the Ilmu `generateText` call for project decomposition (server-side).
 * Structured JSON + roster context often exceeds 15–30s; keep this generous to avoid false timeouts.
 */
export const ORCHESTRATION_AI_TIMEOUT_MS = 120_000;
