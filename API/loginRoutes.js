const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const jwt = require("jsonwebtoken");

// Authenticates a user by username and password, returns a JWT token and user details if successful
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Step 1: Find the user in the users table by username
    const user = await genericServices.getRecordByColumn('users', 'username', username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username' });
    }

    // Step 2: Retrieve the hashed password from the passwords table by user_id
    const passwordRecord = await genericServices.getRecordByColumn('passwords', 'user_id', user.user_id);
    if (!passwordRecord) {
      return res.status(401).json({ error: 'Invalid  password' });
    }

    // Step 3: Compare the provided password with the hashed password using bcrypt
    const isMatch = await bcrypt.compare(password, passwordRecord.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid' });
    }

    // Step 4: Create a JWT with the user's details
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    // Step 5: Return the token and user details
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
