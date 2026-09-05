const createUserValidator = (req, res, next) => {
  const { loginId, email, password, roleId } = req.body;

  if (!loginId || typeof loginId !== 'string' || loginId.length < 6 || loginId.length > 12) {
    return res.status(400).json({ success: false, message: 'loginId is required and must be 6-12 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  if (!password || password.length <= 8) {
    return res.status(400).json({ success: false, message: 'Password must be greater than 8 characters' });
  }

  if (!roleId) {
    return res.status(400).json({ success: false, message: 'roleId is required' });
  }

  next();
};

module.exports = { createUserValidator };
