const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Spreadsheet config
const SHEET_ID = '1qgzmEsj05nX3jG9FXvJAKUiwb9vsEEyJ';

// Cache data (30 menit)
let cachedData = null;
let lastSyncTime = 0;
const CACHE_DURATION = 30 * 60 * 1000;

// API: Get all data
app.get('/api/data', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cache jika masih fresh
    if (cachedData && (now - lastSyncTime) < CACHE_DURATION) {
      console.log('📦 Returning cached data');
      return res.json(cachedData);
    }
    
    console.log('🔄 Fetching fresh data from Google Sheets...');
    
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.loadInfo();
    
    let data = {
      employees: [],
      events: [],
      volunteers: [],
      sports: [],
      posts: [],
      expenses: [],
      syncTime: new Date().toISOString()
    };
    
    // Fetch employees dari 7 sheets
    const employeeSheets = ['HAI', 'HAP', 'ASI', 'BPN', 'CMS', 'IAS', 'HPA'];
    
    for (const sheetName of employeeSheets) {
      try {
        const sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) {
          console.log(`⚠️ Sheet ${sheetName} not found`);
          continue;
        }
        
        const rows = await sheet.getRows();
        console.log(`📥 Fetching ${sheetName}: ${rows.length} rows`);
        
        const employees = rows.map(row => ({
          no: row.get('NO'),
          nik: row.get('EMPLOYEE ID'),
          nama: row.get('FULL NAME'),
          jobLevel: row.get('JOB LEVEL'),
          jobTitle: row.get('JOB TITLE'),
          birthPlace: row.get('BIRTH PLACE'),
          birthDate: row.get('BIRTH DATE'),
          personalEmail: row.get('PERSONAL EMAIL'),
          email: row.get('EMPLOYEE EMAIL'),
          entity: sheetName
        })).filter(e => e.nik && String(e.nik).trim());
        
        data.employees = data.employees.concat(employees);
        console.log(`✓ Loaded ${employees.length} from ${sheetName}`);
        
      } catch (e) {
        console.log(`⚠️ Error loading ${sheetName}:`, e.message);
      }
    }
    
    // Fetch events
    try {
      const sheet = doc.sheetsByTitle['INTERNAL_EVENTS'];
      if (sheet) {
        const rows = await sheet.getRows();
        console.log(`📥 Fetching INTERNAL_EVENTS: ${rows.length} rows`);
        data.events = rows.map(row => ({
          eventName: row.get('Event Name'),
          date: row.get('Date'),
          endDate: row.get('End Date'),
          category: row.get('Category'),
          venue: row.get('Venue'),
          description: row.get('Description'),
          organizer: row.get('Organizer'),
          status: row.get('Status'),
          budget: row.get('Budget')
        })).filter(e => e.eventName && String(e.eventName).trim());
        console.log(`✓ Loaded ${data.events.length} events`);
      }
    } catch (e) {
      console.log('⚠️ Error loading events:', e.message);
    }
    
    // Fetch volunteers
    try {
      const sheet = doc.sheetsByTitle['EVENT_VOLUNTEERS'];
      if (sheet) {
        const rows = await sheet.getRows();
        console.log(`📥 Fetching EVENT_VOLUNTEERS: ${rows.length} rows`);
        data.volunteers = rows.map(row => ({
          eventName: row.get('Event Name'),
          volunteerName: row.get('Volunteer Name'),
          nik: row.get('NIK'),
          role: row.get('Role'),
          department: row.get('Department'),
          status: row.get('Status')
        })).filter(v => v.eventName && String(v.eventName).trim());
        console.log(`✓ Loaded ${data.volunteers.length} volunteers`);
      }
    } catch (e) {
      console.log('⚠️ Error loading volunteers:', e.message);
    }
    
    // Fetch sports
    try {
      const sheet = doc.sheetsByTitle['SPORTS_EVENTS'];
      if (sheet) {
        const rows = await sheet.getRows();
        console.log(`📥 Fetching SPORTS_EVENTS: ${rows.length} rows`);
        data.sports = rows.map(row => ({
          category: row.get('Sport Category'),
          participant: row.get('Participant Name'),
          nik: row.get('NIK'),
          department: row.get('Department'),
          date: row.get('Date'),
          status: row.get('Status')
        })).filter(s => s.category && String(s.category).trim());
        console.log(`✓ Loaded ${data.sports.length} sports`);
      }
    } catch (e) {
      console.log('⚠️ Error loading sports:', e.message);
    }
    
    // Fetch posts
    try {
      const sheet = doc.sheetsByTitle['SOCIAL_MEDIA_POSTS'];
      if (sheet) {
        const rows = await sheet.getRows();
        console.log(`📥 Fetching SOCIAL_MEDIA_POSTS: ${rows.length} rows`);
        data.posts = rows.map(row => ({
          account: row.get('Account'),
          platform: row.get('Platform'),
          postDate: row.get('Post Date'),
          postType: row.get('Post Type'),
          caption: row.get('Caption'),
          contentLink: row.get('Link to Content'),
          status: row.get('Publish Status')
        })).filter(p => p.account && String(p.account).trim());
        console.log(`✓ Loaded ${data.posts.length} posts`);
      }
    } catch (e) {
      console.log('⚠️ Error loading posts:', e.message);
    }
    
    // Fetch expenses
    try {
      const sheet = doc.sheetsByTitle['EXPENSE_TRACKER'];
      if (sheet) {
        const rows = await sheet.getRows();
        console.log(`📥 Fetching EXPENSE_TRACKER: ${rows.length} rows`);
        data.expenses = rows.map(row => ({
          expenseId: row.get('Expense ID'),
          activityName: row.get('Activity Name'),
          submissionDate: row.get('Submission Date'),
          submissionAmount: row.get('Submission Amount (Rp)'),
          realizationDate: row.get('Realization Date'),
          realizationAmount: row.get('Realization Amount (Rp)'),
          refundAmount: row.get('Refund Amount (Rp)'),
          status: row.get('Status'),
          attachmentLink: row.get('Attachment Link')
        })).filter(e => e.expenseId && String(e.expenseId).trim());
        console.log(`✓ Loaded ${data.expenses.length} expenses`);
      }
    } catch (e) {
      console.log('⚠️ Error loading expenses:', e.message);
    }
    
    // Cache data
    cachedData = data;
    lastSyncTime = now;
    
    console.log('\n✅ DATA SYNC COMPLETE!');
    console.log(`   Employees: ${data.employees.length}`);
    console.log(`   Events: ${data.events.length}`);
    console.log(`   Volunteers: ${data.volunteers.length}`);
    console.log(`   Sports: ${data.sports.length}`);
    console.log(`   Posts: ${data.posts.length}`);
    console.log(`   Expenses: ${data.expenses.length}\n`);
    
    res.json(data);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force refresh: clear cache lalu redirect ke /api/data untuk fetch ulang dari Sheets
app.get('/api/refresh', (req, res) => {
  cachedData = null;
  lastSyncTime = 0;
  console.log('🔁 Cache cleared, forcing fresh fetch...');
  res.redirect('/api/data');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cachedData: cachedData ? `${cachedData.employees.length} employees loaded` : 'No cache'
  });
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/data`);
  console.log(`✅ Open browser and go to http://localhost:${PORT}\n`);
});
