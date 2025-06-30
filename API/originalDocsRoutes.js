const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const {authenticateToken} = require('./middlewares/authMiddleware');

module.exports = router;