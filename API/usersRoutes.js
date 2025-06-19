const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require("./middlewares/authMiddleware");

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

//delete a specific agent
router.delete('/delete/:agentId', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // בדוק אם המשתמש הוא מנהל
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can delete agents' });
        }
        const agentId = req.params.agentId;
        const result = await genericServices.deleteRecord('users', 'user_id', agentId);
        if (result) {
            res.json({ message: 'Agent deleted successfully' });
        } else {
            res.status(404).json({ error: 'Agent not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//update a specific agent
router.put('/update/:agentId', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // בדוק אם המשתמש הוא מנהל
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can update agents' });
        }
        const agentId = req.params.agentId;
        const updatedData = req.body;
        const result = await genericServices.updateRecord('users', 'user_id', agentId, updatedData);
        if (result) {
            res.json({ message: 'Agent updated successfully' });
        } else {
            res.status(404).json({ error: 'Agent not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;