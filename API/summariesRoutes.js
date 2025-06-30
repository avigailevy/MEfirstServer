const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require('./middlewares/authMiddleware');

// Returns all summaries for a specific project, sorted by summary_id (descending)
router.get('/:projectId/summaries', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        // קבלת כל הסיכומים עבור הפרוייקט
        const summaries = await genericServices.getAllRecordsByColumn('summaries', 'project_id', projectId);
        // מיון הסיכומים לפי מזהה (ID)
        summaries.sort((a, b) => b.summary_id - a.summary_id);
        res.json(summaries);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch last summaries for the project' });
    }
});
// Updates an existing summary by summary_id
router.put('/:summary_id', authenticateToken, async (req, res) => {
    try {
        const { summary_id } = req.params;
        const { summary_text } = req.body;

        if (!summary_text) {
            return res.status(400).json({ error: 'summary_text is required' });
        }

        // עדכון הסיכום בטבלה summaries
        const updatedSummary = await genericServices.updateRecord(
            'summaries',
            'summary_id',
            summary_id,
            { summary_text }
        );

        res.json(updatedSummary);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Adds a new summary for a project
router.post('/add_summ', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { from_user_id, summary_text } = req.body;

        if (!from_user_id || !summary_text) {
            return res.status(400).json({ error: 'from_user_id and summary_text are required' });
        }

        // יצירת רשומה חדשה בטבלה summaries
        const summaryRecord = await genericServices.createRecord('summaries', {
            project_id: projectId,
            from_user_id,
            summery_time: new Date(), // הוספת זמן הסיכום
            summery_text // שים לב: שם העמודה בטבלה הוא summery_text, לא summary_text
        });

        res.status(201).json(summaryRecord);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;