const DEFAULT_API = 'http://10.238.110.246:8000';

async function readConfig() {
  const result = await chrome.storage.local.get(['apiUrl', 'token', 'currentPage']);
  return {
    apiUrl: result.apiUrl || DEFAULT_API,
    token: result.token || '',
    currentPage: result.currentPage || '',
  };
}

async function callVaultApi(endpoint, options = {}) {
  const { apiUrl, token } = await readConfig();
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { ok: response.ok, status: response.status, data: body };
}

async function loginWithCredentials(email, password) {
  const result = await callVaultApi('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!result.ok) {
    return { ok: false, error: result.data?.message || 'login_failed' };
  }

  const token = result.data?.token;
  const user = result.data?.user;

  if (!token || !user) {
    return { ok: false, error: 'token_missing' };
  }

  await chrome.storage.local.set({ token, user, apiUrl: result.data?.apiUrl || DEFAULT_API });
  return { ok: true, token, user };
}

async function loadVaultItems() {
  const result = await callVaultApi('/api/v1/vault/items', { method: 'GET' });
  return result;
}

async function saveVaultItem(payload) {
  const result = await callVaultApi('/api/v1/vault/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result;
}

window.nexvaultBridge = {
  loginWithCredentials,
  loadVaultItems,
  saveVaultItem,
  readConfig,
};
