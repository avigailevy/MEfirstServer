const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { authenticateToken } = require("./middlewares/authMiddleware");

// Registers a new user (with hashed password); returns user_id and username if successful
router.post('/addUser', authenticateToken, async (req, res) => {
    try {
        const { username, password, ...otherFields } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // בדוק אם המשתמש כבר קיים
        const existing = await genericServices.getRecordByColumns('users', { username: username });
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // הצפן סיסמה
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await genericServices.createRecord('users', {
            username,
            password: hashedPassword,
            ...otherFields
        });

        res.status(201).json({ user_id: newUser.user_id, username: newUser.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
