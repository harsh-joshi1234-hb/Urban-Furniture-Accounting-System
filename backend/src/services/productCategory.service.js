const prisma = require('../config/prisma');

const createCategory = async (data) => {
  return await prisma.productCategory.create({ data });
};

const getCategories = async () => {
  return await prisma.productCategory.findMany();
};

const getCategoryById = async (id) => {
  return await prisma.productCategory.findUnique({ where: { id } });
};

const updateCategory = async (id, data) => {
  return await prisma.productCategory.update({
    where: { id },
    data,
  });
};

const deleteCategory = async (id) => {
  const category = await prisma.productCategory.findUnique({
    where: { id },
    include: { products: true }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (category.products.length > 0) {
    throw new Error('CONFLICT: Category is referenced by products and cannot be deleted. Deactivate it instead.');
  }

  return await prisma.productCategory.delete({ where: { id } });
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
