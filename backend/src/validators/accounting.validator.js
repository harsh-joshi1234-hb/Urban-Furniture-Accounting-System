const Joi = require('joi');

const validateAccount = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().valid('ASSET', 'LIABILITY', 'BANK', 'CASH', 'CAPITAL', 'INCOME', 'EXPENSE', 'OTHER_EXPENSE').required(),
    parentId: Joi.string().uuid().optional().allow(null),
    isActive: Joi.boolean().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

const validateJournal = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('SALES', 'PURCHASE', 'BANK', 'CASH').required(),
    defaultAccountId: Joi.string().uuid().required(),
    isActive: Joi.boolean().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

const validateJournalEntry = (req, res, next) => {
  const schema = Joi.object({
    journalId: Joi.string().uuid().required(),
    partnerId: Joi.string().uuid().optional().allow(null),
    accountingDate: Joi.date().iso().required(),
    documentDate: Joi.date().iso().required(),
    sourceType: Joi.string().valid('CUSTOMER_INVOICE', 'VENDOR_BILL', 'CUSTOMER_PAYMENT', 'VENDOR_PAYMENT', 'MANUAL').optional(),
    sourceId: Joi.string().uuid().optional().allow(null),
    items: Joi.array().items(
      Joi.object({
        accountId: Joi.string().uuid().required(),
        partnerId: Joi.string().uuid().optional().allow(null),
        analyticAccountId: Joi.string().uuid().optional().allow(null),
        debit: Joi.number().min(0).default(0),
        credit: Joi.number().min(0).default(0),
        description: Joi.string().optional().allow('', null)
      })
    ).min(2).required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

module.exports = {
  validateAccount,
  validateJournal,
  validateJournalEntry
};
