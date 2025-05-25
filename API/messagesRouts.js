const createGenericRouter = require('../API/genericRouter');
const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

const genericRouter = createGenericRouter('messages', 'message_id', ['user_id', 'other_user_id', 'sent_or_got']);
router.use('/', genericRouter);

// קבלת כל ההודעות של משתמש מסוים
router.get('/user/:user_id', async (req, res) => {
    try {
        const messages = await genericServices.getAllRecordsByColumn('messages', 'user_id', req.params.user_id);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;