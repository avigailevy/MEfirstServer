const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require('./middlewares/authMiddleware');


//קבלת כל סוגי הקריטריונים הקיימים 
router.get('/stage2/criteria/types', async (req, res) => {
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

// קבלת כל הקריטריונים של פרויקט מסוים
router.get('/:stage/criteria', async (req, res) => {
    try {
        const criteria = await genericServices.getAllRecordsByColumn('criteria', 'project_id', req.params.project_id);
        res.json(criteria);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// עדכון קריטריון קיים
router.put('/:stage/criteria/:criterion_id', async (req, res) => {
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