import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import './Karyawan.css'

const ENTITY_COLORS = {
  HAI:'#CC1010', HAP:'#007AFF', ASI:'#E8A000',
  BPN:'#2B5CE6', CMS:'#6B4F2A', IAS:'#2E7D32', HPA:'#0091A8',
}

const BASE = import.meta.env.BASE_URL
const ENTITY_LOGOS = {
  HAI: `${BASE}logos/HAI.png`,
  HAP: `${BASE}logos/HAP.png`,
  ASI: `${BASE}logos/ASI.png`,
  BPN: `${BASE}logos/BPN.png`,
  CMS: `${BASE}logos/CMS.png`,
  IAS: `${BASE}logos/IAS.png`,
  HPA: `${BASE}logos/HPA.png`,
}
const LEVEL_COLORS = {
  DIRECTOR:'var(--red)',MANAGER:'var(--blue)',
  SUPERVISOR:'var(--purple)',OFFICER:'var(--label-3)',
}

export default function Karyawan({ data }) {
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('Semua')
  const emp = data?.employees||[]

  const entities = useMemo(()=>[
    'Semua',
    ...Object.keys(emp.reduce((a,e)=>{a[e.entity]=1;return a},{})).sort()
  ],[emp])

  const filtered = useMemo(()=>{
    const q = search.toLowerCase()
    return emp.filter(e=>
      (entity==='Semua'||e.entity===entity) &&
      (!q || e.nama.toLowerCase().includes(q) ||
       e.nik.includes(q) || (e.jobTitle||'').toLowerCase().includes(q))
    )
  },[emp,search,entity])

  return (
    <div className="karyawan-page">
      <div className="page-row">
        <h1 className="page-title">Karyawan</h1>
        <span className="badge badge-red">{filtered.length} / {emp.length}</span>
      </div>

      {/* Search + filter */}
      <div className="kar-controls">
        <div className="search-wrap">
          <Search size={15} color="var(--label-3)" />
          <input className="search-input" placeholder="Cari nama, NIK, jabatan…"
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="entity-pills">
          {entities.map(en=>(
            <button key={en}
              className={`entity-pill ${entity===en?'active':''}`}
              style={entity===en&&en!=='Semua' ? { borderColor:ENTITY_COLORS[en], color:ENTITY_COLORS[en] } : {}}
              onClick={()=>setEntity(en)}>
              {ENTITY_LOGOS[en] && (
                <img src={ENTITY_LOGOS[en]} alt={en} className="entity-pill-logo" />
              )}
              {en}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <table className="apple-table">
          <thead>
            <tr>
              <th>NIK</th><th>Nama</th><th>Jabatan</th>
              <th>Level</th><th>Email</th><th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0
              ? <tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'var(--label-3)'}}>Tidak ada data</td></tr>
              : filtered.map((e,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'monospace',fontSize:12,color:'var(--label-3)'}}>{e.nik}</td>
                <td style={{fontWeight:600,color:'var(--label)'}}>{e.nama}</td>
                <td style={{fontSize:13}}>{e.jobTitle||'—'}</td>
                <td>
                  <span style={{
                    fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:4,
                    background:'var(--surface-2)',
                    color: LEVEL_COLORS[(e.jobLevel||'').toUpperCase()]||'var(--label-3)'
                  }}>{e.jobLevel||'—'}</span>
                </td>
                <td style={{fontSize:12,color:'var(--blue)'}}>{e.email||'—'}</td>
                <td>
                  <span className="entity-badge" style={{ borderColor: ENTITY_COLORS[e.entity]||'#8E8E93', color: ENTITY_COLORS[e.entity]||'#8E8E93' }}>
                    {ENTITY_LOGOS[e.entity] && (
                      <img src={ENTITY_LOGOS[e.entity]} alt={e.entity} className="entity-badge-logo" />
                    )}
                    {e.entity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
