import { useState, useEffect, useCallback } from 'react'

const CACHE_VERSION = 'v13'
const SHEET_ID = '1qgzmEsj05nX3jG9FXvJAKUiwb9vsEEyJ'

const FALLBACK_EXPENSES = [
  {
    expenseId: 'CA-2026-001',
    activityName: 'Valentine, Imlek, Munggahan & Buka Bersama 2026',
    submissionAmount: 'Rp19.850.000',
    realizationAmount: 'Rp18.905.673',
    refundAmount: 'Rp952.804',
    efficiencyRate: '95.24%',
    status: 'Done Realization',
    attachmentLink: 'Realisasi CA Munggahan dan Bukber (Jan-Feb 2026).pdf',
  },
  {
    expenseId: 'CA-2026-002',
    activityName: 'Sportsday April Edition',
    submissionAmount: 'Rp2.500.000',
    realizationAmount: 'Rp1.767.978',
    refundAmount: 'Rp732.022',
    efficiencyRate: '70.72%',
    status: 'Done Realization',
    attachmentLink: 'Realisasi Sports Day (April 2026).pdf',
  },
  {
    expenseId: 'CA-2026-003',
    activityName: 'Employee Gift & Cake (Maret & April Edition)',
    submissionAmount: 'Rp2.200.000',
    realizationAmount: 'Rp1.794.700',
    refundAmount: 'Rp405.300',
    efficiencyRate: '81.58%',
    status: 'Done Realization',
    attachmentLink: 'Realisasi Employee Birthday (Mar-Apr 2026).pdf',
  },
  {
    expenseId: 'CA-2026-004',
    activityName: 'Perayaan Paskah, Kartini dan Halal bi Halal',
    submissionAmount: 'Rp6.920.000',
    realizationAmount: 'Rp5.420.262',
    refundAmount: 'Rp1.499.738',
    efficiencyRate: '78.33%',
    status: 'Done Realization',
    attachmentLink: 'Realisasi Halbil Paskah Kartini (April 2026).pdf',
  },
  {
    expenseId: 'CA-2026-005',
    activityName: 'Bu Meita Birthday Celebration & Health Fest 2026',
    submissionAmount: '',
    realizationAmount: '',
    refundAmount: '',
    efficiencyRate: '',
    status: 'On-Going',
    attachmentLink: '',
  },
  {
    expenseId: 'CA-2026-006',
    activityName: 'Sports Day June Edition',
    submissionAmount: '',
    realizationAmount: '',
    refundAmount: '',
    efficiencyRate: '',
    status: 'On-Going',
    attachmentLink: '',
  },
]

const GID = {
  HAI: 1900501093, HAP: 365908305, ASI: 1013625013,
  BPN: 1788001658, CMS: 1049031440, IAS: 1580056170, HPA: 416583594,
  EVENTS: 2073599314, VOLUNTEERS: 438811308, SPORTS: 1381604071,
  POSTS: 1622996405, ANALYTICS: 2037837739, SUMMARY: 1178967585,
  EXPENSES: 959874552,
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = []
  for (const line of text.replace(/\r/g, '').split('\n')) {
    if (!line.trim()) continue
    const cells = []
    let cell = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cell += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) { cells.push(cell.trim()); cell = '' }
      else cell += c
    }
    cells.push(cell.trim())
    rows.push(cells)
  }
  return rows
}

async function fetchSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return parseCSV(await r.text())
}

function toObjects(rows, anchor) {
  let hi = rows.findIndex(r => r.some(c => c.toLowerCase().trim() === anchor.toLowerCase()))
  if (hi === -1) hi = 0
  const headers = rows[hi]
  return rows.slice(hi + 1)
    .filter(r => r.some(c => c))
    .map(r => {
      const obj = {}
      headers.forEach((h, i) => { if (h) obj[h.trim()] = (r[i] || '').trim() })
      return obj
    })
}

// Split a sheet that has two tables side by side (separated by empty column)
function splitSideBySide(rows) {
  if (!rows.length) return [rows, []]
  const headers = rows[0]
  const sep = headers.findIndex((h, i) => i > 2 && !h.trim())
  if (sep === -1) return [rows, []]
  return [rows.map(r => r.slice(0, sep)), rows.map(r => r.slice(sep + 1))]
}

// ── FETCH ALL (parallel) ──────────────────────────────────────────────────────
async function fetchAll() {
  const data = {
    employees: [], events: [], volunteers: [], sports: [],
    posts: [], analytics: [], summary: [], expenses: [],
    syncTime: new Date().toISOString(),
  }

  const entities = [
    [GID.HAI,'HAI'],[GID.HAP,'HAP'],[GID.ASI,'ASI'],
    [GID.BPN,'BPN'],[GID.CMS,'CMS'],[GID.IAS,'IAS'],[GID.HPA,'HPA'],
  ]

  const safe = gid => fetchSheet(gid).catch(() => [])

  const [
    ...entityRows
  ] = await Promise.all(entities.map(([gid]) => safe(gid)))

  entityRows.forEach((rows, i) => {
    const entity = entities[i][1]
    try {
      data.employees.push(...toObjects(rows, 'full name').map(o => {
        const namaKey = Object.keys(o).find(k => /(?:FULL NAME|NAMA)$/i.test(k)) || ''
        return {
          nik:           o['EMPLOYEE ID'] || o['EMPLOYEE ID PKWT'] || '',
          nama:          namaKey ? o[namaKey] : '',
          jobLevel:      o['JOB LEVEL']   || '',
          jobTitle:      o['JOB TITLE']   || '',
          birthPlace:    o['BIRTH PLACE'] || '',
          birthDate:     o['BIRTH DATE']  || '',
          personalEmail: o['PERSONAL EMAIL'] || '',
          email:         o['EMPLOYEE EMAIL'] || '',
          entity,
        }
      }).filter(e => e.nik || e.nama))
    } catch (e) { console.warn(entity, e.message) }
  })

  // Patch NIK yang kosong di spreadsheet
  const NIK_PATCHES = {
    'AZZUWIR AMIR':                    '2270022001',
    'BRIGITTA THEOLA WINONA SARISTASYA': '2450002012',
  }
  data.employees.forEach(e => {
    if (!e.nik && NIK_PATCHES[e.nama]) e.nik = NIK_PATCHES[e.nama]
  })

  const [evRows, volRows, spRows, postRows, anlRows, sumRows, expRows] =
    await Promise.all([
      safe(GID.EVENTS), safe(GID.VOLUNTEERS), safe(GID.SPORTS),
      safe(GID.POSTS),  safe(GID.ANALYTICS),  safe(GID.SUMMARY),
      safe(GID.EXPENSES),
    ])

  // Events
  try {
    data.events = toObjects(evRows, 'event name')
      .map(o => ({
        eventName: o['Event Name'] || '', date: o['Date'] || '',
        venue: o['Venue'] || '', description: o['Description'] || '',
        organizer: o['Organizer'] || '', status: o['Status'] || '',
        budget: o['Budget'] || '',
      })).filter(e => e.eventName)
  } catch (e) { console.warn('Events', e.message) }

  // Volunteers
  try {
    data.volunteers = toObjects(volRows, 'volunteer name')
      .map(o => ({
        eventName: o['Event Name'] || '', volunteerName: o['Volunteer Name'] || '',
        nik: o['NIK'] || '', role: o['Role'] || '',
        entity: o['Divisi / Entity'] || '', status: o['Status'] || '',
      })).filter(v => v.volunteerName)
  } catch (e) { console.warn('Volunteers', e.message) }

  // Sports — forward-fill eventNo & category karena merged cells di sheet
  try {
    let lastEvNo = '', lastCat = '', lastDate = ''
    data.sports = toObjects(spRows, 'sport category')
      .map(o => {
        const evNo = o['EVENT VOLUNTEER HASTARI CORP NO'] || lastEvNo
        const cat  = o['Sport Category'] || lastCat
        const date = o['Date'] || lastDate
        if (o['EVENT VOLUNTEER HASTARI CORP NO']) { lastEvNo = evNo; lastCat = ''; lastDate = '' }
        if (o['Sport Category']) lastCat  = cat
        if (o['Date'])           lastDate = date
        return {
          eventNo:     evNo,
          category:    cat,
          participant: o['Participant Name'] || '',
          nik:         o['NIK'] || '',
          entity:      o['Divisi / Entity'] || '',
          date,
          status:      o['Status'] || '',
        }
      }).filter(s => s.participant && s.category)
  } catch (e) { console.warn('Sports', e.message) }

  // Posts — 2 tables side by side, left=Life at Hastari, right=Hastari Jaya Sentosa
  try {
    const parsePostHalf = rows => toObjects(rows, 'account')
      .map(o => ({
        account:     o['SOCIAL MEDIA MANAGEMENT Account'] || o['Account'] || '',
        platform:    o['Platform'] || '',
        postDate:    o['Post Date'] || '',
        postType:    o['Post Type'] || '',
        caption:     o['Caption'] || '',
        contentLink: o['Link to Content'] || '',
        status:      o['Publish Status'] || '',
      })).filter(p => p.account && p.postDate)
    const [leftPosts, rightPosts] = splitSideBySide(postRows)
    data.posts = [...parsePostHalf(leftPosts), ...parsePostHalf(rightPosts)]
  } catch (e) { console.warn('Posts', e.message) }

  // Analytics — 2 tables side by side, same pattern
  try {
    const parseAnaHalf = rows => toObjects(rows, 'account')
      .map(o => {
        const n = v => Number((v || '0').toString().replace(/,/g, '')) || 0
        return {
          account:  o['SOCIAL MEDIA MANAGEMENT Account'] || o['Account'] || '',
          platform: o['Platform'] || '',
          postDate: o['Post Date'] || '',
          postType: o['Post Type'] || '',
          likes:    n(o['Likes']),
          shares:   n(o['Shares']),
          reach:    n(o['Reach']),
          views:    n(o['Views']),
          link:     o['Link to Post'] || '',
        }
      }).filter(a => a.account && a.postDate)
    const [leftAna, rightAna] = splitSideBySide(anlRows)
    data.analytics = [...parseAnaHalf(leftAna), ...parseAnaHalf(rightAna)]
  } catch (e) { console.warn('Analytics', e.message) }

  // Summary
  try {
    data.summary = toObjects(sumRows, 'quarter')
      .map(o => ({
        quarter: o['Quarter'] || '', account: o['Account'] || '',
        platform: o['Platform'] || '',
        totalPosts: o['Total Posts'] || '0',
        totalReach: o['Total Reach'] || '0',
        totalImpressions: o['Total Impressions'] || '0',
        totalEngagement: o['Total Engagement'] || '0',
        engagementRate: o['Engagement Rate %'] || '0',
        totalFollowers: o['Total Followers'] || '0',
        followerGrowth: o['Follower Growth %'] || '0',
      })).filter(s => s.quarter)
  } catch (e) { console.warn('Summary', e.message) }

  // Expenses
  try {
    const fetched = toObjects(expRows, 'expense id')
      .map(o => ({
        expenseId: o['TRACKER CA EMPLOYEE RELATION Expense ID'] || o['Expense ID'] || '',
        activityName: o['Activity Name'] || '',
        submissionAmount: o['Total Submission Amount'] || '',
        realizationAmount: o['Total Realization Amount'] || '',
        refundAmount: o['Total Refund'] || '',
        efficiencyRate: o['Efficiency Rate'] || '',
        status: o['Status'] || '',
        attachmentLink: o['Attachment Link / pdf'] || '',
      })).filter(e => e.expenseId)
    data.expenses = fetched.length > 0 ? fetched : FALLBACK_EXPENSES
  } catch (e) {
    console.warn('Expenses', e.message)
    data.expenses = FALLBACK_EXPENSES
  }

  return data
}

// ── HOOK ──────────────────────────────────────────────────────────────────────
export function useData() {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [syncTime,  setSyncTime]  = useState(localStorage.getItem('syncTime') || '')
  const [followers, setFollowers] = useState({})

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(`dashboardData_${CACHE_VERSION}`)
      const cachedAt = Number(localStorage.getItem(`cachedAt_${CACHE_VERSION}`) || 0)
      if (cached && Date.now() - cachedAt < 30 * 60 * 1000) {
        setData(JSON.parse(cached))
        setLoading(false)
        return
      }
    }
    try {
      const result = await fetchAll()
      setData(result)
      const t = new Date().toLocaleTimeString('id-ID')
      setSyncTime(t)
      localStorage.setItem(`dashboardData_${CACHE_VERSION}`, JSON.stringify(result))
      localStorage.setItem(`cachedAt_${CACHE_VERSION}`, Date.now().toString())
      localStorage.setItem('syncTime', t)
    } catch (e) {
      console.error(e)
      const cached = localStorage.getItem(`dashboardData_${CACHE_VERSION}`)
      if (cached) setData(JSON.parse(cached))
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Instagram followers from backend (best-effort; silent if server offline)
  const loadFollowers = useCallback(async () => {
    try {
      const res = await fetch('/api/followers', { signal: AbortSignal.timeout(10000) })
      if (!res.ok) return
      const json = await res.json()
      setFollowers(json)
      localStorage.setItem('igFollowers', JSON.stringify({ data: json, at: Date.now() }))
    } catch {
      // Server not running or Instagram blocked — restore last cached value
      try {
        const saved = localStorage.getItem('igFollowers')
        if (saved) setFollowers(JSON.parse(saved).data ?? {})
      } catch { /* nothing */ }
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    loadFollowers()
    const id = setInterval(loadFollowers, 6 * 60 * 60 * 1000) // refresh every 6 h
    return () => clearInterval(id)
  }, [loadFollowers])

  return { data, loading, syncTime, followers, refresh: () => load(true) }
}
