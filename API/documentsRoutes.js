const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { createGoogleDoc, deleteGoogleDoc } = require('../services/googleDocsService');
const db = require('../Services/db');
const { drive } = require('../services/googleDrive'); // ודא שזה מיובא

// Get file_path by stageId
router.get('/:stageId', async (req, res) => {
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
router.post('/:stageId/create', async (req, res) => {
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
router.delete('/:docId', async (req, res) => {
  try {
    const docId = req.params.docId;
    await deleteGoogleDoc(docId);
    await db.query('DELETE FROM documents WHERE document_id = ?', [docId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting Google Doc');
  }
});

module.exports = router;
