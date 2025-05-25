const express = require('express');
const genericServices = require('../Services/genericServices');

const router = express.Router();

// Get all stages
router.get('/', async (req, res) => {
    try {
        const stages = await genericServices.getAllRecords('stages');
        res.status(200).json(stages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single stage by ID
router.get('/:id', async (req, res) => {
    try {
        const stage = await genericServices.getRecordByColumn('stages', 'stage_id', req.params.id);
        if (!stage) {
            return res.status(404).json({ error: 'Stage not found' });
        }
        res.status(200).json(stage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new stage
router.post('/', async (req, res) => {
    try {
        const { project_id, stage_number, stage_name, completed, completion_date } = req.body;

        // Basic validation
        if (!project_id || !stage_number) {
            return res.status(400).json({ error: 'Missing required fields: project_id, stage_number' });
        }

        const newStage = await genericServices.createRecord('stages', {
            project_id,
            stage_number,
            stage_name,
            completed,
            completion_date
        });
        res.status(201).json(newStage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a stage by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedStage = await genericServices.updateRecord('stages', 'stage_id', req.params.id, req.body);
        res.status(200).json(updatedStage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a stage by ID
router.delete('/:id', async (req, res) => {
    try {
        await genericServices.deleteRecord('stages', 'stage_id', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;