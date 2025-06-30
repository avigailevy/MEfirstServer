const express = require('express');
const genericServices = require('../Services/genericServices');
const router = express.Router();
const { authenticateToken } = require('./middlewares/authMiddleware');

// Returns all products
router.get('/', authenticateToken, async (req, res) => {
    try {
        const products = await genericServices.getAllRecords('products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});
// Returns a specific product by category and productId
router.get('/:category/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await genericServices.getRecordByColumns('products', { product_id: productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});
// Returns all products in a specific category
router.get('/:category/all', authenticateToken, async (req, res) => {
    try {
        const { category } = req.params;
        const products = await genericServices.getAllRecordsByColumns({ tableName: 'products', columnsObj: { category: category } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});
// Returns a specific product by productId
router.get('/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await genericServices.getRecordByColumns('products', { product_id: productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});
// Updates a product by productId
router.put('/:productId', authenticateToken, async (req, res) => {
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
// Creates a new product
router.post('/', authenticateToken, async (req, res) => {
    try {
        const updatedData = req.body;
        const updated = await genericServices.createRecord('products', updatedData);
        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});
// Deletes a product by productId
router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const { username, productId } = req.params;
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

module.exports = router;
