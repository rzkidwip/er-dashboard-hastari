import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import './Header.css'

const LOGO_URL = `${import.meta.env.BASE_URL}assets/logo-hastari.png`

export default function Header({ syncTime, onSync }) {
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    await onSync(true)
    setSyncing(false)
  }

  return (
    <header className="header">
      <div className="header-brand">
        <img
          src={LOGO_URL}
          alt="Portal Hastarian"
          className="header-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ cursor: 'pointer' }}
        />
        <div>
          <div className="header-title">Portal ER Hastari Corp</div>
          {syncTime && <div className="header-sub">Terakhir sync {syncTime}</div>}
        </div>
      </div>
      <button className="sync-btn" onClick={handleSync} disabled={syncing}>
        <RefreshCw size={15} className={syncing ? 'spin' : ''} />
        {syncing ? 'Syncing…' : 'Sync'}
      </button>
    </header>
  )
}
