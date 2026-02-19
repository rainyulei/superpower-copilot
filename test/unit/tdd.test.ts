// test/unit/tdd.test.ts
import * as assert from 'assert';
import { tddSkill } from '../../src/skills/tdd';

suite('TddSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(tddSkill.id, 'tdd');
  });

  test('should have keywords for routing', () => {
    assert.ok(tddSkill.keywords.includes('tdd'));
    assert.ok(tddSkill.keywords.includes('test'));
    assert.ok(tddSkill.keywords.includes('测试'));
  });

  test('should detect phase transition from understand to red', () => {
    const result = tddSkill.detectPhase(
      'Writing the failing test:\n```typescript\ntest(\'should reject empty\',',
      'understand'
    );
    assert.strictEqual(result, 'red');
  });

  test('should detect phase transition from red to verify-red', () => {
    const result = tddSkill.detectPhase(
      'Now run the test to confirm it fails:\n```bash\nnpm test',
      'red'
    );
    assert.strictEqual(result, 'verify-red');
  });

  test('should detect phase transition from verify-red to green', () => {
    const result = tddSkill.detectPhase(
      'Test fails as expected with "function not defined". Writing minimal implementation:',
      'verify-red'
    );
    assert.strictEqual(result, 'green');
  });

  test('should detect phase transition from green to verify-green', () => {
    const result = tddSkill.detectPhase(
      'Run the test again to verify it passes:\n```bash\nnpm test',
      'green'
    );
    assert.strictEqual(result, 'verify-green');
  });

  test('should detect phase transition from verify-green to refactor', () => {
    const result = tddSkill.detectPhase(
      'All tests pass. Now let us refactor:\n- Extract helper',
      'verify-green'
    );
    assert.strictEqual(result, 'refactor');
  });

  test('should detect cycle back from refactor to red', () => {
    const result = tddSkill.detectPhase(
      'Refactoring complete, all tests still green. Next failing test:',
      'refactor'
    );
    assert.strictEqual(result, 'red');
  });

  test('should not transition without signal', () => {
    const result = tddSkill.detectPhase(
      'Let me understand what you want to implement.',
      'understand'
    );
    assert.strictEqual(result, 'understand');
  });

  test('should enforce Iron Law in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST'));
  });

  test('should enforce delete-and-start-over in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('Delete it'));
  });

  test('should enforce one-behavior-per-test in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('one behavior'));
  });

  test('should enforce no mocks unless unavoidable in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('mock'));
  });
});
