const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

// קבלת כל המסמכים
router.get('/', async (req, res) => {
    try {
        const documents = await genericServices.getAllRecords('documents');
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת מסמך לפי מזהה
router.get('/:document_id', async (req, res) => {
    try {
        const document = await genericServices.getRecordByColumn('documents', 'document_id', req.params.document_id);
        if (!document) return res.status(404).json({ error: 'Not found' });
        res.json(document);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת כל המסמכים של פרויקט מסוים
router.get('/project/:project_id', async (req, res) => {
    try {
        const documents = await genericServices.getAllRecordsByColumn('documents', 'project_id', req.params.project_id);
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// יצירת מסמך חדש
router.post('/', async (req, res) => {
    try {
        // חובה: project_id, doc_type, doc_version, file_path
        const { project_id, doc_type, doc_version, file_path } = req.body;
        if (!project_id || !doc_type || !doc_version || !file_path) {
            return res.status(400).json({ error: 'project_id, doc_type, doc_version and file_path are required' });
        }
        const newDocument = await genericServices.createRecord('documents', req.body);
        res.status(201).json(newDocument);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// עדכון מסמך
router.put('/:document_id', async (req, res) => {
    try {
        const updated = await genericServices.updateRecord('documents', 'document_id', req.params.document_id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// מחיקת מסמך
router.delete('/:document_id', async (req, res) => {
    try {
        await genericServices.deleteRecord('documents', 'document_id', req.params.document_id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;