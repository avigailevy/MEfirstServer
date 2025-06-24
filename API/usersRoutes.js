const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require("./middlewares/authMiddleware");
const {authorizeRoles} = require("./middlewares/authMiddleware");


// מחזיר את כל הסוכנים - רק למנהלים
router.get('/agents/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const agents = await genericServices.getAllRecordsByColumn('users', 'role', 'agent');
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//delete a specific agent
router.delete('/delete/:agentId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const agentId = req.params.agentId;
        const result = await genericServices.getRecordByColumn('users', 'user_id', agentId);
        if (result) {
            res.json({ message: 'Agent updated successfully' });
        } else {
            res.status(404).json({ error: 'Agent not found' });
        }

        await genericServices.deleteRecord('users', 'user_id', agentId);
        res.json({ message: 'Agent deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//update a specific agent
router.put('/update/:agentId', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        const agentId = req.params.user_id;
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

//get a user name by the user_id
router.get('/userName/:user_id', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const user = await genericServices.getRecordByColumn('users', 'user_id', user_id);
        if (!user) {
            return res.status(404).json({ error: 'user not found.' });
        }
        res.json({ username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }   
});

module.exports = router;