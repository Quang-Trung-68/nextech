const prisma = require('../utils/prisma');
const { NotFoundError, AppError } = require('../errors/AppError');

const now = () => new Date();

const getActiveBanners = async () => {
  const t = now();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: t } }] },
        { OR: [{ endDate: null }, { endDate: { gte: t } }] },
      ],
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

const getAllBannersAdmin = async () => {
  return prisma.banner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
};

const createBanner = async (data) => {
  return prisma.banner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle ?? null,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      bgColor: data.bgColor ?? '#f5f5f7',
      textColor: data.textColor ?? '#1d1d1f',
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
};

const updateBanner = async (id, data) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Banner');

  const payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.subtitle !== undefined) payload.subtitle = data.subtitle;
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (data.linkUrl !== undefined) payload.linkUrl = data.linkUrl;
  if (data.bgColor !== undefined) payload.bgColor = data.bgColor;
  if (data.textColor !== undefined) payload.textColor = data.textColor;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.order !== undefined) payload.order = data.order;
  if (data.startDate !== undefined) payload.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) payload.endDate = data.endDate ? new Date(data.endDate) : null;

  if (Object.keys(payload).length === 0) {
    throw new AppError('Cần ít nhất một trường để cập nhật', 400, 'VALIDATION_ERROR');
  }

  return prisma.banner.update({
    where: { id },
    data: payload,
  });
};

const deleteBanner = async (id) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Banner');
  await prisma.banner.delete({ where: { id } });
  return existing;
};

const toggleBannerActive = async (id) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Banner');
  return prisma.banner.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
};

module.exports = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
};
