const createGenericRouter = require('./genericRouter');
const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

const genericRouter = createGenericRouter('contacts', 'contact_id', ['user_id', 'contact_name']);
router.use('/', genericRouter);

// קבלת כל אנשי הקשר של משתמש מסוים
router.get('/user/:user_id', async (req, res) => {
    try {
        const contacts = await genericServices.getAllRecordsByColumn('contacts', 'user_id', req.params.user_id);
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;