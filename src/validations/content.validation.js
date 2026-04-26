const Joi = require('joi');

exports.uploadSchema = Joi.object({
  title: Joi.string().required(),
  subject: Joi.string().valid('Maths', 'Science', 'English', 'History', 'Geography', 'Other').required(),
  description: Joi.string().optional().allow(''),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).optional(),
  duration_minutes: Joi.number().integer().min(1).optional().default(5),
}).and('start_time', 'end_time'); // if one is provided, the other must be too
