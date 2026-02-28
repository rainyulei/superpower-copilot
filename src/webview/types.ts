// ── Option item ──────────────────────────────────────────────

export interface OptionItem {
  label: string;
  description?: string;
  group?: string;
}

// ── Tool input / output ──────────────────────────────────────

export interface OptionsInput {
  title: string;
  options: OptionItem[];
  mode?: 'single' | 'multi';
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
}

export interface OptionsResult {
  cancelled: boolean;
  selected: string[];
  freeText?: string;
}

// ── Internal request object (stored in provider) ─────────────

export interface OptionsRequest {
  requestId: string;
  input: OptionsInput;
}

// ── Extension → Webview messages ─────────────────────────────

export type ToWebviewMessage =
  | { type: 'showRequest'; request: OptionsRequest }
  | { type: 'cancelRequest'; requestId: string }
  | { type: 'clearAll' };

// ── Webview → Extension messages ─────────────────────────────

export type FromWebviewMessage =
  | { type: 'selectOption'; requestId: string; selected: string[] }
  | { type: 'submitFreeText'; requestId: string; text: string; selected: string[] }
  | { type: 'cancel'; requestId: string }
  | { type: 'ready' };
