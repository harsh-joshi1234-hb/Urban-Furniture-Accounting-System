const reportService = require('../services/report.service');

const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getProfitLoss(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getBalanceSheet = async (req, res, next) => {
  try {
    const { asOfDate } = req.query;
    const data = await reportService.getBalanceSheet(asOfDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getBudgetReport = async (req, res, next) => {
  try {
    const data = await reportService.getBudgetReport(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfitLoss,
  getBalanceSheet,
  getBudgetReport
};
