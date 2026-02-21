import * as vscode from 'vscode';

interface OptionItem {
  label: string;
  description?: string;
}

interface OptionsInput {
  title: string;
  options: OptionItem[];
}

export class OptionsTool implements vscode.LanguageModelTool<OptionsInput> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<OptionsInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const { title, options: items } = options.input;

    const selected = await vscode.window.showQuickPick(
      items.map(item => ({
        label: item.label,
        description: item.description
      })),
      {
        title,
        placeHolder: 'Select an option'
      }
    );

    const result = selected ? selected.label : 'User cancelled';

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(result)
    ]);
  }

  prepareInvocation(
    options: vscode.LanguageModelToolInvocationOptions<OptionsInput>,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PreparedToolInvocation> {
    const { title } = options.input;
    return {
      invocationMessage: `Showing options: ${title}`
    };
  }
}
