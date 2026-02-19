// test/unit/code-review-receive.test.ts
import * as assert from 'assert';
import { codeReviewReceiveSkill } from '../../src/skills/code-review-receive';

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
    // The source uses "Checking against codebase:" in the CORRECT Response Patterns section
    // and "Verify each suggestion against the codebase" in the EVALUATE phase.
    assert.ok(
      codeReviewReceiveSkill.systemPrompt.includes('Checking against codebase') ||
      codeReviewReceiveSkill.systemPrompt.includes('Verify each suggestion against the codebase'),
      'System prompt should mention verifying against the codebase'
    );
    // The source uses "One item at a time." (capital O) in the IMPLEMENT phase.
    assert.ok(
      codeReviewReceiveSkill.systemPrompt.includes('One item at a time') ||
      codeReviewReceiveSkill.systemPrompt.includes('one at a time'),
      'System prompt should mention processing one item at a time'
    );
  });

  test('should include pushback guidance in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('breaks functionality') ||
              codeReviewReceiveSkill.systemPrompt.includes('PUSHBACK'));
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('YAGNI'));
  });

  test('should include one-at-a-time implementation strategy in system prompt', () => {
    // The source uses "One item at a time." (capital O) in the IMPLEMENT phase
    // and "Address items one at a time:" earlier in that section.
    assert.ok(
      codeReviewReceiveSkill.systemPrompt.includes('One item at a time') ||
      codeReviewReceiveSkill.systemPrompt.includes('one at a time'),
      'System prompt should specify one-at-a-time implementation strategy'
    );
  });
});
