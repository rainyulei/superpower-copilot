// src/welcome.ts

export interface SkillSummary {
  id: string;
  name: string;
  command: string;
  oneLiner: string;
}

/**
 * Returns a welcome message for first-time users or empty prompts
 */
export function getWelcomeMessage(): string {
  return `# Welcome to Superpower Copilot! 🚀

Your structured development workflow assistant. I help you follow disciplined practices through specialized skills.

## Quick Start

Try \`/brainstorm\` to explore ideas and design before jumping into code!

Type \`/help\` to see all available commands and workflows.`;
}

/**
 * Returns detailed help with all commands and workflow chains
 */
export function getHelpMessage(): string {
  const skills = getSkillSummaries();

  let message = `# Superpower Copilot Commands

## Available Skills

`;

  for (const skill of skills) {
    message += `- **/${skill.command}** — ${skill.oneLiner}\n`;
  }

  message += `\n## Workflow Chains

These skills work together in structured sequences:

\`\`\`
Main Flow:
  brainstorm → plan → execute → verify → finish

TDD Flow:
  tdd → verify

Debug Flow:
  debug → verify

Review Flow:
  review → respond → verify
\`\`\`

## Usage

Use \`@superpower /command\` to invoke any skill, or just chat with me and I'll route to the right skill automatically!
`;

  return message;
}

/**
 * Returns array of all registered skill summaries
 */
export function getSkillSummaries(): SkillSummary[] {
  return [
    {
      id: 'brainstorming',
      name: 'Brainstorming',
      command: 'brainstorm',
      oneLiner: 'Explore ideas and design before implementation',
    },
    {
      id: 'writing-plans',
      name: 'Writing Plans',
      command: 'plan',
      oneLiner: 'Create a step-by-step implementation plan',
    },
    {
      id: 'executing-plans',
      name: 'Executing Plans',
      command: 'execute',
      oneLiner: 'Execute an implementation plan step by step',
    },
    {
      id: 'verification',
      name: 'Verification',
      command: 'verify',
      oneLiner: 'Verify work before claiming completion',
    },
    {
      id: 'finish-branch',
      name: 'Finish Branch',
      command: 'finish',
      oneLiner: 'Finish development branch (merge, PR, or discard)',
    },
    {
      id: 'tdd',
      name: 'Test-Driven Development',
      command: 'tdd',
      oneLiner: 'Test-driven development: red-green-refactor cycle',
    },
    {
      id: 'debugging',
      name: 'Systematic Debugging',
      command: 'debug',
      oneLiner: 'Systematic debugging: find root cause before fixing',
    },
    {
      id: 'code-review-request',
      name: 'Code Review Request',
      command: 'review',
      oneLiner: 'Request structured code review on recent changes',
    },
    {
      id: 'code-review-receive',
      name: 'Code Review Response',
      command: 'respond',
      oneLiner: 'Process code review feedback with technical rigor',
    },
  ];
}
