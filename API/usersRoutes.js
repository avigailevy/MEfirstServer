const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

//ניתוב שמחזיר את כל הסוכנים
router.get('/agents/all', async (req, res) => {
    try {
        res.json(genericServices.getAllRecordsByColumn('users', 'role', 'agent'));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})





module.exports = router;