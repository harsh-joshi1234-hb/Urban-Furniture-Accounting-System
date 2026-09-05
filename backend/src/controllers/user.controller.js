const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true,
      },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { loginId, email, password, name, roleId } = req.body;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ loginId }, { email }] },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Login ID or Email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { loginId, email, name: name || loginId, passwordHash, roleId },
      select: { id: true, loginId: true, email: true, role: { select: { name: true } } },
    });
    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, roleId } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { name, email, roleId },
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
    });
    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id }, data: { isActive: true } });
    res.status(200).json({ success: true, message: 'User activated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
};
