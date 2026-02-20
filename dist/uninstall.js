"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Runs when the extension is uninstalled (via package.json "vscode:uninstall")
// No VS Code API available — only Node.js built-ins
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || '';
const targetDir = path.join(homeDir, '.superpower-copilot', 'agents');
const parentDir = path.join(homeDir, '.superpower-copilot');
try {
    if (fs.existsSync(targetDir)) {
        for (const file of fs.readdirSync(targetDir)) {
            if (file.endsWith('.agent.md')) {
                fs.unlinkSync(path.join(targetDir, file));
            }
        }
        try {
            fs.rmdirSync(targetDir);
        }
        catch { }
        try {
            fs.rmdirSync(parentDir);
        }
        catch { }
    }
    console.log('Superpower Copilot: Cleaned up agent files.');
}
catch (err) {
    console.error('Superpower Copilot: Cleanup failed —', err);
}
//# sourceMappingURL=uninstall.js.map