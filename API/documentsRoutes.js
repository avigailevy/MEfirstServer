const createGenericRouter = require('./genericRouter');
const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const genericRouter = createGenericRouter('documents', 'document_id', ['project_id', 'doc_type', 'doc_version', 'file_path']);
router.use('/', genericRouter);


module.exports = router;