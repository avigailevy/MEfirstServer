const createGenericRouter = require('../utils/genericRouter');
const express = require('express');
const router = express.Router();

const genericRouter = createGenericRouter('documents', 'document_id', ['project_id', 'doc_type', 'doc_version', 'file_path']);
router.use('/', genericRouter);
const genericServices = require('../Services/genericServices');

// קבלת כל המסמכים של פרויקט מסוים
router.get('/project/:project_id', async (req, res) => {
    try {
        const documents = await genericServices.getAllRecordsByColumn('documents', 'project_id', req.params.project_id);
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;