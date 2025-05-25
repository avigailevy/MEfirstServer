const express = require('express');
const createGenericRouter = require('./genericRouter');
const router = express.Router();

const genericRouter = createGenericRouter('products', 'product_id', ['product_name', 'category', 'description']);
router.use('/', genericRouter);

// כאן תוכל להוסיף ניתובים נוספים בעתיד

module.exports = router;