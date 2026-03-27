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

module.exports = { createTag, getAllTags };
