// test/unit/code-review-request.test.ts
import * as assert from 'assert';
import { codeReviewRequestSkill } from '../../src/skills/code-review-request';

suite('CodeReviewRequestSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(codeReviewRequestSkill.id, 'review');
  });

  test('should have keywords for routing', () => {
    assert.ok(codeReviewRequestSkill.keywords.includes('review'));
    assert.ok(codeReviewRequestSkill.keywords.includes('code review'));
    assert.ok(codeReviewRequestSkill.keywords.includes('审查'));
    assert.ok(codeReviewRequestSkill.keywords.includes('检查代码'));
  });

  test('should detect phase transition from gather to analyze', () => {
    const result = codeReviewRequestSkill.detectPhase(
      'Now reviewing the changes and analyzing code quality...',
      'gather'
    );
    assert.strictEqual(result, 'analyze');
  });

  test('should detect phase transition from analyze to report', () => {
    const result = codeReviewRequestSkill.detectPhase(
      '### Strengths\n- Good code organization\n\n### Issues\n\n#### Critical\n- [file.ts:42] Security vulnerability',
      'analyze'
    );
    assert.strictEqual(result, 'report');
  });

  test('should not transition when no signal detected', () => {
    const result = codeReviewRequestSkill.detectPhase(
      'Let me examine the changes in more detail.',
      'gather'
    );
    assert.strictEqual(result, 'gather');
  });

  test('should include severity categories in system prompt', () => {
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Critical'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Important'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Minor'));
  });

  test('should include review dimensions in system prompt', () => {
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Code Quality'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Architecture'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Testing'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Requirements'));
  });

  test('should include file:line references format in system prompt', () => {
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('[file:line]'));
  });
});
