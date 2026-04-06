const catchAsync = require('../utils/catchAsync');
const adminBrandService = require('../services/adminBrand.service');

const listBrands = catchAsync(async (req, res) => {
  const brands = await adminBrandService.listAdmin();
  res.status(200).json({ status: 'success', data: { brands } });
});

const getBrand = catchAsync(async (req, res) => {
  const brand = await adminBrandService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: { brand } });
});

const createBrand = catchAsync(async (req, res) => {
  const brand = await adminBrandService.createBrand(req.body);
  res.status(201).json({ status: 'success', data: { brand } });
});

const updateBrand = catchAsync(async (req, res) => {
  const brand = await adminBrandService.updateBrand(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { brand } });
});

const deleteBrand = catchAsync(async (req, res) => {
  const brand = await adminBrandService.deleteBrand(req.params.id);
  res.status(200).json({ status: 'success', data: { brand } });
});

const uploadLogoOnly = catchAsync(async (req, res) => {
  const url = req.cloudinarySingle?.url;
  if (!url) {
    return res.status(400).json({ status: 'error', message: 'Không có ảnh được tải lên' });
  }
  res.status(200).json({ status: 'success', data: { logoUrl: url } });
});

module.exports = {
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadLogoOnly,
};
