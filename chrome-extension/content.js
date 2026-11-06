const selectors = {
  email: [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]',
    'input[autocomplete="email"]',
    'input[placeholder*="email" i]',
    'input[aria-label*="email" i]',
  ],
  username: [
    'input[name*="username" i]',
    'input[id*="username" i]',
    'input[autocomplete="username"]',
    'input[name*="user" i]',
    'input[id*="user" i]',
    'input[name*="login" i]',
    'input[id*="login" i]',
    'input[autocomplete="login"]',
    'input[placeholder*="username" i]',
    'input[placeholder*="user" i]',
    'input[placeholder*="login" i]',
    'input[aria-label*="username" i]',
    'input[aria-label*="user" i]',
    'input[aria-label*="login" i]',
  ],
  password: [
    'input[type="password"]',
    'input[name*="password" i]',
    'input[id*="password" i]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
    'input[autocomplete="one-time-code"]',
    'input[placeholder*="password" i]',
    'input[placeholder*="mot de passe" i]',
    'input[aria-label*="password" i]',
    'input[aria-label*="mot de passe" i]',
  ],
};

function isUsableField(field) {
  if (!(field instanceof HTMLElement)) return false;
  if (field.disabled || field.readOnly) return false;

  const tag = field.tagName.toLowerCase();
  if (!['input', 'textarea'].includes(tag)) return false;

  const style = window.getComputedStyle(field);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  const rect = field.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && !field.offsetParent) {
    return false;
  }

  return true;
}

function findField(selectorList) {
  for (const selector of selectorList) {
    const elements = Array.from(document.querySelectorAll(selector));
    const usable = elements.filter(isUsableField);
    if (usable.length > 0) return usable[0];
  }
  return null;
}

function fallbackUsernameField() {
  const candidates = Array.from(document.querySelectorAll(
    'input:not([type="hidden"]):not([type="password"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="email"]):not([type="number"]):not([type="tel"])'
  ));

  const usable = candidates.filter((field) => {
    if (!isUsableField(field)) return false;
    const name = (field.name || field.id || field.placeholder || field.ariaLabel || '').toLowerCase();
    return !name.includes('search') && !name.includes('confirm') && !name.includes('code');
  });

  return usable[0] || null;
}

function writeFieldValue(field, value) {
  if (!field || !value) return;

  field.focus();
  field.value = value;
  field.setAttribute('value', value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new Event('keyup', { bubbles: true }));
}

function collectPageData() {
  const fields = {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    email: findField(selectors.email)?.value || '',
    username: findField(selectors.username)?.value || '',
    password: findField(selectors.password)?.value || '',
  }
  return fields
}

function applyAutofill(payload) {
  const usernameValue = payload.username || payload.email || payload.login || '';
  const passwordValue = payload.password || '';

  const usernameField = findField(selectors.username) || findField(selectors.email) || fallbackUsernameField();
  const passwordField = findField(selectors.password);

  if (usernameField && usernameValue) {
    writeFieldValue(usernameField, usernameValue);
  }

  if (passwordField && passwordValue) {
    writeFieldValue(passwordField, passwordValue);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'nexvault:fill') {
    const usernameField = findField(selectors.username) || findField(selectors.email) || fallbackUsernameField();
    const passwordField = findField(selectors.password);

    if (usernameField) {
      usernameField.focus();
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (passwordField) {
      passwordField.focus();
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    sendResponse({ ok: true, hasUsername: !!usernameField, hasPassword: !!passwordField });
  }

  if (message.type === 'page:extract') {
    const data = collectPageData();
    sendResponse({ ok: true, data });
  }

  if (message.type === 'vault:autofill') {
    const credentials = message.payload || {};
    applyAutofill(credentials);
    sendResponse({ ok: true });
  }

  return true
})

document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ type: 'page:extract', data: collectPageData() })
})

const INLINE_MENU_ID = 'nexvault-inline-menu';

function removeInlineMenu() {
  const menu = document.getElementById(INLINE_MENU_ID);
  if (menu) menu.remove();
}

function buildInlineMenu(accounts) {
  removeInlineMenu();

  const menu = document.createElement('div');
  menu.id = INLINE_MENU_ID;
  menu.style.position = 'fixed';
  menu.style.zIndex = '2147483647';
  menu.style.right = '18px';
  menu.style.top = '18px';
  menu.style.background = 'rgba(15, 23, 42, 0.97)';
  menu.style.border = '1px solid rgba(148, 163, 184, 0.2)';
  menu.style.borderRadius = '14px';
  menu.style.boxShadow = '0 16px 40px rgba(15, 23, 42, 0.45)';
  menu.style.minWidth = '280px';
  menu.style.maxWidth = '320px';
  menu.style.padding = '12px';
  menu.style.color = '#e2e8f0';
  menu.style.fontFamily = 'Inter, system-ui, sans-serif';
  menu.style.fontSize = '12px';
  menu.style.backdropFilter = 'blur(12px)';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '8px';

  const brand = document.createElement('div');
  brand.textContent = 'NEXVAULT';
  brand.style.color = '#22d3ee';
  brand.style.fontWeight = '700';
  brand.style.fontSize = '11px';
  brand.style.letterSpacing = '0.12em';

  const close = document.createElement('button');
  close.textContent = '✕';
  close.type = 'button';
  close.style.border = 'none';
  close.style.background = 'transparent';
  close.style.color = '#cbd5e1';
  close.style.cursor = 'pointer';
  close.onclick = removeInlineMenu;

  header.appendChild(brand);
  header.appendChild(close);
  menu.appendChild(header);

  accounts.forEach((account) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.style.width = '100%';
    item.style.background = 'rgba(15, 23, 42, 0.9)';
    item.style.color = '#e2e8f0';
    item.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    item.style.borderRadius = '10px';
    item.style.padding = '10px 12px';
    item.style.marginBottom = '8px';
    item.style.cursor = 'pointer';
    item.style.textAlign = 'left';
    item.style.display = 'block';

    const title = document.createElement('div');
    title.textContent = account.title || 'Compte';
    title.style.fontWeight = '700';
    title.style.marginBottom = '4px';

    const usernameRow = document.createElement('div');
    usernameRow.textContent = account.username || '—';
    usernameRow.style.color = '#94a3b8';
    usernameRow.style.fontSize = '11px';

    item.appendChild(title);
    item.appendChild(usernameRow);

    item.addEventListener('click', () => {
      applyAutofill({ username: account.username || '', password: account.password || '' });
      removeInlineMenu();
    });

    menu.appendChild(item);
  });

  document.body.appendChild(menu);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') removeInlineMenu();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'nexvault:menu') {
    buildInlineMenu(message.payload || []);
    sendResponse({ ok: true });
  }

  return true;
});
