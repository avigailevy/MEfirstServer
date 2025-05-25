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
        const { project_name, last_visit_time, status, supplier_id, customer_id, owner_user_id } = req.body;

        // Basic validation
        if (!project_name || !owner_user_id) {
            return res.status(400).json({ error: 'Missing required fields: project_name, owner_user_id' });
        }
        if (status && !['on hold', 'live project', 'closed'].includes(status)) {
            return res.status(400).json({ error: "Status must be one of: 'on hold', 'live project', 'closed'" });
        }

        const newProject = await genericServices.createRecord('projects', {
            project_name,
            last_visit_time,
            status,
            supplier_id,
            customer_id,
            owner_user_id
        });
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a project by ID
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (status && !['on hold', 'live project', 'closed'].includes(status)) {
            return res.status(400).json({ error: "Status must be one of: 'on hold', 'live project', 'closed'" });
        }
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