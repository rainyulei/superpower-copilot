// src/state/history.ts
import * as vscode from 'vscode';

export interface HistoryEntry {
  type: 'request' | 'response';
  metadata?: {
    skillId?: string;
    phase?: string;
    [key: string]: unknown;
  };
}

export class HistoryParser {
  /**
   * Scans chat history from end to find the most recent active skill ID.
   * @param history - VS Code chat history turns
   * @returns The last active skillId or undefined if none found
   */
  getLastActiveSkill(history: vscode.ChatContext['history']): string | undefined {
    // Scan from the end backwards
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];

      // Check if it's a response turn with result metadata
      if (turn instanceof vscode.ChatResponseTurn) {
        const result = turn.result as { metadata?: { skillId?: string } } | undefined;
        const skillId = result?.metadata?.skillId;
        if (skillId) {
          return skillId;
        }
      }
    }

    return undefined;
  }

  /**
   * Scans chat history from end to find the most recent phase.
   * @param history - VS Code chat history turns
   * @returns The last phase or undefined if none found
   */
  getLastPhase(history: vscode.ChatContext['history']): string | undefined {
    // Scan from the end backwards
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];

      // Check if it's a response turn with phase metadata
      if (turn instanceof vscode.ChatResponseTurn) {
        const result = turn.result as { metadata?: { phase?: string } } | undefined;
        const phase = result?.metadata?.phase;
        if (phase) {
          return phase;
        }
      }
    }

    return undefined;
  }

  /**
   * Counts occurrences of each skillId in the chat history.
   * @param history - VS Code chat history turns
   * @returns Map of skillId to count
   */
  getTurnCounts(history: vscode.ChatContext['history']): Map<string, number> {
    const counts = new Map<string, number>();

    for (const turn of history) {
      if (turn instanceof vscode.ChatResponseTurn) {
        const result = turn.result as { metadata?: { skillId?: string } } | undefined;
        const skillId = result?.metadata?.skillId;
        if (skillId) {
          counts.set(skillId, (counts.get(skillId) || 0) + 1);
        }
      }
    }

    return counts;
  }

  /**
   * Checks if there's an active session based on history.
   * A session is considered active if there's at least one skill in the history.
   * @param history - VS Code chat history turns
   * @returns true if session is active, false otherwise
   */
  isInSession(history: vscode.ChatContext['history']): boolean {
    return this.getLastActiveSkill(history) !== undefined;
  }
}
