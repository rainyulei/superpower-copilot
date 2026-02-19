// test/unit/welcome.test.ts
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { getWelcomeMessage, getHelpMessage, getSkillSummaries } from '../../src/welcome';

describe('Welcome Module', () => {
  describe('getWelcomeMessage', () => {
    it('should return a welcome message', () => {
      const message = getWelcomeMessage();
      assert.ok(message.length > 0);
      assert.ok(message.includes('Superpower Copilot'));
      assert.ok(message.includes('/brainstorm'));
    });
  });

  describe('getHelpMessage', () => {
    it('should return help message with all commands', () => {
      const message = getHelpMessage();
      assert.ok(message.includes('/brainstorm'));
      assert.ok(message.includes('/plan'));
      assert.ok(message.includes('/execute'));
      assert.ok(message.includes('/verify'));
      assert.ok(message.includes('/finish'));
      assert.ok(message.includes('/tdd'));
      assert.ok(message.includes('/debug'));
      assert.ok(message.includes('/review'));
      assert.ok(message.includes('/respond'));
    });

    it('should include workflow chain diagram', () => {
      const message = getHelpMessage();
      assert.ok(message.includes('brainstorm → plan → execute → verify → finish'));
      assert.ok(message.includes('tdd → verify'));
      assert.ok(message.includes('debug → verify'));
      assert.ok(message.includes('review → respond → verify'));
    });
  });

  describe('getSkillSummaries', () => {
    it('should return array of 9 skill summaries', () => {
      const summaries = getSkillSummaries();
      assert.strictEqual(summaries.length, 9);
    });

    it('should have required fields for each summary', () => {
      const summaries = getSkillSummaries();
      for (const summary of summaries) {
        assert.ok(summary.id, 'summary should have id');
        assert.ok(summary.name, 'summary should have name');
        assert.ok(summary.command, 'summary should have command');
        assert.ok(summary.oneLiner, 'summary should have oneLiner');
      }
    });

    it('should include all 9 core skills', () => {
      const summaries = getSkillSummaries();
      const commands = summaries.map(s => s.command);
      assert.ok(commands.includes('brainstorm'));
      assert.ok(commands.includes('plan'));
      assert.ok(commands.includes('execute'));
      assert.ok(commands.includes('verify'));
      assert.ok(commands.includes('finish'));
      assert.ok(commands.includes('tdd'));
      assert.ok(commands.includes('debug'));
      assert.ok(commands.includes('review'));
      assert.ok(commands.includes('respond'));
    });
  });
});
