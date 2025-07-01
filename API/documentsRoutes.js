const { google } = require('googleapis');
const router = require('express').Router({ mergeParams: true });
const genericServices = require('../Services/genericServices');
const googleDocsService = require('../services/googleServices/googleDocsService');
const { drive } = require('../Services/googleServices/googleDrive');
const auth = require('../Services/googleServices/googleAuth');
const { authenticateToken } = require('./middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // שמירה זמנית של קבצים בתיקיית uploads

// Returns the next version number and latest file ID for a document type in a folder
async function getNextVersion(drive, folderId, docType) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and name contains '${docType}_v'`,
    fields: 'files(id, name)',
  });

  // regex שמתאים לשמות שמתחילים ב־docType ואחריו כל תו כלשהו ואז _v ומספר
  const regex = new RegExp(`^${docType}.*_v(\\d+)`);
  let maxVersion = 0;
  let latestFileId = null;

  for (const file of res.data.files) {
    const match = file.name.match(regex);
    if (match) {
      const version = parseInt(match[1]);
      if (version > maxVersion) {
        maxVersion = version;
        latestFileId = file.id;
      }
    }
  }

  return {
    nextVersion: maxVersion + 1,
    latestFileId,
  };
}
// Finds and returns the folder ID by its name and optional parent folder ID; returns null if not found
async function findFolderIdByName(folderName, parentFolderId = null) {
  const drive = google.drive({ version: 'v3', auth: await auth.getClient() });

  let q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }

  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files.length === 0) {
    return null; // לא נמצאה תיקיה כזו
  }

  return res.data.files[0].id; // מחזיר את ה-id של התיקיה הראשונה שנמצאה
}
// Returns the folder ID of the "Original Documents" folder; throws error if not found
async function getOriginalDocumentsFolderId() {
  try {
    const res = await drive.files.list({
      q: `name='Original Documents' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });
    if (!res.data.files.length) throw new Error("Original Documents folder not found");
    return res.data.files[0].id;
  } catch (error) {
    console.error("Error getting Original Documents folder ID:", error);
    throw error;
  }
}
// Returns all original document files (not folders) in a given folder ID
async function getOriginalDocs(folderId) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });
    return res.data.files;
  } catch (error) {
    console.error("Error getting original docs from folder:", error);
    throw error;
  }
}
// Returns the file_path (Google Doc link) for a document by projectId and docType
router.get('/getFilePath/:projectId/:docType', authenticateToken, async (req, res) => {
  try {
    const { projectId, docType } = req.params;
    const results = await genericServices.getRecordsByMultipleConditions('documents', ['file_path'], { project_id: projectId, doc_type: docType });
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ file_path: results[0].file_path });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving Google Doc');
  }
});
// Copies the latest version of a document (by docType) in a project folder, creates a new version, saves it in DB, and returns info about the new copy
router.post('/copy', authenticateToken, async (req, res) => {
  try {
    const { projectId, docType, stageId, userId } = req.body;
    console.log('projectId:', projectId, typeof projectId);
    console.log('docType:', docType, typeof docType);
    console.log('stageId:', stageId, typeof stageId);
    console.log('userId:', userId, typeof userId);
    if (!projectId || !docType || !stageId || !userId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }


    const drive = google.drive({ version: 'v3', auth: await auth.getClient() });

    // שלב 1: Projects → projectId → docType
    const projectsFolderId = await findFolderIdByName('Projects');
    if (!projectsFolderId) throw new Error('תיקיית Projects לא נמצאה');

    const projectFolderId = await findFolderIdByName(projectId, projectsFolderId);
    if (!projectFolderId) throw new Error(`תיקיית הפרויקט "${projectName}" לא נמצאה`);

    const targetFolderId = await findFolderIdByName(docType, projectFolderId);
    if (!targetFolderId) throw new Error(`תיקיית "${docType}" לא נמצאה בפרויקט "${projectId}"`);

    // שלב 2: חיפוש הקובץ האחרון בתיקיה לפי סוג המסמך
    const { nextVersion, latestFileId } = await getNextVersion(drive, targetFolderId, docType);

    if (!latestFileId) {
      throw new Error(`לא נמצא קובץ בשם "${docType}_vX" בתיקיית "${docType}" של הפרויקט "${projectId}"`);
    }

    const fileId = latestFileId;
    const newName = `${docType}_v${nextVersion}`;

    // שלב 4: שכפול
    const copyRes = await drive.files.copy({
      fileId,
      requestBody: {
        name: newName,
        parents: [targetFolderId],
      },
      fields: 'id, name, webViewLink',
    });

    const newDoc = {
      project_id: projectId,
      stage_id: stageId,
      doc_type: docType,
      doc_version: `v${nextVersion}`,
      file_path: `https://docs.google.com/document/d/${copyRes.data.id}/edit`,
      uploaded_by: userId
    };

    const saveInDB = await genericServices.createRecord('documents', newDoc);
    if (saveInDB) {
      console.log('New document created in DB');
    }

    res.status(200).json({
      success: true,
      fileId: copyRes.data.id,
      name: copyRes.data.name,
      version: nextVersion,
      link: copyRes.data.webViewLink,
    });

  } catch (err) {
    console.error('שגיאה בשכפול:', err.message);
    res.status(500).json({ error: 'Copy failed', message: err.message });
  }
});
// Creates a new project folder with subfolders and copies template documents into them, saving records in DB; returns info about created folders and docs
router.post('/newFolder', authenticateToken, async (req, res) => {
  try {
    const { name, parentName } = req.body;
    const { username } = req.user; // ← זה user מה-token, לא req.params

    // 1. חיפוש תיקיית האב
    const listResponse = await drive.files.list({
      q: `name='${parentName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    if (listResponse.data.files.length === 0) {
      console.error("Parent folder not found:", parentName);
      return res.status(404).json({ error: 'Parent folder not found' });
    }

    const parentId = listResponse.data.files[0].id;
    console.log(`✅ Parent folder found: ${parentName} → ID: ${parentId}`);

    // 2. יצירת תיקיית פרויקט ראשית
    const projectFolder = await drive.files.create({
      resource: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    const projectFolderId = projectFolder.data.id;
    console.log(`📁 Project folder created: ${name} → ID: ${projectFolderId}`);

    // 3. קבלת תיקיית התבניות והמסמכים בתוכה
    const templateFolderId = await getOriginalDocumentsFolderId();
    const templateDocs = await getOriginalDocs(templateFolderId);
    console.log(`📄 Found ${templateDocs.length} original documents`);

    const subFolders = ["CIF", "9CheckList", "RFQ", "LOI", "FCO", "SPA", "ICPO", "Summaries", "Quote"];
    const createdFolders = [];

    for (const folderName of subFolders) {
      // 4. יצירת תיקיית משנה
      const subFolder = await drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [projectFolderId],
        },
        fields: 'id',
      });

      const subFolderId = subFolder.data.id;
      console.log(`📂 Subfolder created: ${folderName} → ID: ${subFolderId}`);

      // 5. חיפוש מסמך תואם לתבנית
      const normalize = str =>
        str.replace(/\.[^/.]+$/, '').replace(/\s+/g, '').toLowerCase();

      const matchingDoc = templateDocs.find(doc => normalize(doc.name) === normalize(folderName));

      if (matchingDoc) {
        try {
          console.log(`📎 Copying doc '${matchingDoc.name}' to '${folderName}'...`);
          const copy = await drive.files.copy({
            fileId: matchingDoc.id,
            requestBody: {
              name: `${matchingDoc.name}_v1`,
              parents: [subFolderId],
            },
            fields: 'id, webViewLink',
          });

          const copyId = copy.data.id;

          // 6. יצירת הרשאה לצפייה בקובץ
          await drive.permissions.create({
            fileId: copyId,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          });

          console.log("📥 Creating record in DB for doc:", {
            project_id: name,
            doc_type: folderName,
            file_path: copy.data.webViewLink,
            uploaded_by: username,
          });

          // 7. שמירה למסד הנתונים
          try {
            await genericServices.createRecord('documents', {
              project_id: name,
              stage_id: null,
              doc_type: folderName,
              doc_version: 1,
              file_path: copy.data.webViewLink,
              uploaded_by: username,
            });
            console.log("✅ Record saved to DB");
          } catch (err) {
            console.error("❌ Failed to create document record:", err.message, err);
          }


          createdFolders.push({
            folder: folderName,
            folderId: subFolderId,
            originalDocId: copyId,
            webViewLink: copy.data.webViewLink,
          });

          console.log(`✅ Copied + saved '${matchingDoc.name}' → ${copy.data.webViewLink}`);

        } catch (copyError) {
          console.error(`❌ Error copying document:`, copyError);
          createdFolders.push({
            folder: folderName,
            folderId: subFolderId,
            originalDocId: null,
            error: copyError.message,
          });
        }
      } else {
        console.warn(`⚠️ No matching doc found for '${folderName}'`);
        createdFolders.push({
          folder: folderName,
          folderId: subFolderId,
          note: 'No matching doc found',
        });
      }
    }

    // 8. סיום
    res.status(201).json({
      success: true,
      projectFolderId,
      createdFolders,
    });

  } catch (error) {
    console.error("🔥 General error in /newFolder:", error);
    res.status(500).json({
      error: 'Failed to create full project structure',
      details: error.message,
    });
  }
});
// Uploads a file to Google Drive under the project/docType folder, creates a new version, saves it in DB, and returns info about the uploaded file
router.post('/:projectId/upload/:docType', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { username, projectId, docType } = req.params; // שליפת מזהי הפרויקט וסוג המסמך מהנתיב
    const filePath = req.file.path; // הנתיב הזמני של הקובץ שהועלה לשרת
    const originalName = path.parse(req.file.originalname).name; // שם הקובץ המקורי בלי סיומת
    const fileExt = path.extname(req.file.originalname); // הסיומת של הקובץ (.docx למשל)

    // יצירת תיקיות לפי ההיררכיה: Projects → projectId → docType
    const projectsFolderId = await findOrCreateFolder(drive, 'Projects');
    const projectFolderId = await findOrCreateFolder(drive, projectId, projectsFolderId);
    const docTypeFolderId = await findOrCreateFolder(drive, docType, projectFolderId);

    // שלב 1: קבלת כל הקבצים בתיקיית docType
    const existingFilesRes = await drive.files.list({
      q: `'${docTypeFolderId}' in parents and trashed = false`,
      fields: 'files(id, name)',
    });

    // שלב 2: סינון הקבצים לפי שם דומה עם תבנית גרסה (_vX)
    const regex = new RegExp(`^${originalName}(?:_v(\\d+))?$`);
    const matchingVersions = existingFilesRes.data.files
      .map(f => {
        const match = f.name.match(regex); // בדיקת התאמה לתבנית שם + גרסה
        return match ? parseInt(match[1] || '1') : null; // אם יש גרסה - ניקח אותה, אחרת 1
      })
      .filter(v => v !== null); // ננקה תוצאות ריקות

    // שלב 3: קביעת הגרסה החדשה
    const newVersion = matchingVersions.length > 0
      ? Math.max(...matchingVersions) + 1 // אם קיימות גרסאות, נוסיף 1 לגרסה הגבוהה ביותר
      : 1; // אחרת זו גרסה ראשונה

    const newName = `${originalName}_v${newVersion}`; // שם הקובץ החדש עם גרסה

    // שלב 4: העלאת הקובץ ל-Google Drive עם המרה למסמך Google Docs
    const uploadRes = await drive.files.create({
      requestBody: {
        name: newName, // שם הקובץ החדש עם גרסה
        mimeType: 'application/vnd.google-apps.document', // המרה למסמך Google Docs
        parents: [docTypeFolderId], // התיקיה הסופית שאליה יועלה
      },
      media: {
        mimeType: req.file.mimetype, // סוג הקובץ
        body: fs.createReadStream(filePath), // קריאת הקובץ מהשרת
      },
      fields: 'id, webViewLink', // אילו שדות להחזיר בתגובה
    });

    fs.unlinkSync(filePath); // מחיקת הקובץ מהשרת המקומי אחרי ההעלאה

    await genericServices.createRecord('documents', {
      project_id: projectId,
      stage_id: null, // אם אין stageId, ניתן להשאיר null
      doc_type: docType,
      doc_version: `v${newVersion}`,
      file_path: uploadRes.data.webViewLink,
      uploaded_by: userId, // מתוך ה־JWT

    });

    // שליחת תגובה ללקוח עם פרטי הקובץ
    res.json({
      success: true,
      version: newVersion,
      name: newName,
      fileId: uploadRes.data.id,
      link: uploadRes.data.webViewLink,
    });

  } catch (error) {
    console.error('שגיאה בהעלאה:', error.message);
    // במקרה של שגיאה נשלח תגובה מתאימה
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});
// // Creates a new Google Doc for a stage, saves it in DB, and returns info about the new document
router.post('/:stageId/create', authenticateToken, async (req, res) => {
  try {
    const { title, projectId, docType, docVersion, uploadedBy } = req.body;
    const { stageId } = req.params;

    if (!title || !projectId || !docType || !docVersion || !uploadedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { docId, url } = await googleDocsService.createGoogleDoc(title);

    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });

    const newDoc = await genericServices.createRecord('documents', {
      stage_id: stageId,
      project_id: projectId,
      doc_type: docType,
      doc_version: docVersion,
      file_path: url,
      uploaded_by: uploadedBy
    });

    res.json({ success: true, docId, url, newDoc });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'A document with this type and version already exists for this project' });
    } else {
      console.error(error);
      res.status(500).send('Error creating Google Doc');
    }
  }
});


//
// Deletes a Google Doc by docId and removes its record from the DB
router.delete('/:docId', authenticateToken, async (req, res) => {
  try {
    const docId = req.params.docId;
    await googleDocsService.deleteGoogleDoc(docId);
    await genericServices.deleteRecord('documents', 'document_id', docId);
    res.sendStatus(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting Google Doc');
  }
});

module.exports = router;
