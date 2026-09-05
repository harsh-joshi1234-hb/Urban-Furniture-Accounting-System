const prisma = require('../config/prisma');

const createProduct = async (data) => {
  return await prisma.product.create({ data });
};

const getProducts = async (filters) => {
  const where = {};
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.productType) where.productType = filters.productType;
  if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';

  return await prisma.product.findMany({ where, include: { category: true } });
};

const getProductById = async (id) => {
  return await prisma.product.findUnique({ where: { id }, include: { category: true } });
};

const updateProduct = async (id, data) => {
  return await prisma.product.update({
    where: { id },
    data,
  });
};

const deleteProduct = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      soLines: true,
      invLines: true,
      poLines: true,
      billLines: true,
    }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const inUse = 
    product.soLines.length > 0 ||
    product.invLines.length > 0 ||
    product.poLines.length > 0 ||
    product.billLines.length > 0;

  if (inUse) {
    throw new Error('CONFLICT: Product is referenced by business lines and cannot be deleted.');
  }

  return await prisma.product.delete({ where: { id } });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
