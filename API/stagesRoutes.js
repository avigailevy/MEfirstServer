const express = require('express');
const genericServices = require('../Services/genericServices');
const { authenticateToken } = require('./middlewares/authMiddleware');
const router = express.Router({ mergeParams: true });

// Returns all stages for a specific project
router.get('/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const stages = await genericServices.getAllRecordsByColumns({ tableName: 'stages', columnsObj: { project_id: project_id } });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stages for the project and user' });
  }
});
// Returns a specific stage by stage_id
router.get('/display/:stage_id', authenticateToken, async (req, res) => {
  const { username, stage_id } = req.params;
  try {
    const stage = await genericServices.getRecordByColumns('stages', { stage_id: stage_id });
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    res.json(stage);
    console.log("stage_id:", stage_id);
    console.log("username:", username);
  } catch (error) {
    console.error('Error fetching stage:', error);
    res.status(500).json({ error: 'Failed to fetch stage' });
  }
});
// Returns the amount of completed stages for a specific project
router.get('/completed/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    const completedStages = await genericServices.getAllRecordsByColumns({
      tableName: 'stages',
      columnsObj: { project_id, completed: 1 }, 
    });

    res.json({ completed: completedStages.length });
  } catch (err) {
    console.error('Error fetching completed stages:', err);
    res.status(500).json({ error: 'Failed to fetch completed stages' });
  }
});
// Updates the extend_stage_1 field for a specific stage by stage_id
router.put('/:stage_id', authenticateToken, async (req, res) => {
  const { stage_id } = req.params.stage_id;
  const { extend_stage_1 } = req.body;

  if (typeof extend_stage_1 !== 'string') {
    return res.status(400).json({ error: 'Invalid extend_stage_1 format' });
  }

  try {
    const updated = await genericServices.updateRecordColumn(
      'stages',
      'stage_id',
      stage_id,
      'extend_stage_1',
      extend_stage_1
    );

    if (!updated) {
      return res.status(404).json({ error: 'Stage not found or not updated' });
    }

    res.json({ message: 'Stage checklist updated successfully' });
  } catch (error) {
    console.error('Error updating stage:', error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});
// Updates the completed status (and completion date) for a specific stage by stage_id
router.put('/completed/:stage_id', authenticateToken, async (req, res) => {
  try {
    const { stage_id } = req.params;
    const { completed } = req.body;
    const completion_date = completed ? new Date() : null;

    const result = await genericServices.updateRecord(
      'stages',
      'stage_id',
      stage_id,
      { completed, completion_date }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stage completion status' });
  }
});

module.exports = router;