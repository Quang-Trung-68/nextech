const statsService = require('../services/stats.service');
const adminProductService = require('../services/adminProduct.service');
const adminUserService = require('../services/adminUser.service');
const { AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

// ─── Stats ────────────────────────────────────────────────────────────────────

const getOverviewStats = async (req, res, next) => {
  try {
    const data = await statsService.getOverviewStats(req.query.period);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRevenueStats = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const data = await statsService.getRevenueStats(year, month);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};


// ─── Admin Products ───────────────────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const result = await adminProductService.getProducts(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await adminProductService.getProductById(req.params.id);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await adminProductService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Sản phẩm đã được xoá' });
  } catch (err) {
    next(err);
  }
};

const regenerateProductSlug = async (req, res, next) => {
  try {
    const product = await adminProductService.regenerateProductSlug(req.params.id);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Admins ─────────────────────────────────────────────────────────────

const getAdmins = async (req, res, next) => {
  try {
    const result = await adminUserService.getAdmins(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Users ──────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.getUsers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminUserService.getUserById(
      req.params.id,
      Number(page) || 1,
      Number(limit) || 10
    );
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await adminUserService.toggleUserStatus(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const cloudinary = require('../utils/cloudinary');

const uploadImages = async (req, res, next) => {
  try {
    // req.cloudinaryFiles được set bởi uploadToCloudinary middleware
    const cloudinaryFiles = req.cloudinaryFiles;
    if (!cloudinaryFiles || cloudinaryFiles.length === 0) {
      return next(new AppError('No images uploaded', 400, ERROR_CODES.MEDIA.IMAGE_UPLOAD_FAILED));
    }
    // cloudinaryFiles = [{ url, publicId }] - đã được upload lên Cloudinary
    res.status(200).json({ success: true, images: cloudinaryFiles });
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    // publicId might be passed in body or encoded in params
    const publicId = req.params.publicId || req.body.publicId; 
    if (!publicId) {
      return next(new AppError('Missing publicId', 400, ERROR_CODES.SERVER.VALIDATION_ERROR));
    }
    await cloudinary.uploader.destroy(publicId);
    res.status(200).json({ success: true, message: 'Image deleted from Cloudinary' });
  } catch (err) {
    next(err);
  }
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateAiDescription = async (req, res, next) => {
  try {
    const { name, specs } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return next(new AppError('Chưa cấu hình GEMINI_API_KEY trong tệp .env', 500, ERROR_CODES.SERVER.INTERNAL_SERVER_ERROR));
    }
    apiKey = apiKey.replace(/^["']|["']$/g, '');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });

    const specsText = specs && Object.keys(specs).length > 0 
      ? Object.entries(specs).map(([k, v]) => `- **${k}**: ${v}`).join("\n")
      : "Không có thông số kỹ thuật chi tiết.";

    const prompt = `
Bạn là chuyên gia marketing sản phẩm công nghệ cao cấp của NexTech.
Hãy viết một bài mô tả sản phẩm hấp dẫn, thu hút và chi tiết cho sản phẩm sau đây:
- Tên sản phẩm: ${name}
- Thông số kỹ thuật:
${specsText}

YÊU CẦU:
1. Định dạng: Chỉ trả về VĂN BẢN THUẦN TÚY (Plain Text), không định dạng Markdown hay HTML. Tuyệt đối không dùng các ký tự như: dấu thăng (#), dấu sao (*), dấu xuyệt (/), dấu gạch đầu dòng (-), v.v.
2. Cấu trúc: Viết thành các đoạn văn trôi chảy, có xuống dòng giữa các đoạn để dễ đọc (không viết liền thành một khối duy nhất, không chia tiêu đề, không đánh số).
3. Nội dung: Giới thiệu ấn tượng về sản phẩm, phân tích chi tiết và nêu bật các ưu điểm vượt trội (hiệu năng, thiết kế, màn hình, camera, thời lượng pin... dựa trên thông số kỹ thuật) một cách tự nhiên và thuyết phục nhất.
4. Độ dài: Viết chi tiết, đầy đủ ý nghĩa và kéo dài nội dung tùy ý để giới thiệu sản phẩm thật đầy đủ, không giới hạn độ dài ngắn. Đảm bảo toàn bộ mô tả kết thúc trọn vẹn bằng dấu câu, không bị cắt cụt.
5. Tuyệt đối không kèm theo bất kỳ lời chào, phản hồi, ghi chú giải thích hay đếm số từ nào của AI. Chỉ trả về duy nhất nội dung bài mô tả.
`;

    const result = await model.generateContent(prompt);
    let description = result.response.text().trim();
    
    // Khử các ký tự đặc biệt/Markdown để đảm bảo văn bản thuần túy tuyệt đối
    description = description.replace(/[*#_`\-\\/]/g, '');
    // Chuẩn hóa khoảng trắng nhưng giữ lại xuống dòng (\n)
    description = description.replace(/[^\S\r\n]+/g, ' ').trim();

    res.status(200).json({
      success: true,
      description
    });
  } catch (err) {
    console.error("[AI Description Generation Error]", err);
    next(err);
  }
};

module.exports = {
  getOverviewStats,
  getRevenueStats,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  regenerateProductSlug,
  getAdmins,
  getUsers,
  getUserById,
  toggleUserStatus,
  uploadImages,
  deleteImage,
  generateAiDescription,
};
