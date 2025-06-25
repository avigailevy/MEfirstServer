const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices')
const { createGoogleDoc, deleteGoogleDoc } = require('../services/googleDocsService');
const db = require('../Services/db');

//get a filePath by stageId
router.get('/:stageId', async (req, res) => {
    try {
        const { stageId } = req.params;
        const filePath = genericServices.getRecordsByColumns('documents', ['file_path'], 'stage_id', stageId);
        if (!filePath || filePath.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ filePath });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving Google Doc');
    }
});

//add a new document to a specific stage
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
        const newDoc = genericServices.createRecord('documents', {
            stage_id: stageId,
            doc_type: docType,
            doc_version: docVersion,
            file_path: url,
            uploaded_y: uploadedBy
        })
        res.json({ success: true, docId, url });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'A document with this type and version already exists for this project' });
        } else {
            console.error(error);
            res.status(500).send('Error creating Google Doc');
        }
    }
});


router.delete('/:docId', async (req, res) => {
    try {
        const docId = req.params.docId;
        await deleteGoogleDoc(docId);
        await db.query('DELETE FROM documents WHERE doc_id = ?', [docId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting Google Doc');
    }
});

module.exports = router;
