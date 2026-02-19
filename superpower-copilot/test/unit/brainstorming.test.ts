// test/unit/brainstorming.test.ts
import * as assert from 'assert';
import { brainstormingSkill } from '../../out/skills/brainstorming.js';

suite('BrainstormingSkill', () => {
  test('should have correct id', () => {
    assert.strictEqual(brainstormingSkill.id, 'brainstorm');
  });

  test('should have keywords for routing', () => {
    assert.ok(brainstormingSkill.keywords.includes('brainstorm'));
    assert.ok(brainstormingSkill.keywords.includes('设计'));
    assert.ok(brainstormingSkill.keywords.includes('idea'));
  });

  test('should detect phase transition from explore to approach', () => {
    const result = brainstormingSkill.detectPhase(
      'Here are 3 possible approaches:\n**Option A (recommended):**',
      'explore'
    );
    assert.strictEqual(result, 'approach');
  });

  test('should detect phase transition from approach to design', () => {
    const result = brainstormingSkill.detectPhase(
      '## Architecture Overview\nThe system consists of...',
      'approach'
    );
    assert.strictEqual(result, 'design');
  });

  test('should detect phase transition from design to complete', () => {
    const result = brainstormingSkill.detectPhase(
      '## Summary\nThe design is now complete.',
      'design'
    );
    assert.strictEqual(result, 'complete');
  });

  test('should not transition when no signal detected', () => {
    const result = brainstormingSkill.detectPhase(
      'What is the primary use case for this tool?',
      'explore'
    );
    assert.strictEqual(result, 'explore');
  });

  test('should include HARD-GATE in system prompt', () => {
    assert.ok(brainstormingSkill.systemPrompt.includes('NEVER write code'));
  });

  test('should suggest plan as next skill', () => {
    assert.ok(brainstormingSkill.systemPrompt.includes('plan'));
  });
});
