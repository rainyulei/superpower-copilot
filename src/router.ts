// src/router.ts
import * as vscode from 'vscode';
import { SkillRegistry } from './skills/registry';
import { Skill } from './skills/types';

export class SkillRouter {
  constructor(private registry: SkillRegistry) {}

  get defaultSkill(): Skill {
    return this.registry.get('brainstorm')!;
  }

  matchByKeyword(prompt: string): Skill | undefined {
    return this.registry.match(prompt);
  }

  async route(
    prompt: string,
    model: vscode.LanguageModelChat,
    token: vscode.CancellationToken
  ): Promise<Skill> {
    // Tier 1: keyword matching
    const keywordMatch = this.matchByKeyword(prompt);
    if (keywordMatch) return keywordMatch;

    // Tier 2: LLM classification
    try {
      const skillList = this.registry.all()
        .map(s => `- ${s.id}: ${s.description}`)
        .join('\n');

      const messages = [
        vscode.LanguageModelChatMessage.User(
          `Given this user request: "${prompt}"\n` +
          `Which skill best matches? Pick exactly one from:\n${skillList}\n` +
          `Reply with ONLY the skill id, nothing else.`
        ),
      ];

      const response = await model.sendRequest(messages, {}, token);
      let text = '';
      for await (const chunk of response.text) {
        text += chunk;
      }

      const skillId = text.trim().toLowerCase();
      const matched = this.registry.get(skillId);
      if (matched) return matched;
    } catch {
      // LLM classification failed, fall through to default
    }

    // Tier 3: fallback
    return this.defaultSkill;
  }
}
