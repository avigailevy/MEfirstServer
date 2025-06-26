const fs = require('fs');
// מייבא את מודול מערכת הקבצים לקריאה וכתיבה מקומית
const path = require('path');
// מייבא את מודול ניהול נתיבי קבצים ותיקיות
const mysql = require('mysql2/promise');
// מייבא את ספריית mysql2 עם תמיכה בהבטחות (Promises) לתקשורת עם מסד הנתונים
const { google } = require('googleapis');
// מייבא את ספריית Google API המאפשרת עבודה עם שירותי Google
const dbConfig = require('../db');
// מייבא הגדרות חיבור למסד הנתונים מתוך קובץ חיצוני
const CREDENTIALS_PATH = 'mefirst-cloud-c0aa7e33be18.json'; // service-account.json
// נתיב לקובץ מפתחות השירות (Service Account) של Google
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// הרשאות גישה דרושות ל-Google Drive API
const localFolderPath = 'C:\Users\aviga\source\repos\MEfirstServer\API\meFirst';
// תיקייה מקומית שממנה נרצה להעלות קבצים
const folderName = 'Original Documents';
// שם התיקייה בגוגל דרייב אליה נטען את הקבצים
const drive = require('../googleServices/googleDrive')
// יצירת מופע של Google Drive API עם האוטנטיקציה
const auth = require('../googleServices/googleAuth')
// אתחול האוטנטיקציה ל-Google API עם מפתח השירות ויצירת לקוח Drive API

async function main() {

    // התחברות למסד הנתונים עם ההגדרות שהוגדרו
    const connection = await mysql.createConnection(dbConfig);

    // 1. חיפוש תיקייה בשם "Original Documents" בגוגל דרייב
    let folderId = await getFolderByName(drive, folderName);

    // אם לא קיימת התיקייה – יצירתה
    if (!folderId) {
        folderId = await createFolder(drive, folderName);
        console.log(`📁 נוצרה תיקיה: ${folderName}`);
    }

    // 2. פרטים קבועים שישמשו להוספת הרשומות במסד הנתונים
    const project_id = 1;
    const uploaded_by = 3;
    const doc_version = 'v1';
    const stage_id = null;

    // קריאת רשימת הקבצים בתיקייה המקומית
    const files = fs.readdirSync(localFolderPath);

    // לולאה על כל קובץ בתיקייה
    for (const fileName of files) {
        // ניסיון להוציא סוג מסמך מתוך שם הקובץ
        const doc_type = getDocTypeFromFileName(fileName);

        // אם סוג המסמך לא מזוהה – דילוג על הקובץ
        if (!doc_type) {
            console.warn(`⚠️ לא מזוהה doc_type עבור: ${fileName} — מדלג`);
            continue;
        }

        // בניית הנתיב המלא לקובץ
        const filePath = path.join(localFolderPath, fileName);

        // קבלת סוג הקובץ (MIME) לפי סיומת הקובץ
        const mimeType = getMimeType(fileName);

        // מידע על הקובץ שנטען ל-Drive: שם, תיקייה הורה
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        // גוף הקובץ והסוג שלו להעלאה
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

        // שמירת מזהה הקובץ וקישור הצפייה
        const fileId = fileRes.data.id;
        const fileLink = fileRes.data.webViewLink;

        // הפיכת הקובץ לציבורי עם הרשאת עריכה לכולם עם הקישור
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'writer', // הרשאה לעריכה
                type: 'anyone', // לכל אחד עם הקישור
            },
        });

        // הדפסת הודעה להצלחה עם הקישור
        console.log(`✅ הועלה + שותף לצפייה: ${fileName} => ${fileLink}`);

        // 3. שמירת פרטי הקובץ במסד הנתונים
        try {
            await connection.execute(
                `INSERT INTO documents (project_id, stage_id, doc_type, doc_version, file_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [project_id, stage_id, doc_type, doc_version, fileLink, uploaded_by]
            );
            console.log(`💾 נשמר במסד: ${fileName}`);
        } catch (err) {
            // טיפול בכפילות (אם כבר קיים מסמך כזה)
            if (err.code === 'ER_DUP_ENTRY') {
                console.warn(`🔁 כפילות במסד עבור doc_type ${doc_type}`);
            } else {
                console.error('❌ שגיאה ב-DB:', err.message);
            }
        }
    }

    // סגירת החיבור למסד הנתונים בסיום
    await connection.end();
}

// ---------------- פונקציות עזר ----------------

// קבלת MIME type לפי סיומת הקובץ
function getMimeType(fileName) {
    if (fileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (fileName.endsWith('.doc')) return 'application/msword';
    if (fileName.endsWith('.pdf')) return 'application/pdf';
    return 'application/octet-stream'; // סוג כללי לקבצים לא מזוהים
}

// הפקת סוג המסמך לפי שם הקובץ (לפי מילון)
function getDocTypeFromFileName(fileName) {
    const map = {
        'CIF': 'CIF',
        '9CheckList': '9CheckList',
        'RFQ': 'RFQ',
        'LOI': 'LOI',
        'FCO': 'FCO',
        'SPA': 'SPA',
        'ICPO': 'ICPO',
        'Summaries': 'Summaries',
        'Quote': 'Quote',
    };
    const baseName = fileName.split('.')[0]; // לוקח את השם בלי הסיומת
    return map[baseName] || null; // מחזיר את סוג המסמך או null אם לא נמצא
}

// יצירת תיקייה חדשה ב-Drive (עם שם ואופציונלי תיקיית אב)
async function createFolder(drive, name, parentId = null) {
    const res = await drive.files.create({
        resource: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : [],
        },
        fields: 'id',
    });
    return res.data.id; // מחזיר את מזהה התיקייה החדשה
}

// חיפוש תיקייה לפי שם (ואופציונלי תיקיית אב)
async function getFolderByName(drive, name, parentId = null) {
    let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) query += ` and '${parentId}' in parents`;

    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    // מחזיר את מזהה התיקייה הראשונה שמצא או null אם לא קיימת
    return res.data.files.length ? res.data.files[0].id : null;
}

// קריאה לפונקציה הראשית והדפסת שגיאות אם יש
main().catch(console.error);
