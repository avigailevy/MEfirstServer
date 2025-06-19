const express = require('express');
const genericServices = require('../Services/genericServices');
const router = express.Router();
const { authenticateToken } = require('./middleware/authMiddleware/authenticateToken');

// GET /todos - כל הטודואים של המשתמש המחובר (userId מהטוקן)
router.get('/todos', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [todos] = await genericServices.getAllRecordsByColumn('todos', 'user_id', userId);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /todos - יצירת טודו חדש (userId מהטוקן)
router.post('/todos', authenticateToken, async (req, res) => {
    const { title, completed = false } = req.body;
    const userId = req.user.userId;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const newTodo = await genericServices.createRecord('todos', {
            user_id: userId,
            title,
            completed,
        });
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /todos/:id - עדכון טודו (רק אם שייך למשתמש המחובר)
router.put('/todos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;
    const userId = req.user.userId;

    try {
        const existingTodo = await genericServices.getRecordByColumn('todos', 'id', id);
        if (!existingTodo) return res.status(404).json({ error: 'Todo not found' });
        if (existingTodo.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        const updatedTodo = await genericServices.updateRecord('todos', 'id', id, {
            title: title ?? existingTodo.title,
            completed: typeof completed === 'boolean' ? completed : existingTodo.completed,
        });

        res.json(updatedTodo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /todos/:id - מחיקת טודו (רק אם שייך למשתמש המחובר)
router.delete('/todos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const existingTodo = await genericServices.getRecordByColumn('todos', 'id', id);
        if (!existingTodo) return res.status(404).json({ error: 'Todo not found' });
        if (existingTodo.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        await genericServices.deleteRecord('todos', 'id', id);
        res.json({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
