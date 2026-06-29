import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import './PortalHeader.css'

const BASE = import.meta.env.BASE_URL

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'karyawan',  label: 'Karyawan' },
  { id: 'events',    label: 'Events' },
  { id: 'calendar',  label: 'Calendar' },
  { id: 'sports',    label: 'Sports' },
  { id: 'social',    label: 'Social Media' },
  { id: 'expenses',  label: 'Expenses' },
]

export default function PortalHeader({ active, onChange, syncTime, onSync }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [syncing, setSyncing]   = useState(false)

  async function handleSync() {
    setSyncing(true)
    await onSync(true)
    setSyncing(false)
  }

  function go(id) {
    onChange(id)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="ph">
      <div className="ph-inner">

        {/* Logo */}
        <button className="ph-brand" onClick={() => go('home')}>
          <img src={`${BASE}assets/logo-hastari.png`} alt="Portal Hastarian" className="ph-logo" />
        </button>

        {/* Desktop nav */}
        <nav className="ph-nav">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              className={`ph-nav-btn ${active === id ? 'active' : ''}`}
              onClick={() => go(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ph-actions">
          {active !== 'home' && (
            <button className="ph-sync" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={13} className={syncing ? 'ph-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
          )}
          <button className="ph-cta" onClick={() => go('dashboard')}>
            {active === 'home' ? 'Get Started' : 'Dashboard'}
          </button>
          <button
            className="ph-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
          </button>
        </div>
      </div>

      {/* Sub-bar: sync info (desktop) */}
      {syncTime && active !== 'home' && (
        <div className="ph-syncbar">Terakhir sync {syncTime}</div>
      )}

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="ph-mobile-menu">
          <button
            className={`ph-mobile-item ${active === 'home' ? 'active' : ''}`}
            onClick={() => go('home')}
          >
            🏠 Home
          </button>
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              className={`ph-mobile-item ${active === id ? 'active' : ''}`}
              onClick={() => go(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
