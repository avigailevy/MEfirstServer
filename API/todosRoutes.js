const express = require('express');
const genericServices = require('../Services/genericServices');
const router = express.Router();

// ניתוב שמחזיר את כל המשימות של משתמש מסוים
router.get('/:username/todos/all', async (req, res) => {
    const {username}= req.params;
    try{
        const userId= genericServices.getRecordByColumn('users', 'user_id', `${username}`);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }
        const todos = await genericServices.getAllRecords('todos', 'user_id', userId);
        req.json(todos);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;