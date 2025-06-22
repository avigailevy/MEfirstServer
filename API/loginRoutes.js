const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const jwt = require("jsonwebtoken");

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // שלב 1: מצא את המשתמש בטבלת users לפי username
    const user = await genericServices.getRecordByColumn('users', 'username', username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username' });
    }

    // שלב 2: שלוף את הסיסמה המטוהלת מטבלת passwords לפי user_id
    const passwordRecord = await genericServices.getRecordByColumn('passwords', 'user_id', user.user_id);
    if (!passwordRecord) {
      return res.status(401).json({ error: 'Invalid  password' });
    }
    // שלב 3: השווה את הסיסמה שסופקה עם הסיסמה המטוהלת
    // באמצעות bcrypt
    
    
    const isMatch = await bcrypt.compare(password, passwordRecord.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid' });
    }

    // שלב 4: צור JWT עם פרטי המשתמש
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    // שלב 5: החזר טוקן ופרטי משתמש
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

module.exports = router;
