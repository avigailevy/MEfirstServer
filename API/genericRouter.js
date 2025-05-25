const express = require('express');
const genericServices = require('../Services/genericServices');

function createGenericRouter(tableName, primaryKey, requiredFields = []) {
    const router = express.Router();

    // קבלת כל הרשומות
    router.get('/', async (req, res) => {
        try {
            const records = await genericServices.getAllRecords(tableName);
            res.json(records);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // קבלת רשומה לפי מזהה
    router.get(`/:${primaryKey}`, async (req, res) => {
        try {
            const record = await genericServices.getRecordByColumn(tableName, primaryKey, req.params[primaryKey]);
            if (!record) return res.status(404).json({ error: 'Not found' });
            res.json(record);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // יצירת רשומה חדשה
    router.post('/', async (req, res) => {
        try {
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ error: `${field} is required` });
                }
            }
            const newRecord = await genericServices.createRecord(tableName, req.body);
            res.status(201).json(newRecord);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // עדכון רשומה
    router.put(`/:${primaryKey}`, async (req, res) => {
        try {
            const updated = await genericServices.updateRecord(tableName, primaryKey, req.params[primaryKey], req.body);
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // מחיקת רשומה
    router.delete(`/:${primaryKey}`, async (req, res) => {
        try {
            await genericServices.deleteRecord(tableName, primaryKey, req.params[primaryKey]);
            res.status(204).end();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}

module.exports = createGenericRouter;