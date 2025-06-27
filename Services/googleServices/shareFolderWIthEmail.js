const { google } = require('googleapis');
const path = require('path');

// הגדרות
const CREDENTIALS_PATH = path.join(__dirname, 'mefirst-cloud-c0aa7e33be18.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const EMAIL_TO_SHARE = 'malkiesobel@gmail.com'; // ← כתובת המייל שאת רוצה לשתף איתה
const FOLDER_NAMES = ['Projects', 'Original Documents']; // ← שמות התיקיות לשיתוף

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  for (const folderName of FOLDER_NAMES) {
    const folderId = await getFolderIdByName(drive, folderName);
    if (!folderId) {
      console.warn(`⚠️ לא נמצאה תיקייה בשם: ${folderName}`);
      continue;
    }

    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          type: 'user',
          role: 'writer', 
          emailAddress: EMAIL_TO_SHARE,
        },
        fields: 'id',
      });
      console.log(`📁 התיקייה "${folderName}" (ID: ${folderId}) שותפה עם ${EMAIL_TO_SHARE}`);
    } catch (err) {
      console.error(`❌ שגיאה בשיתוף התיקייה "${folderName}": ${err.message}`);
    }
  }
}

// פונקציה למציאת ID של תיקייה לפי שם
async function getFolderIdByName(drive, name) {
  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  return res.data.files.length ? res.data.files[0].id : null;
}

main().catch(console.error);
