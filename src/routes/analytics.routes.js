const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorize('principal'));

router.get('/subjects', analyticsController.getSubjectsAnalytics);
router.get('/content/:contentId', analyticsController.getContentAnalytics);
router.get('/teachers', analyticsController.getTeachersAnalytics);

module.exports = router;
