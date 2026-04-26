const Joi = require('joi');

exports.rejectSchema = Joi.object({
  rejection_reason: Joi.string().min(5).required().messages({
    'string.min': 'Rejection reason must be at least 5 characters long',
    'any.required': 'Rejection reason is required',
  }),
});
