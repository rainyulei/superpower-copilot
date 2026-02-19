// test/tsconfig-setup.js
// This file MUST be loaded before ts-node/register so that ts-node picks up
// tsconfig.test.json (module: commonjs) instead of tsconfig.json (module: Node16).
// Mixing Node16 module format with CommonJS require() causes ts-node to crash.
process.env.TS_NODE_PROJECT = 'tsconfig.test.json';
