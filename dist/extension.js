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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const AGENTS_DIR = 'agents';
const SETTING_KEY = 'chat.agentFilesLocations';
const GLOBAL_AGENTS_DIR = '~/.superpower-copilot/agents';
function getTargetDir() {
    const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || '';
    return path.join(homeDir, '.superpower-copilot', 'agents');
}
function activate(context) {
    const sourceDir = path.join(context.extensionPath, AGENTS_DIR);
    const targetDir = getTargetDir();
    try {
        // 1. Clean target directory — remove ALL old .agent.md files first
        if (fs.existsSync(targetDir)) {
            for (const file of fs.readdirSync(targetDir)) {
                if (file.endsWith('.agent.md')) {
                    try {
                        fs.unlinkSync(path.join(targetDir, file));
                    }
                    catch { }
                }
            }
        }
        // 2. Create directory and copy fresh agent files
        fs.mkdirSync(targetDir, { recursive: true });
        const agentFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.agent.md'));
        for (const file of agentFiles) {
            fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
        }
        // 3. Force-register the path in settings (always write, don't skip)
        forceRegisterAgentsPath();
        vscode.window.showInformationMessage(`Superpower Copilot: ${agentFiles.length} agents activated.`);
    }
    catch (err) {
        vscode.window.showErrorMessage(`Superpower Copilot: Failed to register agents — ${err}`);
    }
}
async function forceRegisterAgentsPath() {
    const config = vscode.workspace.getConfiguration();
    const current = config.get(SETTING_KEY) || {};
    // Always set — even if key exists, force it to true
    await config.update(SETTING_KEY, { ...current, [GLOBAL_AGENTS_DIR]: true }, vscode.ConfigurationTarget.Global);
}
// DO NOT clean up files or settings in deactivate().
// VS Code calls deactivate() on extension UPDATE before the new version activates,
// which would delete agent files and break registration.
// Cleanup only happens via vscode:uninstall script (src/uninstall.ts).
function deactivate() { }
//# sourceMappingURL=extension.js.map