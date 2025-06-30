const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { hashPassword } = require('../Services/cryptServices');
const {authenticateToken} = require('./middlewares/authMiddleware');

// Update a password
router.put('/update', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'password is required' });
        }

        // הצפנת הסיסמה החדשה
        const { password_hash, password_salt } = hashPassword(password);

        const updated = await genericServices.updateRecord(
            'passwords',
            'user_id',
            req.params.user_id,
            { password_hash, password_salt }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Create a new password
router.post('/new', authenticateToken, async (req, res) => {
    try {
        const { user_id, password } = req.body;
        if (!user_id || !password) {
            return res.status(400).json({ error: 'user_id and password are required' });
        }
        // הצפנת הסיסמה
        const { password_hash, password_salt } = hashPassword(password);
        // שמירת הרשומה בטבלה
        const passwordRecord = await genericServices.createRecord('passwords', {
            user_id,
            password_hash,
            password_salt
        });
        res.status(201).json(passwordRecord);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;