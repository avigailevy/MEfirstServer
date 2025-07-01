const router = require('express').Router({ mergeParams: true });
const genericServices = require('../Services/genericServices');
const { countRecords } = require('../Services/methodServices');
const { authenticateToken } = require('./middlewares/authMiddleware');

// Returns the 4 most recent projects for the current user
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;  // מזהה משתמש
    console.log("Fetching recent projects for userId:", userId);
    
    const recentProjects = await genericServices.getAllRecordsByColumns({
      tableName: 'projects',
      columnsObj: { owner_user_id: userId },  // משתמשים ב-ID
      orderBy: 'last_visit_time',
      limit: 4
    });

    res.json(recentProjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Returns all projects for a specific agent (for admin)
router.get('/:agentName', authenticateToken, async (req, res) => {
  try {
    const { agentName } = req.params;

    const agent = await genericServices.getRecordByColumns('users', { username: agentName });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const agentId = agent.user_id;
    const agentProjects = await genericServices.getAllRecordsByColumns({ tableName: 'projects', columnsObj: { owner_user_id: agentId } });
    console.log("allAgentProjects:", agentProjects);

    res.status(200).json(agentProjects);
  } catch (err) {
    console.error("Error fetching agent projects:", err);
    res.status(500).json({ error: err.message });
  }
});
// Returns all projects by status (open/close), filtered by user role (admin sees all, user sees own)
router.get('/:projectStatus/all', authenticateToken, async (req, res) => {
  try {
    const { projectStatus } = req.params;
    const { userId, role } = req.user;  // נשלף מתוך ה־JWT

    let status;
    if (projectStatus === 'open') {
      status = ['on hold', 'live project'];
    } else if (projectStatus === 'close') {
      status = ['closed'];
    } else {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }

    let projects;

    if (role === 'admin') {
      projects = await genericServices.getRecordsWhereIn(
        'projects',
        'status',
        status,
      );
    } else {
      // משתמש רגיל רואה רק את שלו
      projects = await genericServices.getRecordsWhereInWithFilter(
        'projects',
        'status',
        status,
        'owner_user_id',
        userId
      );
    }

    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
});
// Returns a single project by projectId
router.get('/single/:projectId', authenticateToken, async (req, res) => {

  try {
    const { projectId } = req.params;
    const userId = req.user.userId;
    const project = await genericServices.getRecordByColumns('projects', {
      'project_id': projectId

    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});
// Updates the last visit time for a project
router.put('/visit/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    await genericServices.updateRecord('projects', 'project_id', project_id, {
      last_visit_time: new Date()
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Updates a project by projectId (status must match open/close group)
router.put('/:projectId',

  async (req, res) => {
    try {
      let statusArray;
      if (req.params.projectStatus === 'open') {
        statusArray = ['on hold', 'live project'];
      } else if (req.params.projectStatus === 'close') {
        statusArray = ['closed'];
      } else {
        return res.status(400).json({ error: 'Invalid status parameter' });
      }

      // Fetch the project by ID and username
      const project = await genericServices.getRecordByColumns("projects", { project_id: req.params.projectId });
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
// Creates a new project (with status open/close) and its default stages
router.post('/:projectStatus', authenticateToken, async (req, res) => {
  //מתבצע בשרת כדי שלא יהיו כפילויות במקרה של עבודה בשני מחשבים במקביל
  try {
    let statusArray;
    if (req.params.projectStatus === 'open') {
      statusArray = ['on hold', 'live project'];
    } else if (req.params.projectStatus === 'close') {
      statusArray = ['closed'];
    } else {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }
    const { project_name, status, supplier_id, customer_id } = req.body;
    const owner_user_id = 215589318;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${day}${month}`; // e.g., "2805"
    const count = await countRecords(prefix);
    const serial = String((count + 1) % 100).padStart(2, '0'); // Max 99 projects per day
    const project_id = Number(`${prefix}${serial}`);
    console.log("count:", count);
    console.log("prefix:", prefix);
    if (!project_name || !owner_user_id) {
      return res.status(400).json({ error: 'Project name is required.' });
    }
    const allowedStatuses = ['on hold', 'live project', 'closed'];
    const projectStatus = status && allowedStatuses.includes(status) ? status : statusArray[0];
    if (!statusArray.includes(projectStatus)) {
      return res.status(400).json({ error: 'Status does not match the requested group.' });
    }
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

    // ✅ נוספה כאן יצירת השלבים אוטומטית
    const defaultStages = [
      '9CheckList',
      'RFQ',
      'pickProducts',
      'Quote',
      'LOI',
      'FCO',
      'SPA',
      'ICPO',
      'CIF'
    ];

    const stagePromises = defaultStages.map((stageName, index) => {
      return genericServices.createRecord('stages', {
        project_id: project_id,
        stage_number: index + 1,
        stage_name: stageName,
        completed: false
      });
    });

    await Promise.all(stagePromises);
    // ✅ סיום הוספת שלבים
    res.status(201).json({ created: created, project_id: project_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Deletes a project by projectId
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

module.exports = router;