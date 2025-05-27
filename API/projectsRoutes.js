const createGenericRouter = require('./genericRouter');
const express = require('express');
const router = express.Router();

const genericRouter = createGenericRouter('documents', 'document_id', ['project_id', 'doc_type', 'doc_version', 'file_path']);
router.use('/', genericRouter);
const genericServices = require('../Services/genericServices');
const authenticateToken = require('./middlewares');
const authorizeUser = require('./middlewares');

// Get projects by username and status (open or closed)
router.get('/:username/:openOrCloseProjects', async (req, res) => {

    try {
        let statusArray;
        if (req.params.openOrCloseProjects === 'open') {
            statusArray = ['on hold', 'live project']; // Open projects
        } else if (req.params.openOrCloseProjects === 'closed') {
            statusArray = ['closed']; // Closed projects
        } else {
            return res.status(400).json({ error: 'Invalid status parameter' });
        }

        // Fetch projects by owner username and status
        const projects = await genericServices.getAllRecordsByColumn(
            'projects',
            "status",
            req.params.status
        );
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a project by username and status (open or closed)
router.put(
    '/:username/:openOrCloseProjects/:projectId',
    authenticateToken,
    authorizeUser,
    async (req, res) => {
        try {
            let statusArray;
            if (req.params.openOrCloseProjects === 'open') {
                statusArray = ['on hold', 'live project'];
            } else if (req.params.openOrCloseProjects === 'closed') {
                statusArray = ['closed'];
            } else {
                return res.status(400).json({ error: 'Invalid status parameter' });
            }

            // Fetch the project by ID and username
            const project = await genericServices.getRecordByColumn(
                "projects",
                "project_id",
                req.params.projectId
            );
            if (!project) {
                return res.status(404).json({ error: 'Project not found for this user.' });
            }

            // Check if the project status matches the requested group (open/closed)
            if (!statusArray.includes(project.status)) {
                return res.status(400).json({ error: 'Project status does not match the requested group.' });
            }

            // Validate update input and status transition
            const validation = validateProjectUpdate(project, req.body);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.message });
            }

            // Update the project
            const updated = await genericServices.updateRecord(
                'projects',
                'project_id',
                req.params.projectId,
                req.body
            );
            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// Add a new project for a specific user and status group
router.post('/:username/:openOrCloseProjects', authenticateToken, async (req, res) => {
    try {
        // Validate status group
        let statusArray;
        if (req.params.openOrCloseProjects === 'open') {
            statusArray = ['on hold', 'live project'];
        } else if (req.params.openOrCloseProjects === 'closed') {
            statusArray = ['closed'];
        } else {
            return res.status(400).json({ error: 'Invalid status parameter' });
        }

        // Validate required fields
        const { project_name, status, supplier_id, customer_id } = req.body;
        if (!project_name) {
            return res.status(400).json({ error: 'Project name is required.' });
        }

        // Validate status
        const allowedStatuses = ['on hold', 'live project', 'closed'];
        const projectStatus = status && allowedStatuses.includes(status) ? status : statusArray[0];
        if (!statusArray.includes(projectStatus)) {
            return res.status(400).json({ error: 'Status does not match the requested group.' });
        }

        // Get owner_user_id (should be from token, not from params for security)
        const owner_user_id = req.userId;

        const newProject = {
            project_name,
            status: projectStatus,
            supplier_id,
            customer_id,
            owner_user_id,
            last_visit_time: new Date()
        };

        const created = await genericServices.createRecord('projects', newProject);
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;