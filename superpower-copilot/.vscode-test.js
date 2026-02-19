const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  tests: [{
    files: 'test/**/*.test.ts',
    workspaceFolder: '.',
    mocha: {
      ui: 'tdd',
      timeout: 20000
    }
  }],
  userDataDir: '/tmp/vsc-test'
});
