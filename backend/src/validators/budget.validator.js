const Joi = require('joi');

const validateBudget = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    analyticAccountId: Joi.string().uuid().required(),
    type: Joi.string().valid('INCOME', 'EXPENSE').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    committedAmount: Joi.number().min(0).required(),
    responsibleContactId: Joi.string().uuid().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

const validateBudgetRevision = (req, res, next) => {
  const schema = Joi.object({
    committedAmount: Joi.number().min(0).required(),
    endDate: Joi.date().iso().optional() // Allow extending the budget during revision
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

module.exports = {
  validateBudget,
  validateBudgetRevision
};
