const prisma = require('../utils/prisma');

const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.shopSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: { id: 'singleton' }
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const data = req.body;
    const settings = await prisma.shopSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data }
    });
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
