// src/skills/registry.ts
import { Skill } from './types';

export class SkillRegistry {
  private skills = new Map<string, Skill>();

  register(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  all(): Skill[] {
    return Array.from(this.skills.values());
  }

  match(prompt: string): Skill | undefined {
    const lower = prompt.toLowerCase();
    for (const skill of this.skills.values()) {
      for (const keyword of skill.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          return skill;
        }
      }
    }
    return undefined;
  }
}
