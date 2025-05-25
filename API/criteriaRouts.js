const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

// קבלת כל הקריטריונים
router.get('/', async (req, res) => {
    try {
        const criteria = await genericServices.getAllRecords('criteria');
        res.json(criteria);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת קריטריון לפי מזהה
router.get('/:criterion_id', async (req, res) => {
    try {
        const criterion = await genericServices.getRecordByColumn('criteria', 'criterion_id', req.params.criterion_id);
        if (!criterion) return res.status(404).json({ error: 'Not found' });
        res.json(criterion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת כל הקריטריונים של פרויקט מסוים
router.get('/project/:project_id', async (req, res) => {
    try {
        const criteria = await genericServices.getAllRecordsByColumn('criteria', 'project_id', req.params.project_id);
        res.json(criteria);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// יצירת קריטריון חדש
router.post('/', async (req, res) => {
    try {
        // חובה: project_id, criterion_type, shipp_pay_term_id
        const { project_id, criterion_type, shipp_pay_term_id } = req.body;
        if (!project_id || !criterion_type || !shipp_pay_term_id) {
            return res.status(400).json({ error: 'project_id, criterion_type and shipp_pay_term_id are required' });
        }
        const newCriterion = await genericServices.createRecord('criteria', req.body);
        res.status(201).json(newCriterion);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// עדכון קריטריון
router.put('/:criterion_id', async (req, res) => {
    try {
        const updated = await genericServices.updateRecord('criteria', 'criterion_id', req.params.criterion_id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// מחיקת קריטריון
router.delete('/:criterion_id', async (req, res) => {
    try {
        await genericServices.deleteRecord('criteria', 'criterion_id', req.params.criterion_id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;