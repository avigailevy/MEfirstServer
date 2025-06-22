const express = require('express');
const genericServices = require('../Services/genericServices');
const router = express.Router();

// קבלת כל המוצרים עבור משתמש מסוים
router.get('/products', async (req, res) => {
    try {
        const products = await genericServices.getAllRecords('products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// קבלת מוצר מסוים לפי מזהה עבור משתמש מסוים
router.get('/:productId', async (req, res) => {    
    try {
        const { productId } = req.params;
        const product = await genericServices.getRecordByColumn('products', 'product_id', productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// קבלת כל המוצרים לפי קטגוריה עבור משתמש מסוים
router.get('/:category/all', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await genericServices.getAllRecordsByColumn('products', 'category', category);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// קבלת מוצר לפי מזהה עבור משתמש מסוים וקטגוריה
router.get('/:category/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await genericServices.getRecordByColumn('products', 'product_id', productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// מחיקת מוצר לפי מזהה עבור משתמש מסוים
router.delete('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        await genericServices.deleteRecord('products', 'product_id', productId);
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
router.put('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const updatedData = req.body;
        const updated = await genericServices.updateRecord('products', 'product_id', productId, updatedData);
        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
