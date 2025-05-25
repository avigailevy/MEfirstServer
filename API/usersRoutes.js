const createGenericRouter = require('./genericRouter');
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const genericServices = require('../Services/genericServices');

const userFields = [
    'username',
    'role',
    'email',
    'phone',
    'address',
    'language',
    'birthdate',
    'join_date',
    'last_login'
];

const genericRouter = createGenericRouter('users', 'user_id', userFields);
router.use('/', genericRouter);

// הרשמה (sign up)
router.post('/signUp', async (req, res) => {
    try {
        const { username, password, ...otherFields } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // בדוק אם המשתמש כבר קיים
        const existing = await genericServices.getRecordByColumn('users', 'username', username);
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

// התחברות (log in)
router.post('/logIn', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const user = await genericServices.getRecordByColumn('users', 'username', username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // כאן אפשר להחזיר טוקן או פרטי משתמש
        res.json({ user_id: user.user_id, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;