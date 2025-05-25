const express = require('express');
const genericServices = require('../Services/genericServices');

const router = express.Router();

// Get all summaries
router.get('/', async (req, res) => {
    try {
        const summaries = await genericServices.getAllRecords('summaries');
        res.status(200).json(summaries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single summary by ID
router.get('/:id', async (req, res) => {
    try {
        const summary = await genericServices.getRecordByColumn('summaries', 'summary_id', req.params.id);
        if (!summary) {
            return res.status(404).json({ error: 'Summary not found' });
        }
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new summary
router.post('/', async (req, res) => {
    try {
        const { project_id, from_user_id, summery_text } = req.body;

        // Basic validation
        if (!from_user_id) {
            return res.status(400).json({ error: 'Missing required field: from_user_id' });
        }

        const newSummary = await genericServices.createRecord('summaries', {
            project_id,
            from_user_id,
            summery_text
            // summery_time is set automatically by DB
        });
        res.status(201).json(newSummary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a summary by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedSummary = await genericServices.updateRecord('summaries', 'summary_id', req.params.id, req.body);
        res.status(200).json(updatedSummary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a summary by ID
router.delete('/:id', async (req, res) => {
    try {
        await genericServices.deleteRecord('summaries', 'summary_id', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;