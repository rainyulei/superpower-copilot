// test/unit/code-review-receive.test.ts
import * as assert from 'assert';
import { codeReviewReceiveSkill } from '../../out/skills/code-review-receive.js';

suite('CodeReviewReceiveSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(codeReviewReceiveSkill.id, 'respond');
  });

  test('should have keywords for routing', () => {
    assert.ok(codeReviewReceiveSkill.keywords.includes('respond'));
    assert.ok(codeReviewReceiveSkill.keywords.includes('feedback'));
    assert.ok(codeReviewReceiveSkill.keywords.includes('review feedback'));
    assert.ok(codeReviewReceiveSkill.keywords.includes('反馈'));
    assert.ok(codeReviewReceiveSkill.keywords.includes('address review'));
    assert.ok(codeReviewReceiveSkill.keywords.includes('fix review'));
  });

  test('should detect phase transition from read to understand', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Let me restate the requirements to ensure I understand correctly...',
      'read'
    );
    assert.strictEqual(result, 'understand');
  });

  test('should detect phase transition from understand to evaluate', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Checking against the codebase to verify if this is technically correct...',
      'understand'
    );
    assert.strictEqual(result, 'evaluate');
  });

  test('should detect phase transition from evaluate to implement', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Fixed. Updated the error handling to use try-catch blocks.',
      'evaluate'
    );
    assert.strictEqual(result, 'implement');
  });

  test('should not transition when no signal detected', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Looking at the review feedback...',
      'read'
    );
    assert.strictEqual(result, 'read');
  });

  test('should forbid performative agreement in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('FORBIDDEN'));
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('You are absolutely right!'));
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('Great point!'));
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('Excellent feedback!'));
  });

  test('should include verify-before-implement guidance in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('verify against codebase') ||
              codeReviewReceiveSkill.systemPrompt.includes('checking.*against.*codebase'));
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('one item at a time') ||
              codeReviewReceiveSkill.systemPrompt.includes('one.*at.*a.*time'));
  });

  test('should include pushback guidance in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('breaks functionality') ||
              codeReviewReceiveSkill.systemPrompt.includes('PUSHBACK'));
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('YAGNI'));
  });

  test('should include one-at-a-time implementation strategy in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('one item at a time') ||
              codeReviewReceiveSkill.systemPrompt.includes('one.*at.*a.*time'));
  });
});
