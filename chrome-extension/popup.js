const apiUrlInput = document.getElementById('apiUrl');
const tokenInput = document.getElementById('token');
const statusBox = document.getElementById('status');
const pageTitle = document.getElementById('pageTitle');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const DEFAULT_API = 'http://10.238.110.246:8000';

const loginView = document.getElementById('loginView');
const vaultView = document.getElementById('vaultView');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const loginStatus = document.getElementById('loginStatus');
const vaultStatus = document.getElementById('vaultStatus');
const credentialList = document.getElementById('credentialList');
const addCredentialButton = document.getElementById('addCredentialButton');
const cancelAddButton = document.getElementById('cancelAddButton');
const newCredentialForm = document.getElementById('newCredentialForm');
const newTitleInput = document.getElementById('newTitle');
const newLoginInput = document.getElementById('newLogin');
const newPasswordInput = document.getElementById('newPassword');
const newUrlInput = document.getElementById('newUrl');
const newNotesInput = document.getElementById('newNotes');
const logoutButton = document.getElementById('logoutButton');
const capturePageButton = document.getElementById('capturePageButton');
const currentSiteBlock = document.getElementById('currentSiteBlock');
const currentSiteName = document.getElementById('currentSiteName');
const saveCurrentPageButton = document.getElementById('saveCurrentPageButton');
const autofillCurrentPageButton = document.getElementById('autofillCurrentPageButton');

const setStatus = (message, tone = 'success') => {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.style.color = tone === 'error' ? '#f87171' : '#34d399';
};

const setLoginMessage = (message, kind = 'error') => {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.className = `status ${kind === 'error' ? 'error' : 'success'}`;
};

const setVaultMessage = (message, kind = 'success') => {
  if (!vaultStatus) return;
  vaultStatus.textContent = message;
  vaultStatus.className = `status ${kind === 'error' ? 'error' : 'success'}`;
};

const withPasswordKey = async () => {
  const { password } = await chrome.storage.local.get(['password']);
  return password || 'default-master-password';
};

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
};

const updateCurrentSite = async () => {
  const tab = await getCurrentTab();
  const siteName = tab?.title || tab?.url || 'Aucune page active';
  if (currentSiteName) currentSiteName.textContent = siteName;
  if (currentSiteBlock) currentSiteBlock.classList.remove('hidden');
};

const saveCurrentPage = async () => {
  const tab = await getCurrentTab();
  if (!tab || !tab.id) {
    setVaultMessage('Aucune page active', 'error');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'page:extract' }, async (response) => {
    if (!response?.ok || !response.data) {
      setVaultMessage('Impossible de lire la page active', 'error');
      return;
    }

    const data = response.data;
    const { token, password } = await chrome.storage.local.get(['token', 'password']);
    if (!token) {
      setVaultMessage('Connecte-toi avant d’ajouter depuis la page', 'error');
      return;
    }

    const masterPassword = password || 'default-master-password';
    const encrypted = await window.NexvaultCrypto.encryptVaultPayload(
      {
        site: data.domain || data.title || 'Page active',
        login: data.username || data.email || '',
        password: data.password || '',
        url: data.url || '',
        notes: `Import depuis la page active`,
      },
      masterPassword,
    );

    const saveResponse = await fetch(`${DEFAULT_API.replace(/\/$/, '')}/api/v1/vault/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.domain || data.title || 'Page active',
        kind: 'login',
        favorite: true,
        encrypted_payload: encrypted,
        site: data.domain || data.title || 'Page active',
        login: data.username || data.email || '',
        password: data.password || '',
        url: data.url || '',
        notes: 'Import depuis la page active',
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      throw new Error(`Enregistrement impossible: ${errorText}`);
    }

    setVaultMessage('Identifiant ajouté depuis la page active');
    await loadVault();
  });
};

const autofillCurrentPage = async () => {
  const tab = await getCurrentTab();
  if (!tab || !tab.id) {
    setVaultMessage('Aucune page active', 'error');
    return;
  }

  const { token } = await chrome.storage.local.get(['token']);
  if (!token) {
    setVaultMessage('Connecte-toi avant le remplissage', 'error');
    return;
  }

  const response = await fetch(`${DEFAULT_API.replace(/\/$/, '')}/api/v1/vault/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    setVaultMessage('Impossible de lire le vault', 'error');
    return;
  }

  const payload = await response.json();
  const items = payload.data || [];
  const domainMatch = new URL(tab.url || 'https://example.com').hostname;
  const match = items.find((item) => (item.title || '').toLowerCase().includes(domainMatch.toLowerCase())) || items[0];

  if (!match) {
    setVaultMessage('Aucun identifiant pour cette page', 'error');
    return;
  }

  const master = await withPasswordKey();
  const plain = await window.NexvaultCrypto.decryptVaultPayload(match.encrypted_payload, master);
  const parsed = JSON.parse(plain);

  chrome.tabs.sendMessage(tab.id, {
    type: 'vault:autofill',
    payload: {
      username: parsed.login || parsed.username || '',
      password: parsed.password || '',
    },
  }, () => {
    setVaultMessage('Formulaire rempli automatiquement');
  });
};

const renderCredentials = (items = []) => {
  if (!credentialList && !items.length) return;

  if (!items.length) {
    credentialList.innerHTML = `
      <div class="credential-item empty-item">
        <div class="credential-main">
          <div class="credential-name">Aucun identifiant</div>
          <div class="credential-meta">Ajoutez votre premier mot de passe</div>
        </div>
      </div>
    `;
    return;
  }

  credentialList.innerHTML = items
    .map((item) => {
      const site = item.site || item.title || 'Identifiant';
      const login = item.login || item.username || '—';
      const url = item.url || '';
      const notes = item.notes || '';
      const domainText = url ? `<div class="credential-url">${url}</div>` : '';
      const notesText = notes ? `<div class="credential-notes">${notes}</div>` : '';

      return `
        <div class="credential-item">
          <div class="credential-main">
            <div class="credential-name">${site}</div>
            <div class="credential-meta">${login}</div>
            ${domainText}
            ${notesText}
          </div>
          <div class="credential-actions">
            <button class="small-btn" type="button" data-action="open" data-id="${item.id}" data-url="${url}">Ouvrir</button>
            <button class="small-btn" type="button" data-action="copy" data-id="${item.id}">Copier</button>
            <button class="small-btn danger-btn" type="button" data-action="delete" data-id="${item.id}">Supprimer</button>
          </div>
        </div>
      `;
    })
    .join('');

  credentialList.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.getAttribute('data-action');
    const itemId = button.getAttribute('data-id');

    button.addEventListener('click', async () => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return;

      if (action === 'open') {
        const rawTargetUrl = button.getAttribute('data-url') || item.url || '';

        try {
          const parsed = await decryptItemPayload(item);
          const resolvedUrl = normalizeTabUrl(
            parsed.url || parsed.website || parsed.site || parsed.domain || rawTargetUrl || item.site || item.title || ''
          );

          const newTab = await chrome.tabs.create({ url: resolvedUrl, active: true });

          if (newTab?.id) {
            setTimeout(() => {
              fillTabCredentials(newTab.id, {
                username: parsed.login || parsed.username || parsed.email || '',
                password: parsed.password || '',
              });
            }, 1200);
          }

          setVaultMessage('Ouverture du site et remplissage automatique');
        } catch (error) {
          setVaultMessage('Impossible d’ouvrir ce site', 'error');
        }
        return;
      }

      if (action === 'copy') {
        try {
          const masterPassword = await withPasswordKey();
          const plain = await window.NexvaultCrypto.decryptVaultPayload(item.encrypted_payload, masterPassword);
          const parsed = JSON.parse(plain);
          await navigator.clipboard.writeText(parsed.password || parsed.username || parsed.login || '');
          setVaultMessage('Mot de passe copié');
        } catch (error) {
          setVaultMessage('Impossible de déchiffrer cet élément', 'error');
        }
        return;
      }

      if (action === 'delete') {
        try {
          const { token } = await chrome.storage.local.get(['token']);
          const response = await fetch(`${DEFAULT_API.replace(/\/$/, '')}/api/v1/vault/items/${itemId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Suppression impossible');
          setVaultMessage('Identifiant supprimé');
          await loadVault();
        } catch (error) {
          setVaultMessage(error.message || 'Erreur de suppression', 'error');
        }
      }
    });
  });
};

const loadVault = async () => {
  const { token, apiUrl } = await chrome.storage.local.get(['token', 'apiUrl']);
  if (!token) {
    showLogin();
    return;
  }

  try {
    const baseUrl = (apiUrl || DEFAULT_API).replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/v1/vault/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Impossible de charger les identifiants');

    const payload = await response.json();
    const tab = await getCurrentTab();
    const currentUrl = tab?.url || '';
    const matchedItems = getMatchingVaultItems(payload.data || [], currentUrl);
    renderCredentials(matchedItems.length ? matchedItems : payload.data || []);
    showVault();
    await updateCurrentSite();

    if (tab?.id && matchedItems.length) {
      await showInlineMenuForTab(tab.id, matchedItems);
    }
  } catch (error) {
    setVaultMessage(error.message || 'Erreur vault', 'error');
    showVault();
  }
};

const showLogin = () => {
  if (loginView) loginView.classList.add('active');
  if (vaultView) vaultView.classList.remove('active');
};

const showVault = () => {
  if (loginView) loginView.classList.remove('active');
  if (vaultView) vaultView.classList.add('active');
};

const login = async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setLoginMessage('Saisis un email et un mot de passe', 'error');
    return;
  }

  try {
    const response = await fetch(`${DEFAULT_API.replace(/\/$/, '')}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Connexion refusée');

    await chrome.storage.local.set({ token: payload.token, email, password, apiUrl: DEFAULT_API });
    setLoginMessage('Connexion réussie', 'success');
    await loadVault();
  } catch (error) {
    setLoginMessage(error.message || 'Erreur de connexion', 'error');
  }
};

const logout = async () => {
  await chrome.storage.local.remove(['token', 'email', 'password', 'apiUrl']);
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  setLoginMessage('');
  setVaultMessage('');
  if (currentSiteBlock) currentSiteBlock.classList.add('hidden');
  showLogin();
};

const saveNewCredential = async (event) => {
  event.preventDefault();
  const { token, password } = await chrome.storage.local.get(['token', 'password']);
  if (!token) {
    setVaultMessage('Connecte-toi avant d’enregistrer', 'error');
    return;
  }

  const site = newTitleInput.value.trim();
  const login = newLoginInput.value.trim();
  const secretPassword = newPasswordInput.value.trim();
  const url = newUrlInput.value.trim();
  const notes = newNotesInput.value.trim();

  if (!site || !login || !secretPassword) {
    setVaultMessage('Le site, le login et le mot de passe sont requis', 'error');
    return;
  }

  try {
    const master = password || 'default-master-password';
    const encryptedPayload = await window.NexvaultCrypto.encryptVaultPayload(
      { site, login, password: secretPassword, url, notes },
      master,
    );

    const response = await fetch(`${DEFAULT_API.replace(/\/$/, '')}/api/v1/vault/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: site,
        kind: 'login',
        favorite: true,
        encrypted_payload: encryptedPayload,
        site,
        login,
        password: secretPassword,
        url,
        notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sauvegarde impossible: ${errorText}`);
    }

    newCredentialForm.reset();
    newCredentialForm.classList.add('hidden');
    setVaultMessage('Identifiant enregistré et chiffré');
    await loadVault();
  } catch (error) {
    setVaultMessage(error.message || 'Erreur d’enregistrement', 'error');
  }
};

const fillCurrentPageFields = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const url = new URL(tab.url);
    const hostname = url.hostname;
    const pageTitleText = tab.title || hostname;

    if (newTitleInput) newTitleInput.value = hostname.replace(/^www\./, '');
    if (newUrlInput) newUrlInput.value = tab.url;

    const existingValue = (newTitleInput?.value || '').trim();
    if (!existingValue) {
      if (newTitleInput) newTitleInput.value = pageTitleText;
    }
  } catch {
    // ignore invalid URLs
  }
};

const normalizeTabUrl = (value) => {
  const fallbackUrl = 'https://example.com/';

  if (!value || typeof value !== 'string') return fallbackUrl;

  const trimmed = value.trim();
  if (!trimmed) return fallbackUrl;

  try {
    const parsed = new URL(trimmed);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.href;
    }
    return fallbackUrl;
  } catch {
    const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return parsed.href;
      }
    } catch {
      // fallback to a safe valid page if the saved URL is empty or malformed
    }
  }

  const siteLike = trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  if (siteLike && siteLike.includes('.')) {
    return `https://${siteLike}`;
  }

  return fallbackUrl;
};

const decryptItemPayload = async (item) => {
  const masterPassword = await withPasswordKey();
  const plain = await window.NexvaultCrypto.decryptVaultPayload(item.encrypted_payload, masterPassword);
  return JSON.parse(plain);
};

const fillTabCredentials = (tabId, payload, retriesLeft = 15) => {
  chrome.tabs.sendMessage(tabId, { type: 'vault:autofill', payload }, () => {
    if (chrome.runtime.lastError && retriesLeft > 0) {
      setTimeout(() => fillTabCredentials(tabId, payload, retriesLeft - 1), 400);
      return;
    }

    setVaultMessage('Site ouvert et formulaire rempli');
  });
};

const normalizeHost = (value = '') => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';

  try {
    const normalized = raw.includes('://') ? new URL(raw).hostname : new URL(`https://${raw}`).hostname;
    return normalized.replace(/^www\./, '');
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }
};

const getMatchScore = (currentUrl, savedUrl) => {
  const currentHost = normalizeHost(currentUrl);
  const savedHost = normalizeHost(savedUrl);

  if (!currentHost || !savedHost) return 0;
  if (currentHost === savedHost) return 100;
  if (currentHost.endsWith(`.${savedHost}`)) return 80;
  if (savedHost.endsWith(`.${currentHost}`)) return 75;

  const currentBase = currentHost.split('.').slice(-2).join('.');
  const savedBase = savedHost.split('.').slice(-2).join('.');
  if (currentBase === savedBase) return 60;

  return 0;
};

const getMatchingVaultItems = (items = [], currentTabUrl = '') => {
  return [...items]
    .map((item) => {
      const savedUrl = item.url || item.site || item.title || '';
      const score = getMatchScore(currentTabUrl, savedUrl);
      return { ...item, matchScore: score };
    })
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};

const showInlineMenuForTab = async (tabId, items = []) => {
  if (!tabId || !items.length) return;

  const masterPassword = await withPasswordKey();
  const safeItems = [];

  for (const item of items.slice(0, 3)) {
    try {
      const plain = await window.NexvaultCrypto.decryptVaultPayload(item.encrypted_payload, masterPassword);
      const parsed = JSON.parse(plain);
      safeItems.push({
        id: item.id,
        title: item.site || item.title || 'Compte',
        username: parsed.login || parsed.username || parsed.email || '',
        password: parsed.password || '',
      });
    } catch {
      // ignore unreadable entries
    }
  }

  if (!safeItems.length) return;

  chrome.tabs.sendMessage(tabId, {
    type: 'nexvault:menu',
    payload: safeItems,
  }, () => {
    if (chrome.runtime.lastError) {
      // silent: site may not support the inline menu
    }
  });
};

if (loginButton) loginButton.addEventListener('click', (event) => login(event));
if (loginForm) loginForm.addEventListener('submit', (event) => login(event));
if (logoutButton) logoutButton.addEventListener('click', logout);
if (addCredentialButton) {
  addCredentialButton.addEventListener('click', async () => {
    if (newCredentialForm) newCredentialForm.classList.remove('hidden');
    await fillCurrentPageFields();
  });
}
if (cancelAddButton) {
  cancelAddButton.addEventListener('click', () => {
    if (newCredentialForm) {
      newCredentialForm.reset();
      newCredentialForm.classList.add('hidden');
    }
  });
}
if (newCredentialForm) newCredentialForm.addEventListener('submit', saveNewCredential);
if (saveCurrentPageButton) saveCurrentPageButton.addEventListener('click', saveCurrentPage);
if (autofillCurrentPageButton) autofillCurrentPageButton.addEventListener('click', autofillCurrentPage);
if (capturePageButton) capturePageButton.addEventListener('click', saveCurrentPage);

const hydrate = async () => {
  const { apiUrl, token, email, password } = await chrome.storage.local.get(['apiUrl', 'token', 'email', 'password']);
  if (apiUrl && apiUrlInput) apiUrlInput.value = apiUrl;
  if (token && tokenInput) tokenInput.value = token;
  if (email && emailInput) emailInput.value = email;
  if (password && passwordInput) passwordInput.value = password;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.title && pageTitle) pageTitle.textContent = tab.title;
};

(async () => {
  const { token } = await chrome.storage.local.get(['token']);
  if (token) {
    await loadVault();
  } else {
    showLogin();
  }
})();

hydrate();
