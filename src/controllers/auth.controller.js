const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);

    return successResponse(res, 200, 'Login successful', { token, user });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'User profile retrieved successfully', { user: req.user });
  } catch (error) {
    next(error);
  }
};
