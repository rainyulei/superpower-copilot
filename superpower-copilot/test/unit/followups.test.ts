// test/unit/followups.test.ts
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { getFollowUps, getNextSkill } from '../../src/followups';

describe('Followups Module', () => {
  describe('getFollowUps', () => {
    it('should return plan followup for brainstorming', () => {
      const followups = getFollowUps('brainstorming');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'plan');
      assert.strictEqual(followups[0].label, '📝 Create Implementation Plan');
    });

    it('should return execute followup for writing-plans', () => {
      const followups = getFollowUps('writing-plans');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'execute');
      assert.strictEqual(followups[0].label, '▶️ Start Execution');
    });

    it('should return verify followup for executing-plans', () => {
      const followups = getFollowUps('executing-plans');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'verify');
      assert.strictEqual(followups[0].label, '✅ Verify Before Completion');
    });

    it('should return finish followup for verification', () => {
      const followups = getFollowUps('verification');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'finish');
      assert.strictEqual(followups[0].label, '🚀 Finish Branch');
    });

    it('should return empty array for finish-branch (end of chain)', () => {
      const followups = getFollowUps('finish-branch');
      assert.strictEqual(followups.length, 0);
    });

    it('should return verify followup for tdd', () => {
      const followups = getFollowUps('tdd');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'verify');
    });

    it('should return verify followup for debugging', () => {
      const followups = getFollowUps('debugging');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'verify');
    });

    it('should return respond followup for code-review-request', () => {
      const followups = getFollowUps('code-review-request');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'respond');
      assert.strictEqual(followups[0].label, '💬 Respond to Review');
    });

    it('should return verify followup for code-review-receive', () => {
      const followups = getFollowUps('code-review-receive');
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].command, 'verify');
    });

    it('should return empty array for unknown skill', () => {
      const followups = getFollowUps('unknown-skill');
      assert.strictEqual(followups.length, 0);
    });
  });

  describe('getNextSkill', () => {
    it('should return correct next skill in main flow', () => {
      assert.strictEqual(getNextSkill('brainstorming'), 'plan');
      assert.strictEqual(getNextSkill('writing-plans'), 'execute');
      assert.strictEqual(getNextSkill('executing-plans'), 'verify');
      assert.strictEqual(getNextSkill('verification'), 'finish');
    });

    it('should return null for finish-branch (end of chain)', () => {
      assert.strictEqual(getNextSkill('finish-branch'), null);
    });

    it('should return verify for tdd and debugging', () => {
      assert.strictEqual(getNextSkill('tdd'), 'verify');
      assert.strictEqual(getNextSkill('debugging'), 'verify');
    });

    it('should return correct next skill in review flow', () => {
      assert.strictEqual(getNextSkill('code-review-request'), 'respond');
      assert.strictEqual(getNextSkill('code-review-receive'), 'verify');
    });

    it('should return null for unknown skill', () => {
      assert.strictEqual(getNextSkill('unknown-skill'), null);
    });
  });
});
