const Joi = require('joi');

const validateProfitLoss = (req, res, next) => {
  const schema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  });

  const { error } = schema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

const validateBalanceSheet = (req, res, next) => {
  const schema = Joi.object({
    asOfDate: Joi.date().iso().optional()
  });

  const { error } = schema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

const validateBudgetReport = (req, res, next) => {
  const schema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    type: Joi.string().valid('INCOME', 'EXPENSE').optional(),
    analyticAccountId: Joi.string().uuid().optional(),
    responsibleContactId: Joi.string().uuid().optional(),
    status: Joi.string().valid('DRAFT', 'CONFIRMED', 'REVISED', 'CANCELLED').optional()
  });

  const { error } = schema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

module.exports = {
  validateProfitLoss,
  validateBalanceSheet,
  validateBudgetReport
};
