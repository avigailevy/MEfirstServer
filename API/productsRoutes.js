const express = require('express');
const createGenericRouter = require('./genericRouter');
const genericServices = require('../Services/genericServices');
const router = express.Router();

const genericRouter = createGenericRouter('products', 'product_id', ['product_name', 'category', 'description']);
router.use('/', genericRouter);

// קבלת כל המוצרים עבור משתמש מסוים
router.get('/:username/products', async (req, res) => {
    try {
        const products = await genericServices.getAllRecords('products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// קבלת מוצר מסוים לפי מזהה עבור משתמש מסוים
router.get('/:username/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await genericServices.getRecordByColumn('products', 'product_id', id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// קבלת כל המוצרים לפי קטגוריה עבור משתמש מסוים
router.get('/:username/products/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await genericServices.getAllRecordsByColumn('products', 'category', category);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// קבלת מוצר לפי מזהה עבור משתמש מסוים וקטגוריה
router.get('/:username/products/:category/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await genericServices.getRecordByColumn('products', 'product_id', id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// מחיקת מוצר לפי מזהה עבור משתמש מסוים
router.delete('/:username/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await genericServices.deleteRecord('products', 'product_id', id);
        const deleted = true;
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// עדכון מוצר לפי מזהה עבור משתמש מסוים
router.put('/:username/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const updated = await genericServices.updateRecord('products', 'product_id', id, updatedData);
        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
