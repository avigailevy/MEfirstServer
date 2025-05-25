const express = require('express');
const genericServices = require('../Services/genericServices');

const router = express.Router();

// Get all todos
router.get('/', async (req, res) => {
    try {
        const todos = await genericServices.getAllRecords('todos');
        res.status(200).json(todos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single todo by ID
router.get('/:id', async (req, res) => {
    try {
        const todo = await genericServices.getRecordByColumn('todos', 'todo_id', req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(200).json(todo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new todo
router.post('/', async (req, res) => {
    try {
        const { from_user_id, to_user_id, title, description, completed, complete_time, seen } = req.body;

        // Basic validation
        if (!from_user_id || !to_user_id || !title) {
            return res.status(400).json({ error: 'Missing required fields: from_user_id, to_user_id, title' });
        }

        const newTodo = await genericServices.createRecord('todos', {
            from_user_id,
            to_user_id,
            title,
            description,
            completed,
            complete_time,
            seen
            // sent_time is set automatically by DB
        });
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a todo by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedTodo = await genericServices.updateRecord('todos', 'todo_id', req.params.id, req.body);
        res.status(200).json(updatedTodo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a todo by ID
router.delete('/:id', async (req, res) => {
    try {
        await genericServices.deleteRecord('todos', 'todo_id', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;