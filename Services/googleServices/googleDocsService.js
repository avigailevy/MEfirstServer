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

module.exports = {
  createGoogleDoc,
  deleteGoogleDoc,
};
