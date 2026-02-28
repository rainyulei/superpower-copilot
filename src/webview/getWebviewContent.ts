export function getWebviewContent(nonce: string): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <style nonce="${nonce}">
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background, var(--vscode-editor-background));
      padding: 12px;
    }

    /* ── Empty state ── */
    #empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80vh;
      opacity: 0.5;
      text-align: center;
      font-style: italic;
    }

    /* ── Request card ── */
    .request-card { margin-bottom: 16px; }
    .request-title {
      font-weight: 600;
      font-size: 1.05em;
      margin-bottom: 10px;
      line-height: 1.35;
    }

    /* ── Group heading ── */
    .group-heading {
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
      margin: 10px 0 4px;
    }

    /* ── Option button ── */
    .option-btn {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 8px 12px;
      margin: 4px 0;
      border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder, transparent));
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground, var(--vscode-input-background));
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: inherit;
      transition: background 0.1s;
    }
    .option-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground));
    }
    .option-btn.selected {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-focusBorder);
    }
    .option-btn .label { font-weight: 500; }
    .option-btn .desc {
      font-size: 0.88em;
      opacity: 0.75;
      margin-top: 2px;
    }

    /* ── Free text ── */
    .free-text-area {
      width: 100%;
      margin-top: 8px;
      padding: 6px 8px;
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: inherit;
      font-size: inherit;
      resize: vertical;
      min-height: 60px;
    }
    .free-text-area:focus { outline: 1px solid var(--vscode-focusBorder); }

    /* ── Action buttons row ── */
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .action-btn {
      flex: 1;
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
    }
    .btn-confirm {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-confirm:hover { background: var(--vscode-button-hoverBackground); }
    .btn-confirm:disabled { opacity: 0.5; cursor: default; }
    .btn-cancel {
      background: var(--vscode-button-secondaryBackground, var(--vscode-input-background));
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    }
    .btn-cancel:hover {
      background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground));
    }
  </style>
</head>
<body>
  <div id="empty-state">Waiting for agent questions...</div>
  <div id="requests"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    /** @type {Map<string, {input: any, selectedSet: Set<string>}>} */
    const activeRequests = new Map();

    // ── Render helpers ────────────────────────────────────────

    function renderRequest(request) {
      const { requestId, input } = request;
      const { title, options, mode = 'single', allowFreeText, freeTextPlaceholder } = input;

      const card = document.createElement('div');
      card.className = 'request-card';
      card.dataset.requestId = requestId;

      // Title
      const h = document.createElement('div');
      h.className = 'request-title';
      h.textContent = title;
      card.appendChild(h);

      // Group options
      const groups = new Map();
      for (const opt of options) {
        const g = opt.group || '';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(opt);
      }

      const selectedSet = new Set();
      activeRequests.set(requestId, { input, selectedSet });

      for (const [groupName, items] of groups) {
        if (groupName) {
          const gh = document.createElement('div');
          gh.className = 'group-heading';
          gh.textContent = groupName;
          card.appendChild(gh);
        }
        for (const opt of items) {
          const btn = document.createElement('button');
          btn.className = 'option-btn';
          btn.dataset.label = opt.label;
          const lbl = document.createElement('span');
          lbl.className = 'label';
          lbl.textContent = opt.label;
          btn.appendChild(lbl);
          if (opt.description) {
            const desc = document.createElement('span');
            desc.className = 'desc';
            desc.textContent = opt.description;
            btn.appendChild(desc);
          }
          btn.addEventListener('click', () => onOptionClick(requestId, btn, mode));
          card.appendChild(btn);
        }
      }

      // Free text
      if (allowFreeText) {
        const ta = document.createElement('textarea');
        ta.className = 'free-text-area';
        ta.placeholder = freeTextPlaceholder || 'Type additional input...';
        ta.dataset.requestId = requestId;
        card.appendChild(ta);
      }

      // Action buttons
      const actions = document.createElement('div');
      actions.className = 'actions';

      if (mode === 'multi' || allowFreeText) {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'action-btn btn-confirm';
        confirmBtn.textContent = 'Confirm';
        confirmBtn.dataset.requestId = requestId;
        if (mode === 'multi' && !allowFreeText) confirmBtn.disabled = true;
        confirmBtn.addEventListener('click', () => onConfirm(requestId));
        actions.appendChild(confirmBtn);
      }

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'action-btn btn-cancel';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'cancel', requestId });
        removeCard(requestId);
      });
      actions.appendChild(cancelBtn);

      card.appendChild(actions);

      document.getElementById('requests').appendChild(card);
      document.getElementById('empty-state').style.display = 'none';
    }

    function onOptionClick(requestId, btn, mode) {
      const entry = activeRequests.get(requestId);
      if (!entry) return;

      if (mode === 'single') {
        // Immediate submit
        vscode.postMessage({
          type: 'selectOption',
          requestId,
          selected: [btn.dataset.label]
        });
        removeCard(requestId);
        return;
      }

      // Multi-select toggle
      const label = btn.dataset.label;
      if (entry.selectedSet.has(label)) {
        entry.selectedSet.delete(label);
        btn.classList.remove('selected');
      } else {
        entry.selectedSet.add(label);
        btn.classList.add('selected');
      }

      // Enable/disable confirm
      const card = btn.closest('.request-card');
      const confirmBtn = card.querySelector('.btn-confirm');
      if (confirmBtn) {
        const hasText = card.querySelector('.free-text-area')?.value?.trim();
        confirmBtn.disabled = entry.selectedSet.size === 0 && !hasText;
      }
    }

    function onConfirm(requestId) {
      const entry = activeRequests.get(requestId);
      if (!entry) return;
      const card = document.querySelector('[data-request-id="' + requestId + '"]');
      const ta = card?.querySelector('.free-text-area');
      const text = ta?.value?.trim() || '';
      const selected = [...entry.selectedSet];

      if (text) {
        vscode.postMessage({ type: 'submitFreeText', requestId, text, selected });
      } else {
        vscode.postMessage({ type: 'selectOption', requestId, selected });
      }
      removeCard(requestId);
    }

    function removeCard(requestId) {
      activeRequests.delete(requestId);
      const card = document.querySelector('[data-request-id="' + requestId + '"]');
      if (card) card.remove();
      if (activeRequests.size === 0) {
        document.getElementById('empty-state').style.display = '';
      }
    }

    // ── Message handler ───────────────────────────────────────

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'showRequest':
          renderRequest(msg.request);
          break;
        case 'cancelRequest':
          removeCard(msg.requestId);
          break;
        case 'clearAll':
          document.getElementById('requests').innerHTML = '';
          activeRequests.clear();
          document.getElementById('empty-state').style.display = '';
          break;
      }
    });

    // Signal ready
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}
