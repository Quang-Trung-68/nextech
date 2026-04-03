const categoryService = require('../services/category.service');
const catchAsync = require('../utils/catchAsync');

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory({ name: req.body.name });
  res.status(201).json({ status: 'success', data: { category } });
});

const getAllCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json({ status: 'success', data: { categories } });
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(Number(req.params.id));
  res.status(200).json({ status: 'success', data: null });
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(Number(req.params.id), {
    name: req.body.name,
  });
  res.status(200).json({ status: 'success', data: { category } });
});

module.exports = { createCategory, getAllCategories, deleteCategory, updateCategory };
