import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe2,
  Home,
  LockKeyhole,
  MoreHorizontal,
  RefreshCw,
  ShieldAlert,
  Star,
} from 'lucide-react'

const LOCAL_HOME = '/embedded/home.html'

const QUICK_LINKS = [
  { label: '展厅首页', url: '/embedded/home.html' },
  { label: '数字展册', url: '/embedded/collection.html' },
  { label: '参观指南', url: '/embedded/guide.html' },
  { label: 'Example', url: 'https://example.com/' },
] as const

function normalizeAddress(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return LOCAL_HOME
  if (trimmed.startsWith('/')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
}

function isSafeAddress(value: string) {
  return value.startsWith('/') || /^https?:\/\//i.test(value)
}

export function BrowserApp() {
  const [history, setHistory] = useState<string[]>([LOCAL_HOME])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [addressInput, setAddressInput] = useState(LOCAL_HOME)
  const [reloadNonce, setReloadNonce] = useState(0)
  const currentAddress = history[historyIndex] ?? LOCAL_HOME
  const isExternal = /^https?:\/\//i.test(currentAddress)

  const displayAddress = useMemo(
    () => currentAddress.replace(/^https?:\/\//i, '').replace(/\/$/, ''),
    [currentAddress],
  )

  const navigate = (rawAddress: string) => {
    const nextAddress = normalizeAddress(rawAddress)
    if (!isSafeAddress(nextAddress)) return
    const nextHistory = history.slice(0, historyIndex + 1)
    nextHistory.push(nextAddress)
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
    setAddressInput(nextAddress)
  }

  const openExternally = () => {
    const externalWindow = window.open(currentAddress, '_blank')
    if (externalWindow) externalWindow.opener = null
  }

  return (
    <div className="browser-app">
      <div className="browser-app__tabs">
        <div className="browser-app__tab is-active"><Globe2 size={14} /><span>展览厅浏览器</span><i /></div>
        <button type="button">+</button>
      </div>
      <div className="browser-app__toolbar">
        <button type="button" disabled={historyIndex === 0} onClick={() => {
          const nextIndex = Math.max(0, historyIndex - 1)
          setHistoryIndex(nextIndex)
          setAddressInput(history[nextIndex] ?? LOCAL_HOME)
        }}><ArrowLeft size={16} /></button>
        <button type="button" disabled={historyIndex >= history.length - 1} onClick={() => {
          const nextIndex = Math.min(history.length - 1, historyIndex + 1)
          setHistoryIndex(nextIndex)
          setAddressInput(history[nextIndex] ?? LOCAL_HOME)
        }}><ArrowRight size={16} /></button>
        <button type="button" onClick={() => setReloadNonce((value) => value + 1)}><RefreshCw size={15} /></button>
        <button type="button" onClick={() => navigate(LOCAL_HOME)}><Home size={15} /></button>
        <form onSubmit={(event) => {
          event.preventDefault()
          navigate(addressInput)
        }}>
          <LockKeyhole size={14} />
          <input value={addressInput} onChange={(event) => setAddressInput(event.target.value)} aria-label="网页地址" />
          <button type="button" aria-label="收藏"><Star size={14} /></button>
        </form>
        <button type="button" onClick={openExternally}><ExternalLink size={15} /></button>
        <button type="button"><MoreHorizontal size={17} /></button>
      </div>
      <div className="browser-app__bookmarks">
        {QUICK_LINKS.map((link) => (
          <button type="button" key={link.url} onClick={() => navigate(link.url)}>{link.label}</button>
        ))}
      </div>
      {isExternal && (
        <div className="browser-app__frame-note">
          <ShieldAlert size={15} />
          <span>当前地址由 iframe 加载。部分网站会通过 Content-Security-Policy 或 X-Frame-Options 禁止嵌入；遇到空白页时请使用右上角“外部打开”。</span>
        </div>
      )}
      <div className="browser-app__viewport">
        <iframe
          key={`${currentAddress}-${reloadNonce}`}
          src={currentAddress}
          title={`浏览器页面：${displayAddress}`}
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        />
      </div>
      <footer><span>{isExternal ? 'Internet' : 'Localhost App'}</span><span>{displayAddress}</span><span>100%</span></footer>
    </div>
  )
}
