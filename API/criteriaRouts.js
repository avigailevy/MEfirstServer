const createGenericRouter = require('../utils/genericRouter');
const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

const genericRouter = createGenericRouter('criteria', 'criterion_id', ['project_id', 'criterion_type', 'shipp_pay_term_id']);
router.use('/', genericRouter);

// קבלת כל הקריטריונים של פרויקט מסוים
router.get('/project/:project_id', async (req, res) => {
    try {
        const criteria = await genericServices.getAllRecordsByColumn('criteria', 'project_id', req.params.project_id);
        res.json(criteria);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;