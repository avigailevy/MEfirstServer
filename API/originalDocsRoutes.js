const express = require('express');
const createGenericRouter = require('./genericRouter');
const router = express.Router();

const genericRouter = createGenericRouter('originalDocs', 'org_doc_id', ['file_path']);
router.use('/', genericRouter);

// כאן תוכל להוסיף ניתובים נוספים בעתיד

module.exports = router;