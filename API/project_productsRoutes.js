const express = require('express');
const genericServices = require('../Services/genericServices');
const { authenticateToken } = require('./middlewares/authMiddleware');
const router = express.Router({ mergeParams: true });
module.exports = router;

// Returns all products for a specific project
router.get('/:projectId/products', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        // 1. שליפת product_ids מטבלת הקשר
        const projectProducts = await genericServices.getAllRecordsByColumns({
            tableName: 'project_products',
            columnsObj: { project_id: projectId }
        });

        if (!Array.isArray(projectProducts)) {
            console.error("projectProducts אינו מערך:", projectProducts);
            return res.status(500).json({ error: "Internal error - projectProducts is not array" });
        }

        const productIds = projectProducts.map(pp => pp.product_id);

        if (productIds.length === 0) {
            return res.json([]);
        }

        // 2. שליפת המוצרים לפי המזהים
        const products = await genericServices.getRecordsWhereIn('products', 'product_id', productIds);

        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Updates the list of products for a specific project
router.put('/:projectId/products', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { productIds } = req.body;

    try {
        // 1. מחיקת כל השורות הקודמות של הפרויקט
        await genericServices.deleteRecord('project_products', 'project_id', projectId);
        console.log("Deleting all previous products for project:", projectId);

        // 2. הכנסת החדשים – בלולאה עם createRecord
        for (const productId of productIds) {
            await genericServices.createRecord('project_products', {
                project_id: projectId,
                product_id: productId
            });
        }

        console.log("Adding new products to project:", projectId, "Products:", productIds);

        res.json({ message: 'Products updated successfully using generic methods' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update products' });
    }
});

module.exports = router;