import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import './Header.css'

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
        <div className="header-logo">ER</div>
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
