const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { authenticateToken } = require('./middleware/authMiddleware/authenticateToken');

//ניתוב שמחזיר את כל הסוכנים
router.get('/agents/all', async (req, res) => {
    try {
        res.json(genericServices.getAllRecordsByColumn('users', 'role', 'agent'));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})
//ניתוב שמחזיר את האנשי קשר  בשביל האדם שיבחר לאיזה סוכן לשלוח TODO
router.get('/todos/users', authenticateToken, async (req, res) => {
    try {
        const role = req.user.role; // אתה צריך לקחת את ה-role מה-token (decode)

        let users;
        if (role === 'admin') {
            users = await genericServices.getAllRecordsByColumn('users', 'role', 'agent');
        } else {
            users = await genericServices.getAllRecordsByColumn('users', 'role', 'admin');
        }

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





module.exports = router;