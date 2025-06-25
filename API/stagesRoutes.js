const express = require('express');
const genericServices = require('../Services/genericServices');
const router = express.Router();
const {authenticateToken} = require('./middlewares/authMiddleware');


//get a specific stage by stage_id
router.get('/:stage_id', authenticateToken, async (req, res) => {
  const { stage_id } = req.params;
  try {
    const stage = await genericServices.getRecordByColumn('stages', 'stage_id', stage_id);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });
    res.json(stage);
  } catch (err) {
    console.error('Error fetching stage:', err);
    res.status(500).json({ error: 'Failed to fetch stage' });
  }
});

router.put('/:stage_id', authenticateToken, async (req, res) => {
  const { stage_id } = req.params;
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

router.get('/:stage_id', authenticateToken, async (req, res) => {
  const { stage_id } = req.params;
  try {
    const stage = await genericServices.getRecordByColumn('stages', 'stage_id', stage_id);
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    res.json(stage);
  } catch (error) {
    console.error('Error fetching stage:', error);
    res.status(500).json({ error: 'Failed to fetch stage' });
  }
});
// קבלת כל השלבים של פרויקט מסוים
router.get('/:project_id', authenticateToken, async (req, res) => {
    try {
        const stages = await genericServices.getAllRecordsByColumn('stages', "project_id", req.params);
        res.json(stages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stages for the project and user' });
    }
});



// עדכון שלב ספציפי לפי מזהה שלב
router.put('/:stage_id/completed', authenticateToken, async (req, res) => {
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
// קבלת השלב הבא אחרי השלב האחרון שמושלם עבור פרוייקט מסויים
router.get('/:project_id/next', authenticateToken, async (req, res) => {
    try {
        const { project_id } = req.params;
        // Get all stages for the project, ordered by stage_id
        const stages = await genericServices.getAllRecordsByColumn('stages', 'project_id', { project_id });
        // Sort by stage_id (assuming it's numeric)
        stages.sort((a, b) => a.stage_id - b.stage_id);
        // Find the last completed stage
        const lastCompletedIndex = stages.map(s => s.completed).lastIndexOf(true);
        // The next stage is the one after the last completed
        const nextStage = stages[lastCompletedIndex + 1] || null;
        res.json(nextStage);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch next stage' });
    }
});



module.exports = router;