const categoryService = require('../services/productCategory.service');
const auditService = require('../services/audit.service');

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'ProductCategory',
      entityId: category.id,
      action: 'PRODUCT_CATEGORY_CREATE',
      newValues: category
    });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const oldCat = await categoryService.getCategoryById(req.params.id);
    if (!oldCat) return res.status(404).json({ success: false, message: 'Category not found' });
    
    const category = await categoryService.updateCategory(req.params.id, req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'ProductCategory',
      entityId: category.id,
      action: 'PRODUCT_CATEGORY_UPDATE',
      oldValues: oldCat,
      newValues: category
    });
    res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id);
    await auditService.log({
      userId: req.user.id,
      entityType: 'ProductCategory',
      entityId: category.id,
      action: 'PRODUCT_CATEGORY_DELETE',
      oldValues: category
    });
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    if (error.message.startsWith('CONFLICT')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
