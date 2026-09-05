const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateAccessToken } = require('../utils/jwt.util');
const { generateResetToken, hashToken } = require('../utils/crypto.util');
const emailService = require('../services/email.service');

const signup = async (req, res, next) => {
  try {
    const { loginId, email, password, name } = req.body;

    const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!userRole) {
      return res.status(500).json({ success: false, message: 'USER role not found in database' });
    }

    const existingLogin = await prisma.user.findUnique({ where: { loginId } });
    if (existingLogin) {
      return res.status(409).json({ success: false, message: 'Login ID already exists' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        loginId,
        email,
        name: name || loginId,
        passwordHash,
        roleId: userRole.id,
      },
      include: { role: true },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        name: user.name,
        role: user.role.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { loginId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Login Id or Password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Login Id or Password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          loginId: user.loginId,
          email: user.email,
          name: user.name,
          role: user.role.name,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const getMe = async (req, res, next) => {
  const { user } = req;
  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      loginId: user.loginId,
      email: user.email,
      name: user.name,
      role: user.role.name,
      isActive: user.isActive,
    },
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = generateResetToken();
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Only the hash is stored; the raw token leaves the system by email only.
      // Delivery failures are logged but never change the response, so this
      // endpoint cannot be used to discover which addresses are registered.
      const result = await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
        expiresAt,
      });

      if (!result.delivered) {
        console.error(
          `[auth] Password reset email for ${user.email} was not delivered: ${result.reason}`,
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'If the account exists, password reset instructions have been sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (resetRecord.usedAt) {
      return res.status(400).json({ success: false, message: 'Reset token has already been used' });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    const newPasswordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
