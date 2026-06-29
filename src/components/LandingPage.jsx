import { useState, useEffect, useRef } from 'react'
import './LandingPage.css'

const BASE = import.meta.env.BASE_URL

const FEATURES = [
  { emoji: '📊', title: 'Dashboard', desc: 'KPI overview, grafik performa, dan birthday tracker karyawan dalam satu tampilan terpusat.' },
  { emoji: '👥', title: 'Karyawan', desc: 'Kelola 89 karyawan dari 7 divisi — data lengkap, filter cepat, dan info detail per karyawan.' },
  { emoji: '📅', title: 'Calendar', desc: 'Kalender kerja lengkap dengan hari libur nasional, events mendatang, dan navigasi bulan.' },
  { emoji: '🏆', title: 'Sports', desc: 'Lacak kehadiran olahraga rutin, visualisasi heatmap, dan ranking partisipasi karyawan.' },
  { emoji: '📱', title: 'Social Media', desc: 'Monitor postingan, analitik engagement, dan content planner untuk semua platform.' },
  { emoji: '💰', title: 'Expenses', desc: 'Tracking anggaran ER, perbandingan antar periode, dan laporan pengeluaran lengkap.' },
]

const STATS = [
  { value: '89',    label: 'Karyawan',   desc: 'Dari 7 divisi aktif' },
  { value: '5',     label: 'Events',     desc: 'Program tahun ini' },
  { value: '112',   label: 'Posts',      desc: 'Konten media sosial' },
  { value: '27.9M', label: 'Budget ER',  desc: 'Rupiah dikelola' },
]

const ENTITIES = [
  { code: 'HAI', color: '#CC1010' },
  { code: 'HAP', color: '#007AFF' },
  { code: 'ASI', color: '#E8A000' },
  { code: 'BPN', color: '#2B5CE6' },
  { code: 'CMS', color: '#6B4F2A' },
  { code: 'IAS', color: '#2E7D32' },
  { code: 'HPA', color: '#0091A8' },
]

const MOCK_BARS = [60, 80, 45, 90, 70, 85, 55]

export default function LandingPage({ onEnter, noHeader = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const lpRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible') }),
      { threshold: 0.1 }
    )
    lpRef.current?.querySelectorAll('.lp-fade').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div className="lp" ref={lpRef}>

      {/* ── HEADER (hidden when PortalHeader is used) ── */}
      {!noHeader && (
        <header className="lp-header">
          <div className="lp-header-inner">
            <div className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} role="button" tabIndex={0}>
              <img src={`${BASE}assets/logo-hastari.png`} alt="Portal Hastarian" className="lp-brand-logo" />
            </div>
            <nav className="lp-nav">
              <button onClick={() => scrollTo('features')}>Fitur</button>
              <button onClick={() => scrollTo('stats')}>Statistik</button>
              <button onClick={() => scrollTo('entities')}>Entitas</button>
            </nav>
            <button className="lp-cta-header" onClick={onEnter}>Get Started</button>
            <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span className={menuOpen ? 'open' : ''} />
              <span className={menuOpen ? 'open' : ''} />
              <span className={menuOpen ? 'open' : ''} />
            </button>
          </div>
          {menuOpen && (
            <div className="lp-mobile-menu">
              <button onClick={() => scrollTo('features')}>Fitur</button>
              <button onClick={() => scrollTo('stats')}>Statistik</button>
              <button onClick={() => scrollTo('entities')}>Entitas</button>
              <button className="lp-mobile-cta" onClick={onEnter}>Get Started</button>
            </div>
          )}
        </header>
      )}

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-particles">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="lp-particle" style={{ '--i': i }} />
          ))}
        </div>
        <div className="lp-hero-inner">
          <div className="lp-hero-text lp-hero-anim">
            <span className="lp-hero-badge">✦ Employee Relations Dashboard</span>
            <h1>
              Kelola Employee Relations<br />
              dengan <span className="lp-hero-accent">Mudah</span>
            </h1>
            <p>
              Platform terintegrasi untuk memantau karyawan, events, kalender,
              olahraga, media sosial, dan anggaran ER — semua dalam satu tempat.
            </p>
            <button className="lp-hero-btn" onClick={onEnter}>
              Get Started Now <span className="lp-btn-arrow">→</span>
            </button>
          </div>

          <div className="lp-hero-mockup lp-hero-anim lp-hero-anim-delay">
            <div className="lp-mock-main">
              <div className="lp-mock-header">
                <div className="lp-mock-dots">
                  <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
                </div>
                <span className="lp-mock-title">Portal Hastarian</span>
              </div>
              <div className="lp-mock-kpis">
                {[['89','Karyawan'],['5','Events'],['112','Posts']].map(([v,l]) => (
                  <div key={l} className="lp-mock-kpi">
                    <span className="lp-mock-num">{v}</span>
                    <span className="lp-mock-lbl">{l}</span>
                  </div>
                ))}
              </div>
              <div className="lp-mock-chart">
                {MOCK_BARS.map((h, i) => (
                  <div key={i} className="lp-mock-bar" style={{ height: `${h}%`, '--bd': `${i * 0.08}s` }} />
                ))}
              </div>
            </div>
            <div className="lp-float-card lp-float-1">🎂 3 ulang tahun minggu ini</div>
            <div className="lp-float-card lp-float-2">📅 Event bulan ini: 2</div>
            <div className="lp-float-card lp-float-3">💰 Budget: Rp 27.9M</div>
          </div>
        </div>
        <button className="lp-scroll-indicator" onClick={onEnter} aria-label="Ke Dashboard">
          <span className="lp-scroll-text">Scroll ke Dashboard</span>
          <span className="lp-scroll-arrow">↓</span>
        </button>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-section lp-features-section">
        <div className="lp-section-inner">
          <div className="lp-fade lp-section-head">
            <p className="lp-tag">Fitur Lengkap</p>
            <h2>Semua yang Kamu Butuhkan</h2>
            <p className="lp-sub">6 modul terintegrasi untuk manajemen Employee Relations yang efisien</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="lp-feature-card lp-fade" style={{ '--fd': `${i * 0.1}s` }}>
                <div className="lp-feature-icon">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="lp-section lp-stats-section">
        <div className="lp-section-inner">
          <div className="lp-fade lp-section-head">
            <p className="lp-tag">Data Real-time</p>
            <h2>Angka yang Bicara</h2>
            <p className="lp-sub">Diperbarui langsung dari Google Sheets</p>
          </div>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={s.label} className="lp-stat-card lp-fade" style={{ '--fd': `${i * 0.1}s` }}>
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
                <div className="lp-stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTITIES ── */}
      <section id="entities" className="lp-section lp-entities-section">
        <div className="lp-section-inner">
          <div className="lp-fade lp-section-head">
            <p className="lp-tag">Grup Entitas</p>
            <h2>7 Entitas Hastari Group</h2>
            <p className="lp-sub">Satu platform untuk semua entitas perusahaan</p>
          </div>
          <div className="lp-entities-grid lp-fade" style={{ '--fd': '0.2s' }}>
            {ENTITIES.map(en => (
              <div key={en.code} className="lp-entity-badge">
                <img
                  src={`${BASE}logos/${en.code}.png`}
                  alt={en.code}
                  className="lp-entity-img"
                  onError={e => { e.target.style.display = 'none' }}
                />
                <span className="lp-entity-code" style={{ color: en.color }}>{en.code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <img
            src={`${BASE}assets/logo-hastari.png`}
            alt="Portal Hastarian"
            className="lp-footer-logo"
          />
          <button className="lp-footer-cta" onClick={onEnter}>
            Buka Dashboard ↓
          </button>
          <p>Portal Hastarian © 2026 · Employee Relations Dashboard · Hastari Corp</p>
        </div>
      </footer>

    </div>
  )
}
