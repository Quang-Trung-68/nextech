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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return next(new AppError('Chưa cấu hình GEMINI_API_KEY trong tệp .env', 500, ERROR_CODES.SERVER.INTERNAL_SERVER_ERROR));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const specsText = specs && Object.keys(specs).length > 0 
      ? Object.entries(specs).map(([k, v]) => `- **${k}**: ${v}`).join("\n")
      : "Không có thông số kỹ thuật chi tiết.";

    const prompt = `
Bạn là chuyên gia marketing sản phẩm công nghệ cao cấp của NexTech.
Hãy viết một bài mô tả sản phẩm marketing hấp dẫn, thu hút và chuyên nghiệp cho sản phẩm sau đây:
- Tên sản phẩm: ${name}
- Thông số kỹ thuật:
${specsText}

YÊU CẦU:
1. Giọng văn: Hiện đại, lôi cuốn, chuyên nghiệp, làm nổi bật được giá trị và ưu điểm vượt trội của sản phẩm.
2. Cấu trúc bài viết (bắt buộc phải có):
   - Đoạn mở đầu: Giới thiệu ấn tượng về sản phẩm.
   - Các đặc điểm nổi bật (3-4 mục lớn): Viết chi tiết về thiết kế, hiệu năng, màn hình, camera, thời lượng pin... dựa trên thông số kỹ thuật và suy luận thực tế phù hợp về sản phẩm công nghệ.
   - Đoạn kết: Khẳng định sự phù hợp của sản phẩm đối với đối tượng người dùng nào và kêu gọi sở hữu.
3. Định dạng: Trả về văn bản dưới dạng Markdown chuẩn để hiển thị đẹp mắt trên website. Không trả về các thẻ HTML.
4. Độ dài: Toàn bộ bài viết KHÔNG ĐƯỢC vượt quá 500 từ. Hãy viết súc tích, cô đọng nhưng đầy sức thuyết phục.

Hãy viết bài viết hoàn chỉnh và trả về trực tiếp đoạn văn Markdown, không kèm theo lời thoại chào hỏi nào khác.
`;

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim();

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
  getUsers,
  getUserById,
  toggleUserStatus,
  uploadImages,
  deleteImage,
  generateAiDescription,
};
