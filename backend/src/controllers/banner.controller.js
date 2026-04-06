const catchAsync = require('../utils/catchAsync');
const bannerService = require('../services/banner.service');

const getActiveBanners = catchAsync(async (req, res) => {
  const banners = await bannerService.getActiveBanners();
  res.status(200).json({ status: 'success', data: { banners } });
});

const getAllBannersAdmin = catchAsync(async (req, res) => {
  const banners = await bannerService.getAllBannersAdmin();
  res.status(200).json({ status: 'success', data: { banners } });
});

const createBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.createBanner(req.body);
  res.status(201).json({ status: 'success', data: { banner } });
});

const updateBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { banner } });
});

const deleteBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.deleteBanner(req.params.id);
  res.status(200).json({ status: 'success', data: { banner } });
});

const toggleBannerActive = catchAsync(async (req, res) => {
  const banner = await bannerService.toggleBannerActive(req.params.id);
  res.status(200).json({ status: 'success', data: { banner } });
});

const uploadBannerImageOnly = catchAsync(async (req, res) => {
  const url = req.cloudinarySingle?.url;
  if (!url) {
    return res.status(400).json({ status: 'error', message: 'Không có ảnh được tải lên' });
  }
  res.status(200).json({ status: 'success', data: { imageUrl: url } });
});

module.exports = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  uploadBannerImageOnly,
};
