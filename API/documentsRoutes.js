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

router.post('/create', async (req, res) => {
    try {
        const { title, projectId } = req.body;
        const { docId, url } = await createGoogleDoc(title);

        // שמירה במסד נתונים
        await db.query(
            'INSERT INTO documents (project_id, doc_id, url, created_at) VALUES (?, ?, ?, NOW())',
            [projectId, docId, url]
        );

        res.json({ success: true, docId, url });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating Google Doc');
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
