const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require('./middlewares/authMiddleware');

// Returns all available criterion types (static list)
router.get('/stage2/criteria/types', authenticateToken, async (req, res) => {
    const criterionTypes = [
        'ProductDefinition',
        'Quantities',
        'PackingSize',
        'ShippTerms',
        'DesCountry',
        'payTerms',
        'label',
        'RegIssues',
        'possObstacles'
    ];
    res.json(criterionTypes);
});
// Returns all criteria for a specific project
router.get('/:stage/criteria', authenticateToken, async (req, res) => {
    try {
        const criteria = await genericServices.getAllRecordsByColumns({ tableName: 'criteria', columnsObj: { project_id:  req.params.project_id} });
        res.json(criteria);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Updates an existing criterion (info_accepted field) by criterion_id
router.put('/:stage/criteria/:criterion_id', authenticateToken, async (req, res) => {
    try {
        let { info_accepted } = req.body;
        info_accepted = Boolean(info_accepted);
        // עדכון הרשומה בטבלת 'criteria' לפי criterion_id עם הערך החדש של info_accepted
        const updated = await genericServices.updateRecord(
            'criteria',
            'criterion_id',
            req.params.criterion_id,
            { info_accepted }
        );
        // אם לא נמצאה רשומה לעדכון, החזרת שגיאת 404
        if (!updated) {
            return res.status(404).json({ error: 'Criterion not found' });
        }
        // החזרת הרשומה המעודכנת בתשובה
        res.json(updated);
    } catch (err) {
        // טיפול בשגיאות והחזרת שגיאת 500 עם הודעת השגיאה
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;