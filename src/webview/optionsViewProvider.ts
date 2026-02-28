import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { getWebviewContent } from './getWebviewContent';
import type {
  OptionsInput,
  OptionsResult,
  OptionsRequest,
  ToWebviewMessage,
  FromWebviewMessage,
} from './types';

interface PendingRequest {
  resolve: (result: OptionsResult) => void;
  input: OptionsInput;
}

export class OptionsViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'superpower-copilot.optionsView';

  private _view?: vscode.WebviewView;
  private _webviewReady = false;
  private _pendingRequests = new Map<string, PendingRequest>();
  private _requestQueue: OptionsRequest[] = [];
  private _pendingMessages: ToWebviewMessage[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  // ── WebviewViewProvider ──────────────────────────────────

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    this._webviewReady = false;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const nonce = crypto.randomBytes(16).toString('hex');
    webviewView.webview.html = getWebviewContent(nonce);

    webviewView.webview.onDidReceiveMessage(
      (msg: FromWebviewMessage) => this._handleWebviewMessage(msg)
    );

    webviewView.onDidDispose(() => {
      this._view = undefined;
      this._webviewReady = false;
    });
  }

  // ── Public API ──────────────────────────────────────────

  get isAvailable(): boolean {
    return !!this._view;
  }

  waitForUserResponse(
    input: OptionsInput,
    token: vscode.CancellationToken
  ): Promise<OptionsResult> {
    const requestId = crypto.randomUUID();

    return new Promise<OptionsResult>((resolve) => {
      this._pendingRequests.set(requestId, { resolve, input });

      const request: OptionsRequest = { requestId, input };
      this._requestQueue.push(request);

      // Show sidebar
      this._view?.show?.(true);

      this._postMessage({ type: 'showRequest', request });

      // Cancellation handling
      token.onCancellationRequested(() => {
        if (this._pendingRequests.has(requestId)) {
          this._pendingRequests.delete(requestId);
          this._requestQueue = this._requestQueue.filter(
            (r) => r.requestId !== requestId
          );
          this._postMessage({ type: 'cancelRequest', requestId });
          resolve({ cancelled: true, selected: [] });
        }
      });
    });
  }

  clearAll(): void {
    for (const [, pending] of this._pendingRequests) {
      pending.resolve({ cancelled: true, selected: [] });
    }
    this._pendingRequests.clear();
    this._requestQueue = [];
    this._postMessage({ type: 'clearAll' });
  }

  // ── Message handling ────────────────────────────────────

  private _handleWebviewMessage(msg: FromWebviewMessage): void {
    switch (msg.type) {
      case 'ready':
        this._webviewReady = true;
        this._flushPendingMessages();
        break;

      case 'selectOption': {
        const pending = this._pendingRequests.get(msg.requestId);
        if (pending) {
          this._pendingRequests.delete(msg.requestId);
          this._requestQueue = this._requestQueue.filter(
            (r) => r.requestId !== msg.requestId
          );
          pending.resolve({ cancelled: false, selected: msg.selected });
        }
        break;
      }

      case 'submitFreeText': {
        const pending = this._pendingRequests.get(msg.requestId);
        if (pending) {
          this._pendingRequests.delete(msg.requestId);
          this._requestQueue = this._requestQueue.filter(
            (r) => r.requestId !== msg.requestId
          );
          pending.resolve({
            cancelled: false,
            selected: msg.selected,
            freeText: msg.text,
          });
        }
        break;
      }

      case 'cancel': {
        const pending = this._pendingRequests.get(msg.requestId);
        if (pending) {
          this._pendingRequests.delete(msg.requestId);
          this._requestQueue = this._requestQueue.filter(
            (r) => r.requestId !== msg.requestId
          );
          pending.resolve({ cancelled: true, selected: [] });
        }
        break;
      }
    }
  }

  // ── Internal helpers ────────────────────────────────────

  private _postMessage(msg: ToWebviewMessage): void {
    if (!this._view || !this._webviewReady) {
      this._pendingMessages.push(msg);
      return;
    }
    this._view.webview.postMessage(msg);
  }

  private _flushPendingMessages(): void {
    for (const msg of this._pendingMessages) {
      this._view?.webview.postMessage(msg);
    }
    this._pendingMessages = [];
  }
}
