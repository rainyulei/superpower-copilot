// test/unit/debugging.test.ts
import * as assert from 'assert';
import { debuggingSkill } from '../../src/skills/debugging';

suite('DebuggingSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(debuggingSkill.id, 'debug');
  });

  test('should have keywords for routing', () => {
    assert.ok(debuggingSkill.keywords.includes('debug'));
    assert.ok(debuggingSkill.keywords.includes('bug'));
    assert.ok(debuggingSkill.keywords.includes('调试'));
  });

  test('should detect phase transition from root-cause to pattern', () => {
    const result = debuggingSkill.detectPhase(
      'Found similar working code in src/services/auth.ts. Comparing patterns:',
      'root-cause'
    );
    assert.strictEqual(result, 'pattern');
  });

  test('should detect phase transition from pattern to hypothesis', () => {
    const result = debuggingSkill.detectPhase(
      'Hypothesis: The error is caused by missing null check in the parser because the input can be undefined when API returns 204.',
      'pattern'
    );
    assert.strictEqual(result, 'hypothesis');
  });

  test('should detect phase transition from hypothesis to implement', () => {
    const result = debuggingSkill.detectPhase(
      'Hypothesis confirmed. Creating a failing test to reproduce the bug:',
      'hypothesis'
    );
    assert.strictEqual(result, 'implement');
  });

  test('should not transition without signal', () => {
    const result = debuggingSkill.detectPhase(
      'Reading the error message carefully...',
      'root-cause'
    );
    assert.strictEqual(result, 'root-cause');
  });

  test('should enforce Iron Law in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('NO FIXES WITHOUT ROOT CAUSE INVESTIGATION'));
  });

  test('should enforce 3-fix architectural stop in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('3'));
    assert.ok(debuggingSkill.systemPrompt.includes('architecture'));
  });

  test('should enforce one-variable-at-a-time in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('one variable'));
  });

  test('should enforce failing test before fix in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('failing test'));
  });
});
