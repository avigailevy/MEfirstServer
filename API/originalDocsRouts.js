const express = require('express');
const genericServices = require('../Services/genericServices');

const router = express.Router();

// Get all original documents
router.get('/', async (req, res) => {
    try {
        const docs = await genericServices.getAllRecords('originalDocs');
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single document by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await genericServices.getRecordByColumn('originalDocs', 'org_doc_id', req.params.id);
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.status(200).json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new document
router.post('/', async (req, res) => {
    try {
        const { file_path, doc_type } = req.body;

        // Basic validation
        if (!file_path) {
            return res.status(400).json({ error: 'Missing required field: file_path' });
        }
        const allowedTypes = [
            "follow-up", "9CheckList", "RFQ", "LOI", "FCO", "SPA", "ICPO", "ProFormaInvoice", "Invoice"
        ];
        if (doc_type && !allowedTypes.includes(doc_type)) {
            return res.status(400).json({ error: `doc_type must be one of: ${allowedTypes.join(', ')}` });
        }

        const newDoc = await genericServices.createRecord('originalDocs', {
            file_path,
            doc_type
        });
        res.status(201).json(newDoc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a document by ID
router.put('/:id', async (req, res) => {
    try {
        const { doc_type } = req.body;
        const allowedTypes = [
            "follow-up", "9CheckList", "RFQ", "LOI", "FCO", "SPA", "ICPO", "ProFormaInvoice", "Invoice"
        ];
        if (doc_type && !allowedTypes.includes(doc_type)) {
            return res.status(400).json({ error: `doc_type must be one of: ${allowedTypes.join(', ')}` });
        }
        const updatedDoc = await genericServices.updateRecord('originalDocs', 'org_doc_id', req.params.id, req.body);
        res.status(200).json(updatedDoc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a document by ID
router.delete('/:id', async (req, res) => {
    try {
        await genericServices.deleteRecord('originalDocs', 'org_doc_id', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;