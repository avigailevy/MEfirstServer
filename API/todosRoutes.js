const express = require('express');
const createGenericRouter = require('./genericRouter');
const router = express.Router();

const genericRouter = createGenericRouter('todos', 'todo_id', ['from_user_id', 'to_user_id', 'title']);
router.use('/', genericRouter);

// כאן תוכל להוסיף ניתובים נוספים בעתיד

module.exports = router;