// src/state/session.ts
import { SessionState } from '../skills/types';

export class SessionStateImpl implements SessionState {
  private store = new Map<string, Map<string, unknown>>();
  private activeSkillId: string | null = null;

  activate(skillId: string): void {
    this.activeSkillId = skillId;
    if (!this.store.has(skillId)) {
      this.store.set(skillId, new Map());
    }
  }

  get<T>(key: string): T | undefined {
    if (!this.activeSkillId) return undefined;
    return this.store.get(this.activeSkillId)?.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    if (!this.activeSkillId) return;
    this.store.get(this.activeSkillId)!.set(key, value);
  }

  transfer(fromSkill: string, toSkill: string, key: string): void {
    const value = this.store.get(fromSkill)?.get(key);
    if (value !== undefined) {
      if (!this.store.has(toSkill)) {
        this.store.set(toSkill, new Map());
      }
      this.store.get(toSkill)!.set(key, value);
    }
  }

  serialize(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [skillId, state] of this.store) {
      result[skillId] = Object.fromEntries(state);
    }
    return result;
  }

  static fromSerialized(data: Record<string, unknown>): SessionStateImpl {
    const session = new SessionStateImpl();
    for (const [skillId, state] of Object.entries(data)) {
      session.store.set(skillId, new Map(Object.entries(state as Record<string, unknown>)));
    }
    return session;
  }
}
