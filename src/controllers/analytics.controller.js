const analyticsService = require('../services/analytics.service');
const { successResponse } = require('../utils/response');

exports.getSubjectsAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getSubjectsAnalytics();
    return successResponse(res, 200, 'Subjects analytics retrieved', { analytics });
  } catch (error) {
    next(error);
  }
};

exports.getContentAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getContentAnalytics(req.params.contentId);
    return successResponse(res, 200, 'Content analytics retrieved', { analytics });
  } catch (error) {
    next(error);
  }
};

exports.getTeachersAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getTeachersAnalytics();
    return successResponse(res, 200, 'Teachers analytics retrieved', { analytics });
  } catch (error) {
    next(error);
  }
};
