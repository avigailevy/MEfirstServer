const createGenericRouter = require('./genericRouter');
const express = require('express');
const router = express.Router();

const genericRouter = createGenericRouter('documents', 'document_id', ['project_id', 'doc_type', 'doc_version', 'file_path']);
router.use('/', genericRouter);
const genericServices = require('../Services/genericServices');

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
        const projects = await genericServices.getProjectsByUsernameAndStatuses(
            req.params.username,
            statusArray
        );
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update projects by username and status (open or closed)
router.put('/:username/:openOrCloseProjects', async (req, res) => {
    try {
        let statusArray;
        if (req.params.openOrCloseProjects === 'open') {
            statusArray = ['on hold', 'live project']; // Open projects
        } else if (req.params.openOrCloseProjects === 'closed') {
            statusArray = ['closed']; // Closed projects
        } else {
            return res.status(400).json({ error: 'Invalid status parameter' });
        }

        // Fetch all relevant projects before update
        const projects = await genericServices.getRecordsByColumn(
            'projects',
            "status",
            req.params.status
        );

        // Validate status change for each project
        const allowedStatuses = ['on hold', 'live project', 'closed'];
        const newStatus = req.body.status;
        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ error: 'Invalid new status value.' });
        }

        for (const project of projects) {
            const oldStatus = project.status;
            if (oldStatus === 'closed' && newStatus !== 'closed') {
                return res.status(400).json({ error: 'Cannot reopen a closed project.' });
            }
            if (oldStatus === 'on hold' && newStatus !== 'live project' && newStatus !== 'on hold') {
                return res.status(400).json({ error: 'Project on hold can only be changed to live project or remain on hold.' });
            }
            // You can add more rules here if needed
        }

        // Update projects by owner username and status
        const updatedProjects = await genericServices.updateProjectsByUsernameAndStatuses(
            req.params.username,
            statusArray,
            req.body // Assuming the body contains the update data
        );
        res.json(updatedProjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;