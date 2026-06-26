import { useState } from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './sections/Dashboard.jsx'
import Karyawan from './sections/Karyawan.jsx'
import Events from './sections/Events.jsx'
import Sports from './sections/Sports.jsx'
import SocialMedia from './sections/SocialMedia.jsx'
import Expenses from './sections/Expenses.jsx'
import Calendar from './sections/Calendar.jsx'
import { useData } from './hooks/useData.js'
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
  const [active, setActive] = useState('dashboard')
  const { data, loading, syncTime, followers, refresh } = useData()
  const Section = SECTIONS[active]

  return (
    <div className="app">
      <Header syncTime={syncTime} onSync={refresh} />
      <div className="layout">
        <Sidebar active={active} onChange={setActive} />
        <main className="main-content">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <p className="loading-text">Memuat data dari Google Sheets…</p>
            </div>
          ) : (
            <Section data={data} followers={followers} />
          )}
        </main>
      </div>
    </div>
  )
}
