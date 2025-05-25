const express = require('express');
const createGenericRouter = require('./genericRouter');
const router = express.Router();

const genericRouter = createGenericRouter('summaries', 'summary_id', ['from_user_id']);
router.use('/', genericRouter);

// כאן תוכל להוסיף ניתובים נוספים בעתיד

module.exports = router;