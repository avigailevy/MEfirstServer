const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const jwt = require("jsonwebtoken");

// התחברות (log in)
router.post('/logIn', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // בדיקה אם המשתמש קיים במסד
        const user = await genericServices.getRecordByColumn('users', 'username', username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // השוואת הסיסמאות
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // יצירת הטוקן עם מידע מזהה
        const token = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
        );
        // מחזירים את הטוקן יחד עם פרטי המשתמש
        res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});