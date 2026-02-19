// test/unit/executing-plans.test.ts
import * as assert from 'assert';
import { executingPlansSkill } from '../../out/skills/executing-plans.js';

suite('ExecutingPlansSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(executingPlansSkill.id, 'execute');
  });

  test('should have keywords for routing', () => {
    assert.ok(executingPlansSkill.keywords.includes('execute'));
    assert.ok(executingPlansSkill.keywords.includes('执行'));
  });

  test('should detect phase transition from load to batch', () => {
    const result = executingPlansSkill.detectPhase(
      'Starting batch 1 of 3. Executing Task 1...',
      'load'
    );
    assert.strictEqual(result, 'batch');
  });

  test('should detect phase transition from batch to verify-batch', () => {
    const result = executingPlansSkill.detectPhase(
      'Batch complete. Verification results:\n✅ Tests pass\n✅ Build succeeds',
      'batch'
    );
    assert.strictEqual(result, 'verify-batch');
  });

  test('should detect phase transition from verify-batch to done', () => {
    const result = executingPlansSkill.detectPhase(
      'All tasks complete. All verifications passed.',
      'verify-batch'
    );
    assert.strictEqual(result, 'done');
  });

  test('should not transition without signal', () => {
    const result = executingPlansSkill.detectPhase(
      'Reading the plan file now...',
      'load'
    );
    assert.strictEqual(result, 'load');
  });

  test('should enforce batch-of-3 in system prompt', () => {
    assert.ok(executingPlansSkill.systemPrompt.includes('batch of 3'));
  });

  test('should enforce STOP conditions in system prompt', () => {
    assert.ok(executingPlansSkill.systemPrompt.includes('STOP'));
  });

  test('should suggest verify as next skill', () => {
    // The system prompt should mention verification as next step
    assert.ok(executingPlansSkill.systemPrompt.includes('verify'));
  });
});
