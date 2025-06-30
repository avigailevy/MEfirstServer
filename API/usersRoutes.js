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
        const user = await genericServices.getRecordByColumns('users', { user_id: user_id });
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
        const user = await genericServices.getRecordByColumns('users', { username: userName });
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
        const agents = await genericServices.getAllRecordsByColumns({ tableName: 'users', columnsObj: { role: 'agent' } });
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
// Adds a new user with role 'agent' - admin only
router.post('/addAgent', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { username } = req.params;
        const { password, ...otherFields } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if the user already exists
        const existing = await genericServices.getRecordByColumns('users', { username });
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash the password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new agent
        const newAgent = await genericServices.createRecord('users', {
            username,
            password: hashedPassword,
            role: 'agent',
            ...otherFields
        });

        res.status(201).json({ user_id: newAgent.user_id, username: newAgent.username, role: newAgent.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Deletes a specific agent by agentId - admin only
router.delete('/delete/:agentId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const agentId = req.params.agentId;
        const result = await genericServices.getRecordByColumns('users', { user_id: agentId });
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