const express = require('express');
const broadcastController = require('../controllers/broadcast.controller');
const rateLimiterMiddleware = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// GET /api/v1/content/live/:teacherId
router.get('/live/:teacherId', rateLimiterMiddleware, broadcastController.getLiveContent);

module.exports = router;
