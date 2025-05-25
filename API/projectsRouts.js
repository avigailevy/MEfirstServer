const express = require('express');
const genericServices = require('../Services/genericServices');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await genericServices.getAllRecords('projects');
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single project by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await genericServices.getRecordByColumn('projects', 'project_id', req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new project
router.post('/', async (req, res) => {
    try {
        const newProject = await genericServices.createRecord('projects', req.body);
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a project by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedProject = await genericServices.updateRecord('projects', 'project_id', req.params.id, req.body);
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a project by ID
router.delete('/:id', async (req, res) => {
    try {
        await genericServices.deleteRecord('projects', 'project_id', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;