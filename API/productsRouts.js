const express = require('express');
const genericServices = require('../Services/genericServices');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await genericServices.getAllRecords('products');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await genericServices.getRecordByColumn('products', 'product_id', req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new product
router.post('/', async (req, res) => {
    try {
        const { product_name, category, description } = req.body;

        // Basic validation
        if (!product_name || !category || !description) {
            return res.status(400).json({ error: 'Missing required fields: product_name, category, description' });
        }
        if (!['dry', 'wet'].includes(category)) {
            return res.status(400).json({ error: "Category must be either 'dry' or 'wet'" });
        }

        const newProduct = await genericServices.createRecord('products', {
            product_name,
            category,
            description
        });
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a product by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await genericServices.updateRecord('products', 'product_id', req.params.id, req.body);
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a product by ID
router.delete('/:id', async (req, res) => {
    try {
        await genericServices.deleteRecord('products', 'product_id', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;