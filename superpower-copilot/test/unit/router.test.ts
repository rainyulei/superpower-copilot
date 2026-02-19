// test/unit/router.test.ts
import * as assert from 'assert';
import { SkillRouter } from '../../out/router.js';
import { SkillRegistry } from '../../out/skills/registry.js';

function createMockSkill(id: string, keywords: string[]) {
  return {
    id, name: id,
    description: `${id} skill`,
    keywords,
    systemPrompt: '',
    async handle(_ctx: any): Promise<any> { return {}; },
  };
}

suite('SkillRouter', () => {
  let registry: SkillRegistry;
  let router: SkillRouter;

  setup(() => {
    registry = new SkillRegistry();
    registry.register(createMockSkill('brainstorm', ['brainstorm', 'idea', '想法', '设计']));
    registry.register(createMockSkill('debug', ['debug', 'bug', '调试', '报错']));
    registry.register(createMockSkill('tdd', ['tdd', 'test-driven', '测试驱动']));
    router = new SkillRouter(registry);
  });

  test('should match by keyword for "I found a bug"', () => {
    const result = router.matchByKeyword('I found a bug');
    assert.strictEqual(result?.id, 'debug');
  });

  test('should match by keyword for Chinese input "我有一个想法"', () => {
    const result = router.matchByKeyword('我有一个想法');
    assert.strictEqual(result?.id, 'brainstorm');
  });

  test('should return undefined when no keyword matches', () => {
    const result = router.matchByKeyword('optimize the database');
    assert.strictEqual(result, undefined);
  });

  test('should fallback to brainstorm as default', () => {
    assert.strictEqual(router.defaultSkill.id, 'brainstorm');
  });
});
