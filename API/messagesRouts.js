const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

// קבלת כל ההודעות
router.get('/', async (req, res) => {
    try {
        const messages = await genericServices.getAllRecords('messages');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת הודעה לפי מזהה
router.get('/:message_id', async (req, res) => {
    try {
        const message = await genericServices.getRecordByColumn('messages', 'message_id', req.params.message_id);
        if (!message) return res.status(404).json({ error: 'Not found' });
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת כל ההודעות של משתמש מסוים
router.get('/user/:user_id', async (req, res) => {
    try {
        const messages = await genericServices.getAllRecordsByColumn('messages', 'user_id', req.params.user_id);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// יצירת הודעה חדשה
router.post('/', async (req, res) => {
    try {
        // חובה: user_id, other_user_id, sent_or_got
        const { user_id, other_user_id, sent_or_got } = req.body;
        if (!user_id || !other_user_id || !sent_or_got) {
            return res.status(400).json({ error: 'user_id, other_user_id and sent_or_got are required' });
        }
        const newMessage = await genericServices.createRecord('messages', req.body);
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// עדכון הודעה
router.put('/:message_id', async (req, res) => {
    try {
        const updated = await genericServices.updateRecord('messages', 'message_id', req.params.message_id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// מחיקת הודעה
router.delete('/:message_id', async (req, res) => {
    try {
        await genericServices.deleteRecord('messages', 'message_id', req.params.message_id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;