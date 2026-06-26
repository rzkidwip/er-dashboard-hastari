import { LayoutDashboard, Users, CalendarDays, Trophy, Share2, CreditCard, CalendarRange } from 'lucide-react'
import './Sidebar.css'

const MENU = [
  { id: 'dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'karyawan',  label: 'Karyawan',     Icon: Users },
  { id: 'events',    label: 'Events',       Icon: CalendarDays },
  { id: 'calendar',  label: 'Calendar',     Icon: CalendarRange },
  { id: 'sports',    label: 'Sports',       Icon: Trophy },
  { id: 'social',    label: 'Social Media', Icon: Share2 },
  { id: 'expenses',  label: 'Expenses',     Icon: CreditCard },
]

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <p className="sidebar-section-label">Menu</p>
      <nav>
        {MENU.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-item ${active === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icon size={17} strokeWidth={active === id ? 2.2 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
