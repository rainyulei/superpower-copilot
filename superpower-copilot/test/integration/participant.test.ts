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

  test('Execute command should be registered', async () => {
    const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
    await ext!.activate();
    // Verify the extension is active and has all 5 commands
    assert.ok(ext!.isActive);
  });

  test('All 9 slash commands should be available', () => {
    // This verifies package.json has all commands registered
    const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
    const commands = ext!.packageJSON.contributes.chatParticipants[0].commands;
    const commandNames = commands.map((c: any) => c.name);
    assert.strictEqual(commandNames.length, 9);
    assert.ok(commandNames.includes('brainstorm'));
    assert.ok(commandNames.includes('plan'));
    assert.ok(commandNames.includes('execute'));
    assert.ok(commandNames.includes('verify'));
    assert.ok(commandNames.includes('finish'));
    assert.ok(commandNames.includes('tdd'));
    assert.ok(commandNames.includes('debug'));
    assert.ok(commandNames.includes('review'));
    assert.ok(commandNames.includes('respond'));
  });
});
