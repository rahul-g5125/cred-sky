import { el } from './dom.js';
import { formatBytes } from './format.js';

const state = {
  formatted: '',
  raw: '',
  label: '',
  activeTab: 'formatted',
  copyTimer: null,
  copyFeedbackTimer: null,
};

const JSON_TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function highlightJson(json) {
  return escapeHtml(json).replace(JSON_TOKEN, (match, stringToken, colon, booleanToken, numberToken) => {
    if (stringToken !== undefined) {
      if (colon) return `<span class="json-key">${stringToken}</span>${colon}`;
      return `<span class="json-string">${stringToken}</span>`;
    }

    if (booleanToken !== undefined) {
      const className = booleanToken === 'null' ? 'json-null' : 'json-boolean';
      return `<span class="${className}">${booleanToken}</span>`;
    }

    return `<span class="json-number">${numberToken}</span>`;
  });
}

function getActiveText() {
  return state.activeTab === 'formatted' ? state.formatted : state.raw;
}

function getActiveLabel() {
  return state.activeTab === 'formatted' ? 'Formatted' : 'Raw';
}

function updateTabs() {
  const isFormatted = state.activeTab === 'formatted';

  el.tabFormatted.classList.toggle('is-active', isFormatted);
  el.tabRaw.classList.toggle('is-active', !isFormatted);
  el.tabFormatted.setAttribute('aria-selected', String(isFormatted));
  el.tabRaw.setAttribute('aria-selected', String(!isFormatted));
  el.tabFormatted.tabIndex = isFormatted ? 0 : -1;
  el.tabRaw.tabIndex = isFormatted ? -1 : 0;
  el.jsonOutput.setAttribute('aria-labelledby', isFormatted ? 'tab-formatted' : 'tab-raw');
}

function updateMeta() {
  const text = getActiveText();
  const byteLength = new TextEncoder().encode(text).length;
  const lines = text ? text.split('\n').length : 0;
  const parts = [];

  if (state.label) parts.push(state.label);
  parts.push(getActiveLabel());
  parts.push(formatBytes(byteLength));
  parts.push(`${lines} ${lines === 1 ? 'line' : 'lines'}`);

  el.jsonMeta.textContent = parts.join(' · ');
}

function render() {
  updateTabs();
  updateMeta();

  const text = getActiveText();
  el.copyBtn.disabled = !text;

  if (!text) {
    el.jsonCode.textContent = '// No API response is available yet.';
    return;
  }

  if (state.activeTab === 'formatted') {
    el.jsonCode.innerHTML = highlightJson(state.formatted);
  } else {
    el.jsonCode.textContent = state.raw;
  }
}

function setTab(tab, { focus = false } = {}) {
  if (!['formatted', 'raw'].includes(tab) || tab === state.activeTab) {
    if (focus) {
      (tab === 'raw' ? el.tabRaw : el.tabFormatted).focus();
    }
    return;
  }

  state.activeTab = tab;
  render();
  el.jsonOutput.scrollTop = 0;

  if (focus) {
    (tab === 'raw' ? el.tabRaw : el.tabFormatted).focus();
  }
}

function handleTabKeydown(event) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(event.key)) return;

  event.preventDefault();

  if (event.key === 'Home') setTab('formatted', { focus: true });
  else if (event.key === 'End') setTab('raw', { focus: true });
  else setTab(state.activeTab === 'formatted' ? 'raw' : 'formatted', { focus: true });
}

function copyWithSelection(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) throw new Error('Copy command failed.');
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Clipboard permissions can be denied (or the page unfocused). Fall back
      // to the selection-based API so copying still works for the user.
    }
  }

  copyWithSelection(text);
}

function resetCopyFeedback() {
  el.copyBtn.classList.remove('is-copied', 'is-copy-error');
  el.copyLabel.textContent = 'Copy';
  if (el.copyIcon) el.copyIcon.hidden = false;
  if (el.copyCheck) el.copyCheck.hidden = true;
}

function showCopyFeedback(success, message) {
  window.clearTimeout(state.copyFeedbackTimer);
  resetCopyFeedback();

  el.copyBtn.classList.add(success ? 'is-copied' : 'is-copy-error');
  el.copyLabel.textContent = success ? 'Copied' : 'Copy failed';
  if (el.copyIcon) el.copyIcon.hidden = success;
  if (el.copyCheck) el.copyCheck.hidden = !success;
  el.copyStatus.textContent = message;

  state.copyFeedbackTimer = window.setTimeout(resetCopyFeedback, 2200);
}

async function handleCopy() {
  const text = getActiveText();
  if (!text) return;

  try {
    await copyToClipboard(text);
    showCopyFeedback(true, `${getActiveLabel()} JSON copied to the clipboard.`);
  } catch {
    showCopyFeedback(false, 'Copy failed. Select the JSON and copy it manually.');
  }
}

export function initJsonViewer() {
  el.tabFormatted.addEventListener('click', () => setTab('formatted'));
  el.tabRaw.addEventListener('click', () => setTab('raw'));
  el.tabFormatted.addEventListener('keydown', handleTabKeydown);
  el.tabRaw.addEventListener('keydown', handleTabKeydown);
  el.copyBtn.addEventListener('click', handleCopy);

  // Keep the copy indicator accurate if the tab changes mid-feedback.
  window.clearTimeout(state.copyTimer);
}

export function setJsonResponse({ data, raw, label }) {
  state.formatted = JSON.stringify(data, null, 2);
  state.raw = raw ?? '';
  state.label = label ?? '';
  window.clearTimeout(state.copyFeedbackTimer);
  resetCopyFeedback();
  render();
  el.jsonOutput.scrollTop = 0;
}

export function setJsonError({ data, raw, label }) {
  if (data) {
    state.formatted = JSON.stringify(data, null, 2);
    state.raw = raw ?? state.formatted;
  } else if (raw) {
    state.formatted = raw;
    state.raw = raw;
  } else {
    resetJson('No API response was received.');
    return;
  }

  state.label = label ?? 'Error response';
  window.clearTimeout(state.copyFeedbackTimer);
  resetCopyFeedback();
  render();
  el.jsonOutput.scrollTop = 0;
}

export function resetJson(message = 'Waiting for the first response…') {
  state.formatted = '';
  state.raw = '';
  state.label = '';
  window.clearTimeout(state.copyFeedbackTimer);
  resetCopyFeedback();
  el.copyBtn.disabled = true;
  el.jsonMeta.textContent = message;
  el.jsonCode.textContent = `// ${message}`;
}
