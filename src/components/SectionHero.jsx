import './SectionHero.css'

const META = {
  dashboard: {
    emoji: '📊', title: 'Dashboard',
    sub: 'Overview KPI, analytics, dan upcoming birthdays karyawan',
    grad: 'linear-gradient(135deg, #7C3AED 0%, #1287c1 100%)',
  },
  karyawan: {
    emoji: '👥', title: 'Karyawan',
    sub: '89 karyawan aktif dari 7 divisi — cari, filter, dan lihat detail',
    grad: 'linear-gradient(135deg, #0284C7 0%, #0E7490 100%)',
  },
  events: {
    emoji: '🎪', title: 'Events',
    sub: '5 program Employee Relations — detail, volunteers, dan tracking absensi',
    grad: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
  },
  calendar: {
    emoji: '📅', title: 'Calendar',
    sub: 'Kalender kerja dengan hari libur nasional dan events mendatang',
    grad: 'linear-gradient(135deg, #059669 0%, #0284C7 100%)',
  },
  sports: {
    emoji: '🏆', title: 'Sports',
    sub: 'Tracking kehadiran olahraga, heatmap aktifitas, dan ranking partisipasi',
    grad: 'linear-gradient(135deg, #D97706 0%, #DC2626 100%)',
  },
  social: {
    emoji: '📱', title: 'Social Media',
    sub: 'Content planner, analytics performa, dan monitoring reach & engagement',
    grad: 'linear-gradient(135deg, #DB2777 0%, #7C3AED 100%)',
  },
  expenses: {
    emoji: '💰', title: 'Expenses',
    sub: 'Budget ER Rp 27.9M — breakdown pengeluaran dan pengajuan vs realisasi',
    grad: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  },
}

export default function SectionHero({ section }) {
  const m = META[section]
  if (!m) return null

  return (
    <div className="sh" style={{ background: m.grad }}>
      <div className="sh-particles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="sh-particle" style={{ '--i': i }} />
        ))}
      </div>
      <div className="sh-inner">
        <span className="sh-emoji">{m.emoji}</span>
        <div className="sh-text">
          <h1 className="sh-title">{m.title}</h1>
          <p className="sh-sub">{m.sub}</p>
        </div>
      </div>
    </div>
  )
}
