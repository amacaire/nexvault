import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { decryptVaultPayload, encryptVaultPayload } from './lib/crypto'

const STORAGE_KEY = 'nexvault.session'

const getApiBase = () => {
  const envValue = import.meta.env.VITE_API_URL
  if (envValue) return envValue.replace(/\/$/, '')

  return ''
}

const apiBase = getApiBase()

const saveSession = (nextToken: string, nextUser: User | null) => {
  if (!nextToken || !nextUser) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: nextToken,
      user: nextUser,
    }),
  )
}

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { token?: string; user?: User | null }
    if (!parsed.token || !parsed.user) return null

    return {
      token: parsed.token,
      user: parsed.user,
    }
  } catch {
    return null
  }
}

type VaultItem = {
  id: string
  title: string
  kind: string
  favorite: boolean
  encrypted_payload: Record<string, unknown>
}

type User = {
  id: string
  email: string
  role: string
}

type Section =
  | 'all'
  | 'favorites'
  | 'login'
  | 'notes'
  | 'cards'
  | 'identities'
  | 'ssh'
  | 'generator'
  | 'security'
  | 'settings'

const navItems: Array<{ id: Section; label: string; short: string }> = [
  { id: 'all', label: 'All Items', short: 'Tous' },
  { id: 'favorites', label: 'Favorites', short: 'Favoris' },
  { id: 'login', label: 'Login', short: 'Connexions' },
  { id: 'notes', label: 'Secure Notes', short: 'Notes' },
  { id: 'cards', label: 'Credit Cards', short: 'Cartes' },
  { id: 'identities', label: 'Identities', short: 'Identités' },
  { id: 'ssh', label: 'SSH Keys', short: 'Clés SSH' },
  { id: 'generator', label: 'Generator', short: 'Générateur' },
  { id: 'security', label: 'Security Dashboard', short: 'Sécurité' },
  { id: 'settings', label: 'Settings', short: 'Réglages' },
]

function App() {
  const [activeSection, setActiveSection] = useState<Section>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('admin@nexvault.local')
  const [password, setPassword] = useState('Password123!')
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('GitHub personal access token')
  const [kind, setKind] = useState('login')
  const [favorite, setFavorite] = useState(true)
  const [username, setUsername] = useState('admin@nexvault.local')
  const [entryPassword, setEntryPassword] = useState('SuperSecretPassword!')
  const [url, setUrl] = useState('https://github.com')
  const [noteContent, setNoteContent] = useState('')
  const [generatorLength, setGeneratorLength] = useState(20)
  const [useUppercase, setUseUppercase] = useState(true)
  const [useLowercase, setUseLowercase] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copyState, setCopyState] = useState('')

  useEffect(() => {
    const session = readStoredSession()
    if (!session) return

    setToken(session.token)
    setUser(session.user)
    void loadVaultItems(session.token)
  }, [])

  const loadVaultItems = async (jwtToken: string) => {
    try {
      const vaultResponse = await fetch(`${apiBase}/api/v1/vault/items`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })

      if (!vaultResponse.ok) {
        throw new Error('Unable to load vault items')
      }

      const vaultData = await vaultResponse.json()
      setItems(vaultData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
      setItems([])
    }
  }

  const visibleItems = useMemo(() => {
    const normalized = searchQuery.toLowerCase().trim()

    return items.filter((item) => {
      const bucketOk =
        activeSection === 'all' ||
        (activeSection === 'favorites' && item.favorite) ||
        (activeSection === 'login' && item.kind === 'login') ||
        (activeSection === 'notes' && item.kind === 'note') ||
        (activeSection === 'cards' && item.kind === 'card') ||
        (activeSection === 'identities' && item.kind === 'identity') ||
        (activeSection === 'ssh' && item.kind === 'ssh') ||
        (activeSection === 'settings' ? false : true)

      if (!bucketOk) return false
      if (!normalized) return true

      return item.title.toLowerCase().includes(normalized) || item.kind.toLowerCase().includes(normalized)
    })
  }, [activeSection, items, searchQuery])

  const securityStats = useMemo(() => {
    const weak = items.filter((item) => {
      try {
        const decrypted = JSON.parse(item.title || '{}')
        return decrypted
      } catch {
        return false
      }
    }).length

    const score = Math.max(0, 100 - items.length * 6 - weak)

    return {
      total: items.length,
      favorites: items.filter((item) => item.favorite).length,
      weak: Math.max(0, weak),
      score: Math.min(100, Math.max(0, score)),
      complete: items.filter((item) => item.title.trim()).length,
    }
  }, [items])

  const buildEncryptedObject = () => {
    if (kind === 'login') {
      return {
        username,
        password: entryPassword,
        url,
      }
    }

    if (kind === 'note') {
      return {
        text: noteContent || entryPassword,
        url,
      }
    }

    if (kind === 'card') {
      return {
        holder: username,
        number: entryPassword,
        expiration: 'MM/YY',
        url,
      }
    }

    if (kind === 'ssh') {
      return {
        name: title,
        publicKey: username,
        privateKey: entryPassword,
        url,
      }
    }

    return {
      username,
      password: entryPassword,
      url,
    }
  }

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()-_=+[]{};:,.<>?/'

    let pool = ''
    if (useLowercase) pool += lowercase
    if (useUppercase) pool += uppercase
    if (useNumbers) pool += numbers
    if (useSymbols) pool += symbols

    if (!pool) {
      setGeneratedPassword('')
      return
    }

    const bytes = new Uint8Array(generatorLength)
    crypto.getRandomValues(bytes)

    const result = Array.from(bytes, (byte) => pool[byte % pool.length]).join('')
    setGeneratedPassword(result)
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Authentification refusée')
      }

      const data = await response.json()
      const sessionUser = data.user as User

      setToken(data.token)
      setUser(sessionUser)
      saveSession(data.token, sessionUser)
      await loadVaultItems(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setItems([])
      setUser(null)
      setToken('')
      saveSession('', null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) {
      setError('Veuillez vous connecter avant de créer un élément.')
      return
    }

    try {
      const encrypted = await encryptVaultPayload(buildEncryptedObject(), password)

      const response = await fetch(`${apiBase}/api/v1/vault/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          kind,
          favorite,
          encrypted_payload: encrypted,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l’ajout du vault item')
      }

      const created = await response.json()
      setItems((current) => [created, ...current])
      setTitle('')
      setUsername('')
      setEntryPassword('')
      setUrl('')
      setNoteContent('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!token) return

    const response = await fetch(`${apiBase}/api/v1/vault/items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id))
    }
  }

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyState(label)
      setTimeout(() => setCopyState(''), 1200)
    } catch {
      setError('Impossible de copier dans le presse-papiers.')
    }
  }

  const handleDecrypt = async (item: VaultItem) => {
    try {
      const plain = await decryptVaultPayload(item.encrypted_payload as any, password)
      const parsed = JSON.parse(plain)
      const summary = typeof parsed === 'object' && parsed ? JSON.stringify(parsed, null, 2) : String(parsed)
      alert(`Décrypté:\n${summary}`)
    } catch {
      setError('Le mot de passe principal ne permet pas de déchiffrer cet élément.')
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setItems([])
    setError('')
    saveSession('', null)
  }

  useEffect(() => {
    if (!token) return
    saveSession(token, user)
  }, [token, user])

  const renderMainContent = () => {
    if (activeSection === 'generator') {
      return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Generator</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Password Generator</h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <label className="block text-sm text-slate-300">
                Length: <span className="text-cyan-300 font-medium">{generatorLength}</span>
              </label>
              <input
                type="range"
                min={8}
                max={64}
                value={generatorLength}
                onChange={(event) => setGeneratorLength(Number(event.target.value))}
                className="w-full accent-cyan-400"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={useLowercase} onChange={() => setUseLowercase((value) => !value)} />
                  Lowercase
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={useUppercase} onChange={() => setUseUppercase((value) => !value)} />
                  Uppercase
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={useNumbers} onChange={() => setUseNumbers((value) => !value)} />
                  Numbers
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={useSymbols} onChange={() => setUseSymbols((value) => !value)} />
                  Symbols
                </label>
              </div>

              <button
                type="button"
                onClick={generatePassword}
                className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                Generate password
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Generated result</p>
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/70 p-3 font-mono text-sm text-cyan-200 break-all">
                {generatedPassword || 'Select options and generate a password'}
              </div>
              {generatedPassword ? (
                <button
                  type="button"
                  onClick={() => copyText(generatedPassword, 'Password copied')}
                  className="mt-4 w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300"
                >
                  Copy
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )
    }

    if (activeSection === 'security') {
      return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Security</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Security Dashboard</h2>
            </div>
            <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              Score {securityStats.score}/100
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Vault health</p>
              <p className="mt-2 text-3xl font-bold text-white">{securityStats.score}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Weak items</p>
              <p className="mt-2 text-3xl font-bold text-white">{securityStats.weak}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Completed</p>
              <p className="mt-2 text-3xl font-bold text-white">{securityStats.complete}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-slate-200">
            <ul className="space-y-3 text-sm">
              <li>• Ensure each login uses a unique password and avoid recycle patterns.</li>
              <li>• Review entries with empty metadata or weak passwords.</li>
              <li>• Keep the master password unique and stored only in memory.</li>
              <li>• Keep the vault synced and rotate sensitive credentials periodically.</li>
            </ul>
          </div>
        </div>
      )
    }

    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Vault</p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              {activeSection === 'all' ? 'All Items' : activeSection === 'favorites' ? 'Favorites' : activeSection === 'login' ? 'Logins' : 'Entries'}
            </h2>
          </div>
          <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-300">
            {visibleItems.length} items
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Total</p>
            <p className="mt-3 text-3xl font-bold text-white">{securityStats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Favorites</p>
            <p className="mt-3 text-3xl font-bold text-white">{securityStats.favorites}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Security</p>
            <p className="mt-3 text-3xl font-bold text-white">{securityStats.score}%</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-white">{item.title}</p>
                    {item.favorite ? (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                        Favorite
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{item.kind}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecrypt(item)}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-slate-400">
              No items in this section yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  useEffect(() => {
    const stored = readStoredSession()

    if (stored?.token && stored?.user) {
      setToken(stored.token)
      setUser(stored.user)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setItems([])
      return
    }

    setLoading(true)

    const fetchItems = async () => {
      try {
        const response = await fetch(`${apiBase}/api/v1/vault/items`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('Impossible de récupérer les éléments du vault')
        }

        const vaultData = await response.json()
        setItems(vaultData.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [token])

  return (
    <div className="app-shell min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-5 lg:px-6">
        <aside className="hidden w-[280px] shrink-0 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/40 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-lg font-bold text-cyan-300">
              N
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-400">NEXVAULT</p>
              <h1 className="mt-1 text-xl font-semibold text-white">Vault</h1>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                  activeSection === item.id
                    ? 'border border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <span>{item.label}</span>
                <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  {item.short}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Session</p>
            <p className="mt-3 text-sm text-white">{user ? user.email : 'No active session'}</p>
            {token ? (
              <div className="mt-3 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                Secure
              </div>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="rounded-3xl border border-slate-800 bg-slate-900/80 px-5 py-4 shadow-2xl shadow-slate-950/40">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5">
                <span className="text-slate-400">⌕</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  placeholder="Search vault entries..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('generator')}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300"
                >
                  Generator
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('settings')}
                  className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200"
                >
                  Settings
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
              <div className="mb-6">
                <p className="text-sm font-medium text-cyan-300">Connexion sécurisée</p>
                <h2 className="mt-2 text-3xl font-bold text-white">Access Vault</h2>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="mb-2 block text-sm text-slate-300" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300" htmlFor="main-password">Master password</label>
                  <input
                    id="main-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Unlock vault'}
                </button>
              </form>

              <form className="mt-8 space-y-4 border-t border-slate-800 pt-6" onSubmit={handleCreateItem}>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Title</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Type</label>
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  >
                    <option value="login">Login</option>
                    <option value="note">Secure Note</option>
                    <option value="card">Credit Card</option>
                    <option value="ssh">SSH Key</option>
                  </select>
                </div>

                {kind === 'login' || kind === 'card' ? (
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Username / Holder</label>
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    {kind === 'note' ? 'Secret note' : kind === 'card' ? 'Card number' : kind === 'ssh' ? 'Private key' : 'Password'}
                  </label>
                  <input
                    type={kind === 'ssh' ? 'text' : 'password'}
                    value={kind === 'note' ? noteContent : entryPassword}
                    onChange={(event) => {
                      if (kind === 'note') {
                        setNoteContent(event.target.value)
                      } else {
                        setEntryPassword(event.target.value)
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {kind === 'note' ? (
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">URL</label>
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">URL / Site</label>
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200">
                  <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
                  Mark as favorite
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Encrypt and save
                </button>
              </form>
            </section>

            <section className="space-y-6">
              {activeSection === 'settings' ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Settings</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Preferences</h3>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm text-slate-400">Theme</p>
                      <p className="mt-2 text-white">Dark premium</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm text-slate-400">Auto-lock</p>
                      <p className="mt-2 text-white">15 minutes</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm text-slate-400">Security</p>
                      <p className="mt-2 text-white">AES-GCM + Argon2-ready</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm text-slate-400">Clipboard</p>
                      <p className="mt-2 text-white">Auto clear after copy</p>
                    </div>
                  </div>
                </div>
              ) : (
                renderMainContent()
              )}

              {copyState ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {copyState}
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
