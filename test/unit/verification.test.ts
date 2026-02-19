// test/unit/verification.test.ts
import * as assert from 'assert';
import { verificationSkill } from '../../src/skills/verification';

suite('VerificationSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(verificationSkill.id, 'verify');
  });

  test('should have keywords for routing', () => {
    assert.ok(verificationSkill.keywords.includes('verify'));
    assert.ok(verificationSkill.keywords.includes('验证'));
  });

  test('should detect phase transition from identify to run', () => {
    const result = verificationSkill.detectPhase(
      'Running: npm test\n```',
      'identify'
    );
    assert.strictEqual(result, 'run');
  });

  test('should detect phase transition from run to read', () => {
    const result = verificationSkill.detectPhase(
      'Command output:\n```\n12 passing\n0 failing\nExit code: 0\n```',
      'run'
    );
    assert.strictEqual(result, 'read');
  });

  test('should detect phase transition from read to verify', () => {
    const result = verificationSkill.detectPhase(
      'Checking results against criteria:\n- ✅ All 12 tests pass\n- ✅ Exit code 0',
      'read'
    );
    assert.strictEqual(result, 'verify');
  });

  test('should detect phase transition from verify to claim', () => {
    const result = verificationSkill.detectPhase(
      'VERIFIED: All criteria met. Evidence confirms implementation is complete.',
      'verify'
    );
    assert.strictEqual(result, 'claim');
  });

  test('should enforce Iron Law in system prompt', () => {
    assert.ok(verificationSkill.systemPrompt.includes('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION'));
  });

  test('should forbid speculative language in system prompt', () => {
    assert.ok(verificationSkill.systemPrompt.includes('should'));
    assert.ok(verificationSkill.systemPrompt.includes('probably'));
  });
});
