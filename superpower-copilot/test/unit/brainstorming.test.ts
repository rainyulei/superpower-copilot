// test/unit/brainstorming.test.ts
import * as assert from 'assert';
import { brainstormingSkill } from '../../src/skills/brainstorming';

describe('BrainstormingSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(brainstormingSkill.id, 'brainstorm');
  });

  it('should have keywords for routing', () => {
    assert.ok(brainstormingSkill.keywords.includes('brainstorm'));
    assert.ok(brainstormingSkill.keywords.includes('设计'));
    assert.ok(brainstormingSkill.keywords.includes('idea'));
  });

  it('should detect phase transition from explore to approach', () => {
    const result = brainstormingSkill.detectPhase(
      'Here are 3 possible approaches:\n**Option A (recommended):**',
      'explore'
    );
    assert.strictEqual(result, 'approach');
  });

  it('should detect phase transition from approach to design', () => {
    const result = brainstormingSkill.detectPhase(
      '## Architecture Overview\nThe system consists of...',
      'approach'
    );
    assert.strictEqual(result, 'design');
  });

  it('should detect phase transition from design to complete', () => {
    const result = brainstormingSkill.detectPhase(
      '## Summary\nThe design is now complete.',
      'design'
    );
    assert.strictEqual(result, 'complete');
  });

  it('should not transition when no signal detected', () => {
    const result = brainstormingSkill.detectPhase(
      'What is the primary use case for this tool?',
      'explore'
    );
    assert.strictEqual(result, 'explore');
  });

  it('should include HARD-GATE in system prompt', () => {
    assert.ok(brainstormingSkill.systemPrompt.includes('NEVER write code'));
  });

  it('should suggest plan as next skill', () => {
    assert.ok(brainstormingSkill.systemPrompt.includes('plan'));
  });
});
