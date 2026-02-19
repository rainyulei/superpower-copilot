// test/unit/history.test.ts
import * as assert from 'assert';
import { HistoryParser } from '../../src/state/history';

// Use the mock vscode module from setup.ts (loaded via .mocharc.json require)
const vscode = (global as any).vscode;

suite('HistoryParser', () => {
  let parser: HistoryParser;

  setup(() => {
    parser = new HistoryParser();
  });

  test('getLastActiveSkill returns the most recent skillId', () => {
    const history: any[] = [
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'brainstorm' } } }),
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'plan' } } }),
    ];

    const result = parser.getLastActiveSkill(history);
    assert.strictEqual(result, 'plan');
  });

  test('getLastActiveSkill returns undefined when no skillId in history', () => {
    const history: any[] = [
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: {} } }),
    ];

    const result = parser.getLastActiveSkill(history);
    assert.strictEqual(result, undefined);
  });

  test('getLastPhase returns the most recent phase', () => {
    const history: any[] = [
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { phase: 'analysis' } } }),
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { phase: 'implementation' } } }),
    ];

    const result = parser.getLastPhase(history);
    assert.strictEqual(result, 'implementation');
  });

  test('getTurnCounts counts skillId occurrences correctly', () => {
    const history: any[] = [
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'brainstorm' } } }),
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'brainstorm' } } }),
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'plan' } } }),
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'brainstorm' } } }),
    ];

    const counts = parser.getTurnCounts(history);
    assert.strictEqual(counts.get('brainstorm'), 3);
    assert.strictEqual(counts.get('plan'), 1);
    assert.strictEqual(counts.get('debug'), undefined);
  });

  test('isInSession returns true when there is an active skill', () => {
    const history: any[] = [
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: { skillId: 'tdd' } } }),
    ];

    const result = parser.isInSession(history);
    assert.strictEqual(result, true);
  });

  test('isInSession returns false when there is no active skill', () => {
    const history: any[] = [
      Object.assign(new vscode.ChatResponseTurn(), { result: { metadata: {} } }),
    ];

    const result = parser.isInSession(history);
    assert.strictEqual(result, false);
  });
});
