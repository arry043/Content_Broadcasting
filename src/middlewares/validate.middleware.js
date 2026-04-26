const AppError = require('../utils/AppError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(new AppError('Validation error', 400, errors));
    }

    next();
  };
};

module.exports = validate;
