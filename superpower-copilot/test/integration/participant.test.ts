// test/integration/participant.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Superpower Copilot Integration', () => {
  test('Extension should be activated', async () => {
    const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
    assert.ok(ext, 'Extension not found');
    await ext!.activate();
    assert.ok(ext!.isActive, 'Extension not active');
  });

  test('Chat participant should be registered', async () => {
    // Verify the participant exists by checking registered commands
    const commands = await vscode.commands.getCommands();
    assert.ok(
      commands.includes('superpower.saveDesign'),
      'saveDesign command not registered'
    );
    assert.ok(
      commands.includes('superpower.savePlan'),
      'savePlan command not registered'
    );
  });
});
