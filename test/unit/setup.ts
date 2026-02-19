// test/unit/setup.ts - Mock the vscode module for unit tests
//
// The vscode API is not available outside of the extension host. When ts-node
// compiles and loads our source files, any `import * as vscode from 'vscode'`
// becomes a CommonJS `require('vscode')` call that would throw "Cannot find
// module 'vscode'" in a plain Node.js test environment.
//
// To prevent that we must:
//   1. Intercept Module._resolveFilename so that 'vscode' resolves to the
//      sentinel string 'vscode' instead of throwing.
//   2. Pre-populate Module._cache['vscode'] with a mock object that satisfies
//      every property used by source files at RUNTIME (not just types).
//
// Note: TypeScript interface types (vscode.Uri in a parameter list, etc.) are
// erased at compile time, so only the VALUES that source code actually accesses
// at runtime need to be present in the mock.

const Module = require('module');

const vscode = {
  LanguageModelChatMessage: {
    User: (content: string) => ({ role: 'user', content }),
    Assistant: (content: string) => ({ role: 'assistant', content }),
  },
  ChatRequestTurn: class ChatRequestTurn {},
  ChatResponseTurn: class ChatResponseTurn {},
  ChatResponseMarkdownPart: class ChatResponseMarkdownPart {},
  Uri: {
    joinPath: (...args: any[]) => ({ path: args.join('/') }),
  },
  workspace: {
    getConfiguration: () => ({
      get: (_key: string, defaultValue?: any) => defaultValue,
    }),
    workspaceFolders: undefined,
  },
};

// Step 1: Override the module resolver so that require('vscode') resolves to
// the cache key 'vscode' instead of throwing "Cannot find module".
const originalResolveFilename = Module._resolveFilename.bind(Module);
Module._resolveFilename = function resolveFilename(
  request: string,
  ...args: any[]
) {
  if (request === 'vscode') return 'vscode';
  return originalResolveFilename(request, ...args);
};

// Step 2: Populate the cache under the same key that the resolver now returns.
Module._cache['vscode'] = {
  id: 'vscode',
  filename: 'vscode',
  loaded: true,
  exports: vscode,
  parent: null,
  children: [],
  paths: [],
};

// Convenience: expose the mock globally so individual test files can reference
// it if needed.
(global as any).vscode = vscode;
