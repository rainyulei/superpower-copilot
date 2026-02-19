// test/unit/router.test.ts
import * as assert from 'assert';
import { SkillRouter } from '../../src/router';
import { SkillRegistry } from '../../src/skills/registry';
import { Skill, SkillContext, SkillResult } from '../../src/skills/types';

function createMockSkill(id: string, keywords: string[]): Skill {
  return {
    id, name: id,
    description: `${id} skill`,
    keywords,
    systemPrompt: '',
    async handle(_ctx: SkillContext): Promise<SkillResult> { return {}; },
  };
}

describe('SkillRouter', () => {
  let registry: SkillRegistry;
  let router: SkillRouter;

  beforeEach(() => {
    registry = new SkillRegistry();
    registry.register(createMockSkill('brainstorm', ['brainstorm', 'idea', '想法', '设计']));
    registry.register(createMockSkill('debug', ['debug', 'bug', '调试', '报错']));
    registry.register(createMockSkill('tdd', ['tdd', 'test-driven', '测试驱动']));
    router = new SkillRouter(registry);
  });

  it('should match by keyword for "I found a bug"', () => {
    const result = router.matchByKeyword('I found a bug');
    assert.strictEqual(result?.id, 'debug');
  });

  it('should match by keyword for Chinese input "我有一个想法"', () => {
    const result = router.matchByKeyword('我有一个想法');
    assert.strictEqual(result?.id, 'brainstorm');
  });

  it('should return undefined when no keyword matches', () => {
    const result = router.matchByKeyword('optimize the database');
    assert.strictEqual(result, undefined);
  });

  it('should fallback to brainstorm as default', () => {
    assert.strictEqual(router.defaultSkill.id, 'brainstorm');
  });
});
