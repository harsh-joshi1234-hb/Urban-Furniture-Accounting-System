const signupValidator = (req, res, next) => {
  const { loginId, email, password, confirmPassword } = req.body;

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

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase, and special character' });
  }

  next();
};

const loginValidator = (req, res, next) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: 'loginId and password are required' });
  }
  next();
};

const forgotPasswordValidator = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'email is required' });
  }
  next();
};

const resetPasswordValidator = (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'token, password, and confirmPassword are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  next();
};

module.exports = {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
