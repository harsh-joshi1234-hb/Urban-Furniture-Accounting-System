const express = require('express');
const router = express.Router();

router.use( (req, res) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
});

module.exports = router;
