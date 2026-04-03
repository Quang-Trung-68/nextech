const tagService = require('../services/tag.service');
const catchAsync = require('../utils/catchAsync');

const createTag = catchAsync(async (req, res) => {
  const tag = await tagService.createTag({ name: req.body.name });
  res.status(201).json({ status: 'success', data: { tag } });
});

const getAllTags = catchAsync(async (req, res) => {
  const tags = await tagService.getAllTags();
  res.status(200).json({ status: 'success', data: { tags } });
});

const deleteTag = catchAsync(async (req, res) => {
  await tagService.deleteTag(Number(req.params.id));
  res.status(200).json({ status: 'success', data: null });
});

const searchTags = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const tags = await tagService.searchTags({ q: req.query.q, limit });
  res.status(200).json({ status: 'success', data: { tags } });
});

module.exports = { createTag, getAllTags, deleteTag, searchTags };
