const express = require('express');
const router = express.Router();

router.all('*', (req, res) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
});

module.exports = router;
