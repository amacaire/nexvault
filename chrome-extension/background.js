chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'page:extract') {
    chrome.storage.local.set({ pageData: message.data }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'vault:save') {
    chrome.storage.local.get(['token', 'apiUrl'], async (result) => {
      const token = result.token;
      const apiUrl = result.apiUrl || 'http://10.238.110.246:8000';
      const payload = message.payload || {};

      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/vault/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: payload.title || payload.domain || 'Saved from browser',
            kind: 'login',
            favorite: true,
            encrypted_payload: payload.encryptedPayload || {
              version: 1,
              salt: '',
              iv: '',
              ciphertext: '',
            },
          }),
        });

        const resultBody = await response.text();
        sendResponse({
          ok: response.ok,
          status: response.status,
          body: resultBody,
        });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || 'Request failed' });
      }
    });
    return true;
  }

  return false;
});
