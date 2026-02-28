import * as vscode from 'vscode';
import type { OptionsInput, OptionsResult } from '../webview/types';
import type { OptionsViewProvider } from '../webview/optionsViewProvider';

export class OptionsTool implements vscode.LanguageModelTool<OptionsInput> {
  private _provider?: OptionsViewProvider;

  setProvider(provider: OptionsViewProvider): void {
    this._provider = provider;
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<OptionsInput>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const input = options.input;

    let result: OptionsResult;

    if (this._provider?.isAvailable) {
      result = await this._provider.waitForUserResponse(input, token);
    } else {
      result = await this._fallbackQuickPick(input);
    }

    if (result.cancelled) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('User cancelled'),
      ]);
    }

    const parts: string[] = [];
    if (result.selected.length > 0) {
      parts.push(`Selected: ${result.selected.join(', ')}`);
    }
    if (result.freeText) {
      parts.push(`Free text: ${result.freeText}`);
    }

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(parts.join('\n') || 'No selection'),
    ]);
  }

  prepareInvocation(
    options: vscode.LanguageModelToolInvocationOptions<OptionsInput>,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Showing options: ${options.input.title}`,
    };
  }

  private async _fallbackQuickPick(input: OptionsInput): Promise<OptionsResult> {
    const isMulti = input.mode === 'multi';

    if (isMulti) {
      const picks = await vscode.window.showQuickPick(
        input.options.map((o) => ({
          label: o.label,
          description: o.description,
          picked: false,
        })),
        { title: input.title, placeHolder: 'Select options', canPickMany: true }
      );
      if (!picks) {
        return { cancelled: true, selected: [] };
      }
      return { cancelled: false, selected: picks.map((p) => p.label) };
    }

    const selected = await vscode.window.showQuickPick(
      input.options.map((o) => ({
        label: o.label,
        description: o.description,
      })),
      { title: input.title, placeHolder: 'Select an option' }
    );
    if (!selected) {
      return { cancelled: true, selected: [] };
    }
    return { cancelled: false, selected: [selected.label] };
  }
}
