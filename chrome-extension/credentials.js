(() => {
  function formatTitleFromDomain(domain) {
    if (!domain) return 'Saved login';
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Saved login';
  }

  async function readVaultCandidates() {
    const { token, apiUrl } = await chrome.storage.local.get(['token', 'apiUrl']);
    const base = (apiUrl || 'http://10.238.110.246:8000').replace(/\/$/, '');

    const response = await fetch(`${base}/api/v1/vault/items`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Unable to load vault items');
    }

    const payload = await response.json();
    return payload?.data || [];
  }

  async function saveCurrentPageAsVault() {
    const { token, apiUrl, pageData } = await chrome.storage.local.get(['token', 'apiUrl', 'pageData']);
    if (!token) {
      return { ok: false, error: 'No JWT token' };
    }

    const currentUrl = pageData?.url || window.location.href;
    const username = pageData?.username || pageData?.email || '';
    const password = pageData?.password || '';

    const encrypted = await window.NexvaultCrypto.encryptVaultPayload(
      {
        username,
        password,
        url: currentUrl,
      },
      'default-master-password',
    );

    const response = await fetch(`${(apiUrl || 'http://10.238.110.246:8000').replace(/\/$/, '')}/api/v1/vault/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: formatTitleFromDomain(new URL(currentUrl).hostname),
        kind: 'login',
        favorite: true,
        encrypted_payload: encrypted,
      }),
    });

    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  }

  window.NexvaultCredentials = {
    readVaultCandidates,
    saveCurrentPageAsVault,
    formatTitleFromDomain,
  };
})();
