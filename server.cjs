const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SHEET_ID = '1qgzmEsj05nX3jG9FXvJAKUiwb9vsEEyJ';

const GID = {
  HAI:        1900501093,
  HAP:        365908305,
  ASI:        1013625013,
  BPN:        1788001658,
  CMS:        1049031440,
  IAS:        1580056170,
  HPA:        416583594,
  EVENTS:     2073599314,
  VOLUNTEERS: 438811308,
  SPORTS:     1381604071,
  POSTS:      1622996405,
  ANALYTICS:  2037837739,
  SUMMARY:    1178967585,
  EXPENSES:   959874552,
};

let cachedData = null;
let lastSyncTime = 0;
const CACHE_DURATION = 30 * 60 * 1000;

// CSV parser — handles quoted fields with commas and escaped quotes
function parseCSV(text) {
  const rows = [];
  const lines = text.replace(/\r/g, '').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = [];
    let cell = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cell += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    rows.push(cells);
  }
  return rows;
}

// Fetch sheet by GID using public gviz CSV endpoint
async function fetchGID(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const r = await axios.get(url, { timeout: 20000 });
  return parseCSV(r.data);
}

// Convert rows to objects; finds header row by looking for `anchor` column name
function toObjects(rows, anchor) {
  let hi = rows.findIndex(r =>
    r.some(c => c.toLowerCase().trim() === anchor.toLowerCase())
  );
  if (hi === -1) hi = 0;
  const headers = rows[hi];
  return rows.slice(hi + 1)
    .filter(r => r.some(c => c))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h.trim()] = (r[i] || '').trim(); });
      return obj;
    });
}

// ── FETCH ALL DATA ────────────────────────────────────────────────────────────
async function fetchAll() {
  const data = {
    employees: [], events: [], volunteers: [],
    sports: [], posts: [], analytics: [],
    summary: [], expenses: [],
    syncTime: new Date().toISOString(),
  };

  // Employees (7 entities)
  const entitySheets = [
    { gid: GID.HAI, entity: 'HAI' },
    { gid: GID.HAP, entity: 'HAP' },
    { gid: GID.ASI, entity: 'ASI' },
    { gid: GID.BPN, entity: 'BPN' },
    { gid: GID.CMS, entity: 'CMS' },
    { gid: GID.IAS, entity: 'IAS' },
    { gid: GID.HPA, entity: 'HPA' },
  ];
  for (const { gid, entity } of entitySheets) {
    try {
      const rows = await fetchGID(gid);
      const objs = toObjects(rows, 'full name');
      const employees = objs.map(o => ({
        nik:           o['EMPLOYEE ID'] || o['EMPLOYEE ID PKWT'] || '',
        nama:          o['FULL NAME']   || o['NAMA']             || '',
        jobLevel:      o['JOB LEVEL']   || '',
        jobTitle:      o['JOB TITLE']   || '',
        birthPlace:    o['BIRTH PLACE'] || '',
        birthDate:     o['BIRTH DATE']  || '',
        personalEmail: o['PERSONAL EMAIL'] || '',
        email:         o['EMPLOYEE EMAIL'] || '',
        entity,
      })).filter(e => e.nik);
      data.employees.push(...employees);
      console.log(`  ✓ ${entity}: ${employees.length}`);
    } catch (e) { console.warn(`  ⚠ ${entity}:`, e.message); }
  }

  // Internal Events
  try {
    const rows = await fetchGID(GID.EVENTS);
    data.events = toObjects(rows, 'event name').map(o => ({
      eventName:   o['Event Name']  || '',
      date:        o['Date']        || '',
      venue:       o['Venue']       || '',
      description: o['Description'] || '',
      organizer:   o['Organizer']   || '',
      status:      o['Status']      || '',
      budget:      o['Budget']      || '',
    })).filter(e => e.eventName);
    console.log(`  ✓ Events: ${data.events.length}`);
  } catch (e) { console.warn('  ⚠ Events:', e.message); }

  // Volunteers
  try {
    const rows = await fetchGID(GID.VOLUNTEERS);
    data.volunteers = toObjects(rows, 'volunteer name').map(o => ({
      eventName:     o['Event Name']      || '',
      volunteerName: o['Volunteer Name']  || '',
      nik:           o['NIK']             || '',
      role:          o['Role']            || '',
      entity:        o['Divisi / Entity'] || '',
      status:        o['Status']          || '',
    })).filter(v => v.volunteerName);
    console.log(`  ✓ Volunteers: ${data.volunteers.length}`);
  } catch (e) { console.warn('  ⚠ Volunteers:', e.message); }

  // Sports
  try {
    const rows = await fetchGID(GID.SPORTS);
    data.sports = toObjects(rows, 'sport category').map(o => ({
      category:    o['Sport Category']   || '',
      participant: o['Participant Name'] || '',
      nik:         o['NIK']              || '',
      entity:      o['Divisi / Entity']  || '',
      date:        o['Date']             || '',
      status:      o['Status']           || '',
    })).filter(s => s.participant);
    console.log(`  ✓ Sports: ${data.sports.length}`);
  } catch (e) { console.warn('  ⚠ Sports:', e.message); }

  // Social Media Posts (dual-table: two accounts side by side)
  try {
    const rows = await fetchGID(GID.POSTS);
    const hi = rows.findIndex(r => r[0]?.toLowerCase() === 'account');
    if (hi !== -1) {
      const sep = rows[hi].findIndex((h, i) => i > 0 && !h);
      const s2 = sep > 0 ? sep + 1 : 8;
      for (const row of rows.slice(hi + 1)) {
        if (!row.some(c => c)) continue;
        if (row[0]) data.posts.push({ account: row[0], platform: row[1], postDate: row[2], postType: row[3], caption: row[4], contentLink: row[5], status: row[6] });
        if (row[s2]) data.posts.push({ account: row[s2], platform: row[s2+1], postDate: row[s2+2], postType: row[s2+3], caption: row[s2+4], contentLink: row[s2+5], status: row[s2+6] });
      }
    }
    console.log(`  ✓ Posts: ${data.posts.length}`);
  } catch (e) { console.warn('  ⚠ Posts:', e.message); }

  // Social Media Analytics (dual-table)
  try {
    const rows = await fetchGID(GID.ANALYTICS);
    const hi = rows.findIndex(r => r[0]?.toLowerCase() === 'account');
    if (hi !== -1) {
      for (const row of rows.slice(hi + 1)) {
        if (!row.some(c => c)) continue;
        if (row[0]) data.analytics.push({ account: row[0], platform: row[1], postDate: row[2], postType: row[3], likes: row[4], shares: row[5], reach: row[6], views: row[7], link: row[8] });
        if (row[10]) data.analytics.push({ account: row[10], platform: row[11], postDate: row[12], postType: row[13], likes: row[14], shares: row[15], reach: row[16], views: row[17], link: row[18] });
      }
    }
    console.log(`  ✓ Analytics: ${data.analytics.length}`);
  } catch (e) { console.warn('  ⚠ Analytics:', e.message); }

  // Social Media Summary
  try {
    const rows = await fetchGID(GID.SUMMARY);
    data.summary = toObjects(rows, 'quarter').map(o => ({
      quarter:          o['Quarter']          || '',
      account:          o['Account']          || '',
      platform:         o['Platform']         || '',
      totalPosts:       o['Total Posts']       || '0',
      totalReach:       o['Total Reach']       || '0',
      totalImpressions: o['Total Impressions'] || '0',
      totalEngagement:  o['Total Engagement']  || '0',
      engagementRate:   o['Engagement Rate %'] || '0',
      totalFollowers:   o['Total Followers']   || '0',
      followerGrowth:   o['Follower Growth %'] || '0',
    })).filter(s => s.quarter);
    console.log(`  ✓ Summary: ${data.summary.length}`);
  } catch (e) { console.warn('  ⚠ Summary:', e.message); }

  // Expenses
  try {
    const rows = await fetchGID(GID.EXPENSES);
    data.expenses = toObjects(rows, 'expense id').map(o => ({
      expenseId:         o['Expense ID']              || '',
      activityName:      o['Activity Name']            || '',
      submissionAmount:  o['Total Submission Amount']  || '',
      realizationAmount: o['Total Realization Amount'] || '',
      refundAmount:      o['Total Refund']             || '',
      efficiencyRate:    o['Efficiency Rate']          || '',
      status:            o['Status']                   || '',
      attachmentLink:    o['Attachment Link / pdf']    || '',
    })).filter(e => e.expenseId);
    console.log(`  ✓ Expenses: ${data.expenses.length}`);
  } catch (e) { console.warn('  ⚠ Expenses:', e.message); }

  return data;
}

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedData && (now - lastSyncTime) < CACHE_DURATION) {
      return res.json(cachedData);
    }
    console.log('\n🔄 Fetching fresh data...');
    cachedData = await fetchAll();
    lastSyncTime = now;
    console.log(`✅ Done — ${cachedData.employees.length} karyawan\n`);
    res.json(cachedData);
  } catch (err) {
    console.error('❌', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/refresh', async (req, res) => {
  cachedData = null;
  lastSyncTime = 0;
  try {
    cachedData = await fetchAll();
    lastSyncTime = Date.now();
    res.json(cachedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  cache: cachedData ? `${cachedData.employees.length} employees` : 'empty',
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}\n`);
});
