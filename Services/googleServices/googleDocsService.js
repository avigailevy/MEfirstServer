const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const docs = google.docs({ version: 'v1', auth: oAuth2Client });
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

async function createGoogleDoc(title) {
  const response = await docs.documents.create({
    requestBody: { title }
  });

  const docId = response.data.documentId;

  // השתמש בקישור ציבורי לעריכה
  const url = `https://docs.google.com/document/d/${docId}/edit`;
  return { docId, url };
}

async function deleteGoogleDoc(docId) {
  await drive.files.delete({ fileId: docId });
}

async function createFolder(name, parentId = null) {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };
  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  return folder.data.id;
}

async function copyFile(originalFileId, newName, parentFolderId) {
  const copiedFile = await drive.files.copy({
    fileId: originalFileId,
    resource: {
      name: newName,
      parents: [parentFolderId],
    },
  });
  return copiedFile.data.id;
}

async function createProjectStructure(projectName, originalDocsMap) {
  const projectFolderId = await createFolder(projectName, projectsRootFolderId); // תיקיית הפרויקט בתוך "Projects"

  for (const [docTypeName, originalDocId] of Object.entries(originalDocsMap)) {
    const docTypeFolderId = await createFolder(docTypeName, projectFolderId); // לדוגמה: "חוזה"
    await copyFile(originalDocId, `${docTypeName} - ${projectName}`, docTypeFolderId); // לדוגמה: "חוזה - פרויקט א"
  }

  return projectFolderId;
}

// פונקציה שמוצאת או יוצרת תיקיה לפי שם ותיקיית אב
async function findOrCreateFolder(drive, name, parentId = null) {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
    (parentId ? ` and '${parentId}' in parents` : '');
  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }
   const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });

  return folder.data.id;
}

module.exports = {
  createGoogleDoc,
  deleteGoogleDoc,
  createFolder,
  createProjectStructure,
  findOrCreateFolder
};
