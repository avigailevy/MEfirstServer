const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { countRecords } = require('../Services/methodServices');
const { authenticateToken } = require('./middlewares/authMiddleware');

// const authenticateToken = require('../middleware/auth');
// const authorizeUser = require('../middleware/authorizeUser');

// Get projects by username and status (open or closed)
router.get('/all', authenticateToken, async (req, res) => {

    try {
        let statusArray;
        if (req.params.projectStatus === 'open') {
            statusArray = ['on hold', 'live project']; // Open projects
        } else if (req.params.projectStatus === 'closed') {
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

//get recent projects
router.get('/recent', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.user_id; 

        const recentProjects = await genericServices.getAllRecordsByColumns({
            tableName: 'projects',
            columnsObj: { user_id },
            orderBy: 'last_visit_time',
            limit: 4
        });

        res.json(recentProjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Update a project by username and status (open or closed)
router.put('/:projectId',

    async (req, res) => {
        try {
            let statusArray;
            if (req.params.projectStatus === 'open') {
                statusArray = ['on hold', 'live project'];
            } else if (req.params.projectStatus === 'closed') {
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

router.delete('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ error: 'Missing project_id' });
        }
        await genericServices.deleteRecord('projects', 'project_id', projectId);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:projectId/:currentStage/getFile_path', async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ error: 'Missing project_id' });
        }

        const document = await genericServices.getRecordByColumns(
            'documents',
            {
                project_id: projectId,

            }
        )
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        // Validate status group       
        let statusArray;
        if (req.params.projectStatus === 'open') {
            statusArray = ['on hold', 'live project'];
        } else if (req.params.projectStatus === 'closed') {
            statusArray = ['closed'];
        } else {
            return res.status(400).json({ error: 'Invalid status parameter' });
        }
        // Validate required fields
        const { project_name, status, supplier_id, customer_id } = req.body;
        // Generate project_id with date prefix + counter
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `${day}${month}`; // e.g., "2805"
        const count = await countRecords(prefix);
        const serial = String((count + 1) % 100).padStart(2, '0'); // Max 99 projects per day
        const project_id = Number(`${prefix}${serial}`);
        console.log("count:", count);
        console.log("prefix:", prefix);
        const owner_user_id = 329674543;
        if (!project_name || !owner_user_id) {
            return res.status(400).json({ error: 'Project name is required.' });
        }
        // Validate status
        const allowedStatuses = ['on hold', 'live project', 'closed'];
        const projectStatus = status && allowedStatuses.includes(status) ? status : statusArray[0];
        if (!statusArray.includes(projectStatus)) {
            return res.status(400).json({ error: 'Status does not match the requested group.' });
        }
        // Get owner_user_id (should be from token, not from params for security)
        const newProject = {
            project_id,
            project_name,
            last_visit_time: new Date(),
            status,
            supplier_id,
            customer_id,
            owner_user_id
        };
        const created = await genericServices.createRecord('projects', newProject);
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;