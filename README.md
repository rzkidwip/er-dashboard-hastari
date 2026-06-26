# Portal ER Hastari Corp - Dashboard

**Modern Employee Relations Dashboard dengan data sync langsung dari Google Sheets**

---

## 📋 Struktur Project

```
portal-er-hastari/
├── server.js          # Backend Node.js + Express
├── index.html         # Frontend Dashboard (HTML + JavaScript)
├── package.json       # Dependencies
└── README.md          # This file
```

---

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
npm install
```

### **2. Run Backend Server**
```bash
npm start
```

Server akan berjalan di:
- **URL:** http://localhost:5000
- **API:** http://localhost:5000/api/data

### **3. Buka Browser**
```
http://localhost:5000
```

Dashboard akan otomatis load dan menampilkan data dari Google Sheets!

---

## 📊 Fitur

✅ **Real-time Data Sync** - Fetch langsung dari Google Sheets  
✅ **Auto-refresh** - Data update setiap 30 detik  
✅ **Caching** - Data di-cache untuk performa cepat  
✅ **Multiple Sections:**
  - Dashboard (KPI Cards)
  - Karyawan (Employee Data)
  - Events (Internal Events)
  - Sports (Sports Participation)
  - Social Media (Posts & Engagement)
  - Expenses (Budget Tracking)

✅ **Responsive Design** - Mobile-friendly interface  
✅ **Error Handling** - Fallback ke cache jika error

---

## 🔌 API Endpoints

### `GET /api/data`
Fetch semua data dari Google Sheets

**Response:**
```json
{
  "employees": [...],
  "events": [...],
  "volunteers": [...],
  "sports": [...],
  "posts": [...],
  "expenses": [...],
  "syncTime": "2024-06-22T10:30:45.000Z"
}
```

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-06-22T10:30:45.000Z",
  "cachedData": "50 employees loaded"
}
```

---

## 📱 Frontend Features

### Dashboard
- 5 KPI Cards (Total Employees, Birthdays, Events, Posts, Budget)
- Automatic calculations
- Real-time updates

### Karyawan Section
- Data table dengan 50+ employees
- Show: NIK, Nama, Email, Posisi, Entity
- Sortable & searchable

### Events Section
- Grid view semua events
- Status badges (Planning, Ongoing, Completed)
- Event details: Date, Venue, Budget

### Sports Section
- Table dengan semua sports participants
- Filter by category
- Status tracking

### Social Media Section
- Grid view posts
- Platform info (IG, TikTok, YouTube, LinkedIn)
- Caption preview

### Expenses Section
- Budget tracking table
- Show: ID, Activity, Amount, Realization, Status
- Budget calculations

---

## 🔄 Data Flow

```
Google Sheets
    ↓
server.js (Backend)
    ├─ Fetch dari 7 employee sheets
    ├─ Fetch events, sports, posts, expenses
    └─ Cache data (30 menit)
    ↓
API: /api/data
    ↓
index.html (Frontend)
    ├─ Load dari cache (instant)
    ├─ Fetch fresh data (background)
    └─ Auto-update setiap 30 detik
    ↓
Dashboard Display
```

---

## 📧 Google Sheets Structure

**Sheet ID:** `1qgzmEsj05nX3jG9FXvJAKUiwb9vsEEyJ`

**Sheets yang di-sync:**
- HAI, HAP, ASI, BPN, CMS, IAS, HPA (Employee data)
- INTERNAL_EVENTS (Events)
- EVENT_VOLUNTEERS (Volunteers)
- SPORTS_EVENTS (Sports)
- SOCIAL_MEDIA_POSTS (Posts)
- POST_PERFORMANCE (Performance)
- QUARTERLY_ANALYTICS (Analytics)
- EXPENSE_TRACKER (Expenses)

---

## 🛠️ Customization

### Change API Port
```javascript
// server.js
const PORT = process.env.PORT || 5000; // Change 5000 to desired port
```

### Change Cache Duration
```javascript
// server.js
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
```

### Change Auto-sync Interval
```javascript
// index.html
setInterval(syncData, 30000); // 30 seconds - change to desired interval
```

---

## 🌐 Deploy to Production

### Option 1: Render.com (Recommended)
1. Push to GitHub
2. Connect Render.com to GitHub repo
3. Deploy
4. Get public URL

### Option 2: Railway.app
1. Connect GitHub
2. Deploy from Railway dashboard
3. Get public URL

### Option 3: Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Update Frontend API URL
```javascript
// index.html
const API_URL = 'https://your-deployed-backend.com/api/data';
```

---

## 🔍 Troubleshooting

### "Cannot connect to server"
- ✅ Make sure `npm start` is running
- ✅ Check if port 5000 is available
- ✅ Check backend console for errors

### "No data showing"
- ✅ Check browser console (F12) for errors
- ✅ Verify Google Sheets is accessible
- ✅ Check if sheet names match exactly

### "Data not updating"
- ✅ Wait 30 seconds (auto-sync interval)
- ✅ Click "Sync" button to manual refresh
- ✅ Check browser cache: Ctrl+Shift+Delete

---

## 📝 Console Logs

Backend will show:
```
🔄 Fetching fresh data from Google Sheets...
📥 Fetching HAI: 50 rows
✓ Loaded 50 from HAI
📥 Fetching HAP: 12 rows
✓ Loaded 12 from HAP
...
✅ DATA SYNC COMPLETE!
   Employees: 101
   Events: 10
   ...
```

Frontend will show:
```
🚀 Portal ER Dashboard Loaded
🔄 Syncing data from backend...
✅ Data synced successfully!
⏰ Auto-syncing...
```

---

## 📞 Support

For issues or questions:
1. Check browser console (F12)
2. Check backend terminal logs
3. Verify Google Sheets access
4. Check API endpoint: http://localhost:5000/api/data

---

**Version:** 1.0.0  
**Last Updated:** June 22, 2024  
**Author:** Rizki Dwi Pangestu
