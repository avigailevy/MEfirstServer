const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const googleDocsService = require('../services/googleServices/googleDocsService');
const { drive } = require('../Services/googleServices/googleDrive');
const { authenticateToken } = require('./middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // שמירה זמנית של קבצים בתיקיית uploads

// פונקציה למציאת הגרסה האחרונה בתיקיה
async function getNextVersion(drive, folderId, docType) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and name contains '${docType}_v'`,
    fields: 'files(id, name)',
  });

  const regex = new RegExp(`^${docType}_v(\\d+)$`);
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

//פונקציה למציאת ID של תיקיה על פי שם ותיקיית אב
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
//create a new folder for a new project
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
//שכפול של קובץ אל תיקיה מסויימת
router.post('/drive/copy', authenticateToken, async (req, res) => {
  try {
    const { projectName, docType } = req.body;
    if (!projectName || !docType) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    const drive = google.drive({ version: 'v3', auth: await auth.getClient() });

    // שלב 1: Projects → projectName → docType
    const projectsFolderId = await findFolderIdByName('Projects');
    if (!projectsFolderId) throw new Error('תיקיית Projects לא נמצאה');

    const projectFolderId = await findFolderIdByName(projectName, projectsFolderId);
    if (!projectFolderId) throw new Error(`תיקיית הפרויקט "${projectName}" לא נמצאה`);

    const targetFolderId = await findFolderIdByName(docType, projectFolderId);
    if (!targetFolderId) throw new Error(`תיקיית "${docType}" לא נמצאה בפרויקט "${projectName}"`);

    // שלב 2: חיפוש הקובץ האחרון בתיקיה לפי סוג המסמך
    const { nextVersion, latestFileId } = await getNextVersion(drive, targetFolderId, docType);

    if (!latestFileId) {
      throw new Error(`לא נמצא קובץ בשם "${docType}_vX" בתיקיית "${docType}" של הפרויקט "${projectName}"`);
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

    res.json({
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




router.post('/newFolder', authenticateToken, async (req, res) => {
  try {
    const { name, parentName } = req.body;

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
    console.log(`Parent folder found: ${parentName} with ID ${parentId}`);

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
    console.log(`Project folder created: ${name} with ID ${projectFolderId}`);

    // 3. קבלת תיקיית המסמכים המקוריים וכל המסמכים בתוכה
    const templateFolderId = await getOriginalDocumentsFolderId();
    console.log(`Original Documents folder ID: ${templateFolderId}`);

    const templateDocs = await getOriginalDocs(templateFolderId);
    console.log(`Found ${templateDocs.length} original documents:`, templateDocs.map(d => d.name));

    const subFolders = ["CIF", "9CheckList", "RFQ", "LOI", "FCO", "SPA", "ICPO", "Summaries", "Quote"];
    const createdFolders = [];

    const normalize = str => str.replace(/\s+/g, '').toLowerCase();

    for (const folderName of subFolders) {
      // יצירת תיקיית משנה בפרויקט
      const subFolder = await drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [projectFolderId],
        },
        fields: 'id',
      });

      const subFolderId = subFolder.data.id;
      console.log(`Subfolder created: ${folderName} with ID ${subFolderId}`);

      // חיפוש המסמך המתאים לתיקייה לפי שם
      const normalize = str =>
        str.replace(/\.[^/.]+$/, '').replace(/\s+/g, '').toLowerCase();

      const matchingDoc = templateDocs.find(doc => normalize(doc.name) === normalize(folderName));


      if (matchingDoc) {
        try {
          console.log(`Found matching doc '${matchingDoc.name}' for folder '${folderName}', copying...`);
          const copy = await drive.files.copy({
            fileId: matchingDoc.id,
            requestBody: {
              name: `${matchingDoc.name}_v1`,
              parents: [subFolderId],
            },
          });
          console.log(`Copied document ID: ${copy.data.id}`);

          createdFolders.push({
            folder: folderName,
            folderId: subFolderId,
            originalDocId: copy.data.id,
            originalDocName: `${matchingDoc.name}_v1`,
          });
        } catch (copyError) {
          console.error(`Error copying document to folder '${folderName}':`, copyError);
          createdFolders.push({
            folder: folderName,
            folderId: subFolderId,
            originalDocId: null,
            error: `Copy error: ${copyError.message}`,
          });
        }
      } else {
        console.warn(`No matching document found for folder '${folderName}'`);
        createdFolders.push({
          folder: folderName,
          folderId: subFolderId,
          originalDocId: null,
          note: 'No matching doc found',
        });
      }
    }

    res.status(201).json({
      success: true,
      projectFolderId,
      createdFolders,
    });

  } catch (error) {
    console.error("General error in newFolder route:", error);
    res.status(500).json({ error: 'Failed to create full project structure', details: error.message });
  }
});



router.post('/:projectId/upload/:docType', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { projectId, docType } = req.params; // שליפת מזהי הפרויקט וסוג המסמך מהנתיב
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


// Get file_path by stageId
router.get('/:stageId', authenticateToken, async (req, res) => {
  try {
    const { stageId } = req.params;
    const results = await genericServices.getRecordsByColumns('documents', ['file_path'], 'stage_id', stageId);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ file_path: results[0].file_path });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving Google Doc');
  }
});

// Add new document to stage
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

// Delete doc by ID
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
