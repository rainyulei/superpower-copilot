// test/unit/executing-plans.test.ts
import * as assert from 'assert';
import { executingPlansSkill } from '../../src/skills/executing-plans';

describe('ExecutingPlansSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(executingPlansSkill.id, 'execute');
  });

  it('should have keywords for routing', () => {
    assert.ok(executingPlansSkill.keywords.includes('execute'));
    assert.ok(executingPlansSkill.keywords.includes('执行'));
  });

  it('should detect phase transition from load to batch', () => {
    const result = executingPlansSkill.detectPhase(
      'Starting batch 1 of 3. Executing Task 1...',
      'load'
    );
    assert.strictEqual(result, 'batch');
  });

  it('should detect phase transition from batch to verify-batch', () => {
    const result = executingPlansSkill.detectPhase(
      'Batch complete. Verification results:\n✅ Tests pass\n✅ Build succeeds',
      'batch'
    );
    assert.strictEqual(result, 'verify-batch');
  });

  it('should detect phase transition from verify-batch to done', () => {
    const result = executingPlansSkill.detectPhase(
      'All tasks complete. All verifications passed.',
      'verify-batch'
    );
    assert.strictEqual(result, 'done');
  });

  it('should not transition without signal', () => {
    const result = executingPlansSkill.detectPhase(
      'Reading the plan file now...',
      'load'
    );
    assert.strictEqual(result, 'load');
  });

  it('should enforce batch-of-3 in system prompt', () => {
    assert.ok(executingPlansSkill.systemPrompt.includes('batch of 3'));
  });

  it('should enforce STOP conditions in system prompt', () => {
    assert.ok(executingPlansSkill.systemPrompt.includes('STOP'));
  });

  it('should suggest verify as next skill', () => {
    // The system prompt should mention verification as next step
    assert.ok(executingPlansSkill.systemPrompt.includes('verify'));
  });
});
