const express = require('express');
const createGenericRouter = require('./genericRouter');
const router = express.Router();

const genericRouter = createGenericRouter('stages', 'stage_id', ['project_id', 'stage_number']);
router.use('/', genericRouter);

// כאן תוכל להוסיף ניתובים נוספים בעתיד

module.exports = router;