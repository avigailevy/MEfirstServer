const express = require('express');
const genericServices = require('../Services/genericServices');
const router = express.Router();
const { authenticateToken } = require('./middlewares/authMiddleware');

// GET /todos - כל הטודואים של המשתמש המחובר (userId מהטוקן)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const todos = await genericServices.getAllRecordsByColumn('todos', 'to_user_id', userId);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /todos - יצירת טודו חדש (userId מהטוקן)
router.post('/', authenticateToken, async (req, res) => {
    const { title, description = '', to_user_id, completed = false } = req.body;
    const from_user_id = req.user.userId;

    if (!title || !to_user_id) {
        return res.status(400).json({ error: 'Missing required fields: title, to_user_id' });
    }

    try {
        const newTodo = await genericServices.createRecord('todos', {
            from_user_id,
            to_user_id,
            title,
            description,
            completed,
        });
        res.status(201).json(newTodo);
    } catch (err) {
        console.error("❌ Error creating todo:", err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /todos/:id - עדכון טודו (רק אם שייך למשתמש המחובר)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, completed, seen } = req.body;
    const userId = req.user.userId;

    try {
        const existingTodo = await genericServices.getRecordByColumn('todos', 'todo_id', id);
        if (!existingTodo) return res.status(404).json({ error: 'Todo not found' });

        // רק מי ששלח או קיבל את הטודו יכול לערוך אותו (תוכל לשנות את זה לפי הלוגיקה שלך)
        const isFromUser = existingTodo.from_user_id === userId;
        const isToUser = existingTodo.to_user_id === userId;
        if (!isFromUser && !isToUser) return res.status(403).json({ error: 'Unauthorized' });

        const updatedTodo = await genericServices.updateRecord('todos', 'todo_id', id, {
            title: title ?? existingTodo.title,
            description: description ?? existingTodo.description,
            completed: typeof completed === 'boolean' ? completed : existingTodo.completed,
            seen: typeof seen === 'boolean' ? seen : existingTodo.seen,
            complete_time: completed === true ? new Date() : existingTodo.complete_time
        });

        res.json(updatedTodo);
    } catch (err) {
        console.error('Error updating todo:', err);
        res.status(500).json({ error: err.message });
    }
});


// DELETE /todos/:id - מחיקת טודו (רק אם שייך למשתמש המחובר)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const existingTodo = await genericServices.getRecordByColumn('todos', 'todo_id', id);
        if (!existingTodo) return res.status(404).json({ error: 'Todo not found' });
        if (existingTodo.from_user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        await genericServices.deleteRecord('todos', 'todo_id', id);
        res.json({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
