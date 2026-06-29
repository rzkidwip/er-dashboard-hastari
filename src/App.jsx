import { useState } from 'react'
import PortalHeader from './components/PortalHeader.jsx'
import LandingPage  from './components/LandingPage.jsx'
import SectionHero  from './components/SectionHero.jsx'
import Dashboard    from './sections/Dashboard.jsx'
import Karyawan     from './sections/Karyawan.jsx'
import Events       from './sections/Events.jsx'
import Sports       from './sections/Sports.jsx'
import SocialMedia  from './sections/SocialMedia.jsx'
import Expenses     from './sections/Expenses.jsx'
import Calendar     from './sections/Calendar.jsx'
import { useData }  from './hooks/useData.js'
import './App.css'

const SECTIONS = {
  dashboard: Dashboard,
  karyawan:  Karyawan,
  events:    Events,
  sports:    Sports,
  social:    SocialMedia,
  expenses:  Expenses,
  calendar:  Calendar,
}

export default function App() {
  const [active, setActive] = useState('home')
  const { data, loading, syncTime, followers, refresh } = useData()

  function navigate(id) {
    setActive(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const Section = SECTIONS[active]

  return (
    <div className="portal">
      <PortalHeader
        active={active}
        onChange={navigate}
        syncTime={syncTime}
        onSync={refresh}
      />

      {active === 'home' ? (
        <LandingPage noHeader onEnter={() => navigate('dashboard')} />
      ) : (
        <main className="portal-main" key={active}>
          <SectionHero section={active} />
          <div className="portal-content">
            {loading ? (
              <div className="loading">
                <div className="spinner" />
                <p className="loading-text">Memuat data dari Google Sheets…</p>
              </div>
            ) : (
              <Section data={data} followers={followers} />
            )}
          </div>
        </main>
      )}
    </div>
  )
}
