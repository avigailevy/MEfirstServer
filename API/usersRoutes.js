const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require("./middleware/authMiddleware/authenticateToken");

//ניתוב שמחזיר את כל הסוכנים
router.get('/agents/all', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // בדוק אם המשתמש הוא מנהל
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can see all agents' });
        }        
        const agents = await genericServices.getAllRecordsByColumn('users', 'role', 'agent');
        res.json(agents);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});





module.exports = router;