const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { authenticateToken, authorizeRoles } = require("./middlewares/authMiddleware");

// Returns all agents (users) - admin only
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const agents = await genericServices.getAllRecords('users');
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Returns a user name by user_id
router.get('/userName/:user_id', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const user = await genericServices.getRecordByColumn('users', 'user_id', user_id);
        if (!user) {
            return res.status(404).json({ error: 'user not found.' });
        }
        res.json({ user_name: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Returns a user_id by user name
router.get('/userId/:userName', authenticateToken, async (req, res) => {
    try {
        const { userName } = req.params;
        const user = await genericServices.getRecordByColumn('users', 'username', userName);
        if (!user) {
            return res.status(404).json({ error: 'user not found.' });
        }
        res.json({ user_id: user.user_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Returns all agents with role 'agent' - admin only
router.get('/agents/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const agents = await genericServices.getAllRecordsByColumn('users', 'role', 'agent');
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Updates a specific agent by agentId
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
// Deletes a specific agent by agentId - admin only
router.delete('/delete/:agentId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const agentId = req.params.agentId;
        const result = await genericServices.getRecordByColumn('users', 'user_id', agentId);
        if (!result) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        await genericServices.deleteRecord('users', 'user_id', agentId);
        res.json({ message: 'Agent deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;