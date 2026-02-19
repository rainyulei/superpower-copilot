// test/unit/finish-branch.test.ts
import * as assert from 'assert';
import { finishBranchSkill } from '../../out/skills/finish-branch.js';

suite('FinishBranchSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(finishBranchSkill.id, 'finish');
  });

  test('should have keywords for routing', () => {
    assert.ok(finishBranchSkill.keywords.includes('finish'));
    assert.ok(finishBranchSkill.keywords.includes('merge'));
  });

  test('should detect phase transition from status to options', () => {
    const result = finishBranchSkill.detectPhase(
      'All tests pass. Here are your options:\n1. Merge\n2. PR\n3. Keep\n4. Discard',
      'status'
    );
    assert.strictEqual(result, 'options');
  });

  test('should detect phase transition from options to execute', () => {
    const result = finishBranchSkill.detectPhase(
      'Executing option 2: Creating pull request...',
      'options'
    );
    assert.strictEqual(result, 'execute');
  });

  test('should not transition without signal', () => {
    const result = finishBranchSkill.detectPhase(
      'Running test suite...',
      'status'
    );
    assert.strictEqual(result, 'status');
  });

  test('should enforce exactly 4 options in system prompt', () => {
    assert.ok(finishBranchSkill.systemPrompt.includes('exactly 4 options'));
  });

  test('should require discard confirmation in system prompt', () => {
    assert.ok(finishBranchSkill.systemPrompt.includes('discard'));
  });

  test('should enforce test-first in system prompt', () => {
    assert.ok(finishBranchSkill.systemPrompt.includes('NEVER proceed with failing tests'));
  });
});
