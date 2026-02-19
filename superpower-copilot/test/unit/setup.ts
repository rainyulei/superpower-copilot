// test/unit/setup.ts - Mock vscode module for unit tests
const vscode = {
  LanguageModelChatMessage: {
    User: (content: string) => ({ role: 'user', content }),
    Assistant: (content: string) => ({ role: 'assistant', content }),
  },
  ChatRequestTurn: class {},
  ChatResponseTurn: class {},
  ChatResponseMarkdownPart: class {},
  Uri: {
    joinPath: (...args: any[]) => ({ path: args.join('/') }),
  },
  workspace: {
    getConfiguration: () => ({
      get: (key: string, defaultValue?: any) => defaultValue,
    }),
    workspaceFolders: undefined,
  },
};

// Mock the vscode module
(global as any).vscode = vscode;
require('module').Module._cache['vscode'] = {
  exports: vscode,
  id: 'vscode',
  filename: 'vscode',
  loaded: true,
  parent: null,
  children: [],
  paths: [],
};
