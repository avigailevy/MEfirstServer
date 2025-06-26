const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { google } = require('googleapis');

// ----------- הגדרות -----------
const CREDENTIALS_PATH = path.join(__dirname, 'mefirst-cloud-c0aa7e33be18.json'); // נתיב לקובץ מפתח שירות Google
const SCOPES = ['https://www.googleapis.com/auth/drive']; // הרשאות דרייב
const localFolderPath = path.join(__dirname, 'templates'); // תיקייה מקומית עם הקבצים להעלאה
const folderName = 'Original Documents'; // שם תיקייה בדרייב להעלאת הקבצים

// הגדרות חיבור למסד נתונים MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Ofakim123',
  database: 'MEfirstDB',
};

// ---------- פונקציית עזר - יצירת auth ו-drive ----------
async function getDrive() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  return google.drive({ version: 'v3', auth: authClient });
}

// ---------- פונקציות עזר ----------
function getMimeType(fileName) {
  if (fileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (fileName.endsWith('.doc')) return 'application/msword';
  if (fileName.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

function getDocTypeFromFileName(fileName) {
  const map = {
    CIF: 'CIF',
    '9CheckList': '9CheckList',
    RFQ: 'RFQ',
    LOI: 'LOI',
    FCO: 'FCO',
    SPA: 'SPA',
    ICPO: 'ICPO',
    Summaries: 'Summaries',
    Quote: 'Quote',
  };
  const baseName = fileName.split('.')[0];
  return map[baseName] || null;
}

async function createFolder(drive, name, parentId = null) {
  const res = await drive.files.create({
    resource: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });
  return res.data.id;
}

async function getFolderByName(drive, name, parentId = null) {
  let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  return res.data.files.length ? res.data.files[0].id : null;
}

// ---------- פונקציית main ----------
async function main() {
  try {
    // אתחול Google Drive API
    const drive = await getDrive();

    // התחברות למסד הנתונים
    const connection = await mysql.createConnection(dbConfig);

    // חיפוש תיקייה או יצירתה אם לא קיימת
    let folderId = await getFolderByName(drive, folderName);
    if (!folderId) {
      folderId = await createFolder(drive, folderName);
      console.log(`📁 נוצרה תיקייה: ${folderName}`);
    }

    // הגדרות קבועות להוספה למסד
    const project_id = 1;
    const uploaded_by = 3;
    const doc_version = 'v1';
    const stage_id = null;

    // קריאת כל הקבצים מהתיקייה המקומית
    const files = fs.readdirSync(localFolderPath);

    for (const fileName of files) {
      const doc_type = getDocTypeFromFileName(fileName);
      if (!doc_type) {
        console.warn(`⚠️ לא מזוהה doc_type עבור: ${fileName} — מדלג`);
        continue;
      }

      const filePath = path.join(localFolderPath, fileName);
      const mimeType = getMimeType(fileName);

      // הכנת המטא-דאטה להעלאה
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };
      const media = {
        mimeType,
        body: fs.createReadStream(filePath),
      };

      // העלאת הקובץ ל-Google Drive
      const fileRes = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, webViewLink',
      });

      const fileId = fileRes.data.id;
      const fileLink = fileRes.data.webViewLink;

      // הפיכת הקובץ לציבורי עם הרשאת עריכה לכל מי שיש לו קישור
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'writer', // הרשאה לעריכה
          type: 'anyone', // לכל מי שיש לו קישור
        },
      });

      console.log(`✅ הועלה + הוגדרה הרשאת עריכה: ${fileName} => ${fileLink}`);

      // שמירת פרטי הקובץ במסד הנתונים
      try {
        await connection.execute(
          `INSERT INTO documents (project_id, stage_id, doc_type, doc_version, file_path, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [project_id, stage_id, doc_type, doc_version, fileLink, uploaded_by]
        );
        console.log(`💾 נשמר במסד: ${fileName}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.warn(`🔁 כפילות במסד עבור doc_type ${doc_type}`);
        } else {
          console.error('❌ שגיאה במסד הנתונים:', err.message);
        }
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ שגיאה בתהליך:', error);
  }
}

// הפעלת הפונקציה הראשית
main();
