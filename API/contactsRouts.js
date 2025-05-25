const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

// קבלת כל אנשי הקשר
router.get('/', async (req, res) => {
    try {
        const contacts = await genericServices.getAllRecords('contacts');
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת איש קשר לפי מזהה איש קשר
router.get('/:contact_id', async (req, res) => {
    try {
        const contact = await genericServices.getRecordByColumn('contacts', 'contact_id', req.params.contact_id);
        if (!contact) return res.status(404).json({ error: 'Not found' });
        res.json(contact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// קבלת כל אנשי הקשר של משתמש מסוים
router.get('/user/:user_id', async (req, res) => {
    try {
        const contacts = await genericServices.getAllRecordsByColumn('contacts', 'user_id', req.params.user_id);
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// יצירת איש קשר חדש
router.post('/', async (req, res) => {
    try {
        // חובה: user_id, contact_name
        const { user_id, contact_name } = req.body;
        if (!user_id || !contact_name) {
            return res.status(400).json({ error: 'user_id and contact_name are required' });
        }
        const newContact = await genericServices.createRecord('contacts', req.body);
        res.status(201).json(newContact);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// עדכון איש קשר
router.put('/:contact_id', async (req, res) => {
    try {
        const updated = await genericServices.updateRecord('contacts', 'contact_id', req.params.contact_id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// מחיקת איש קשר
router.delete('/:contact_id', async (req, res) => {
    try {
        await genericServices.deleteRecord('contacts', 'contact_id', req.params.contact_id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;