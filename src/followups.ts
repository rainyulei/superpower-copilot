// src/followups.ts

export interface FollowUp {
  command: string;
  label: string;
  message: string;
}

/**
 * Maps skill IDs to their follow-up actions in the workflow chain
 */
const SKILL_CHAINS: Record<string, string | null> = {
  'brainstorming': 'plan',
  'writing-plans': 'execute',
  'executing-plans': 'verify',
  'verification': 'finish',
  'finish-branch': null,
  'tdd': 'verify',
  'debugging': 'verify',
  'code-review-request': 'respond',
  'code-review-receive': 'verify',
};

/**
 * Labels for follow-up buttons
 */
const FOLLOWUP_LABELS: Record<string, string> = {
  'plan': '📝 Create Implementation Plan',
  'execute': '▶️ Start Execution',
  'verify': '✅ Verify Before Completion',
  'finish': '🚀 Finish Branch',
  'respond': '💬 Respond to Review',
};

/**
 * Get follow-up suggestions for a given skill
 * @param skillId The current skill ID
 * @returns Array of follow-up actions, empty if no follow-ups
 */
export function getFollowUps(skillId: string): FollowUp[] {
  const nextSkill = SKILL_CHAINS[skillId];

  if (!nextSkill) {
    return [];
  }

  const label = FOLLOWUP_LABELS[nextSkill];
  if (!label) {
    return [];
  }

  return [
    {
      command: nextSkill,
      label: label,
      message: '',
    },
  ];
}

/**
 * Get the next skill in the workflow chain
 * @param skillId The current skill ID
 * @returns The next skill ID or null if no follow-up
 */
export function getNextSkill(skillId: string): string | null {
  return SKILL_CHAINS[skillId] ?? null;
}
