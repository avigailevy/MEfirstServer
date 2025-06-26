const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { createGoogleDoc, deleteGoogleDoc } = require('../services/googleServices/googleDocsService');
const { drive } = require('../Services/googleServices/googleDrive');
const { authenticateToken } = require('./middlewares/authMiddleware');

//create a new folder for a new project
router.post('/newFolder', authenticateToken, async (req, res) => {
  try {
    const { name, parentName } = req.body;
    const parentId = await drive.files.list({
      q: `name='${parentName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });
    const folder = response.data.files;
    if (folder.length === 0) {
      console.log('Folder not found');
      return null;
    }
    const res = await drive.files.create({
      resource: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : [],
      },
      fields: 'id',
    });
    res.status(200).json('Folder created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error Creating folder');
  }
})

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

    const { docId, url } = await createGoogleDoc(title);

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
    await deleteGoogleDoc(docId);
    await genericServices.deleteRecord('documents', 'document_id', docId);
    res.sendStatus(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting Google Doc');
  }
});

module.exports = router;
