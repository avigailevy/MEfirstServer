const { google } = require('googleapis');
const path = require('path');

// יוצרים את האותנטיקציה דרך GoogleAuth
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, './mefirst-cloud-c0aa7e33be18.json'), // הנתיב לקובץ השירות שלך
  scopes: ['https://www.googleapis.com/auth/drive'],
});

// יוצרים מופע של Google Drive API
const drive = google.drive({
  version: 'v3',
  auth,
});

module.exports = { drive };
