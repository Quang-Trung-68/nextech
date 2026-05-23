const prisma = require("../utils/prisma");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo Gemini API Client
const getGeminiModel = (systemInstruction) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[AI Chat] CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong tệp .env");
  }
  const genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Dòng model Flash cực nhanh, miễn phí trên Google AI Studio
    systemInstruction, // Truyền trực tiếp vào cấu hình model
    generationConfig: {
      temperature: 0.3, // Thấp để AI trả lời nhất quán, thực tế và chính xác
      maxOutputTokens: 1000, // Đảm bảo phản hồi đầy đủ, chi tiết hơn
    }
  });
};

// Định nghĩa tĩnh các Chính Sách & FAQs làm Ngữ Cảnh của NexTech
const NEXTECH_POLICIES_CONTEXT = `
CHÍNH SÁCH VÀ FAQs CỦA NEXTECH (HỆ THỐNG CỬA HÀNG CÔNG NGHỆ PREMIUM):

1. Thông tin chung:
- NexTech là hệ thống bán lẻ điện thoại, laptop, máy tính bảng và phụ kiện chính hãng, bảo hành tối thiểu 12 tháng.
- 100% sản phẩm là hàng chính hãng, đầy đủ VAT và chứng nhận.

2. Chính sách vận chuyển:
- Miễn phí vận chuyển toàn quốc cho mọi đơn hàng.
- Thời gian giao hàng: từ 3 đến 5 ngày làm việc.
- Đổi địa chỉ nhận hàng: Chỉ hỗ trợ nếu đơn hàng chưa được đóng gói/vận chuyển (liên hệ hotline gấp).

3. Chính sách đổi trả & hoàn tiền:
- Hỗ trợ đổi trả trong vòng 30 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn, chưa kích hoạt, đầy đủ hộp và phụ kiện.
- Lỗi nhà sản xuất: Đổi mới 1-1 miễn phí trong 30 ngày đầu tiên.
- Hoàn tiền: Được xử lý và hoàn về tài khoản của khách hàng từ 3 đến 5 ngày làm việc sau khi shop kiểm tra hàng trả lại thành công.

4. Hỗ trợ thanh toán:
- NexTech hỗ trợ 3 hình thức thanh toán chính:
  + Thanh toán khi nhận hàng (COD).
  + Thanh toán thẻ Visa/Mastercard (qua Stripe).
  + Chuyển khoản ngân hàng quét mã QR (qua SePay).

5. Tài khoản & Khác:
- Quên mật khẩu: Người dùng tự lấy lại qua email đăng ký bằng tính năng "Quên mật khẩu".
- Hủy đơn hàng: Hỗ trợ tự hủy đơn trên hệ thống trong vòng 1 giờ kể từ khi đặt nếu đơn ở trạng thái CHỜ XÁC NHẬN. Sau 1 giờ vui lòng liên hệ hotline hỗ trợ.
`;

// Danh sách Stop words Tiếng Việt phổ biến trong hội thoại thương mại
const VIETNAMESE_STOP_WORDS = new Set([
  "tôi", "tớ", "mình", "bạn", "anh", "chị", "em", "họ", "chúng", "ta",
  "muốn", "tìm", "mua", "sản", "phẩm", "trong", "tầm", "giá", "triệu", "trở",
  "lên", "xuống", "dưới", "khoảng", "có", "không", "cái", "chiếc", "mẫu", "dòng",
  "nào", "hợp", "phù", "liệt", "kê", "cụ", "thể", "nhé", "nha", "thế",
  "nào", "được", "đi", "shop", "cửa", "hàng", "cho", "hỏi", "xin", "chào", "hi"
]);

// Helper: Phân tích và trích xuất từ khóa chất lượng
const extractKeywords = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, " ")
    .split(/\s+/)
    .filter(k => k.length >= 2 && !VIETNAMESE_STOP_WORDS.has(k));
};

// Helper: Tìm kiếm thông minh sản phẩm liên quan trong Database
const searchRelatedProducts = async (keywords) => {
  if (!keywords || keywords.length === 0) {
    // Trả về 8 sản phẩm bán chạy/mới để AI giới thiệu
    return await prisma.product.findMany({
      take: 8,
      include: { brand: true },
      orderBy: { rating: "desc" }
    });
  }

  // Tạo OR query tìm kiếm trong Tên, Danh mục, Thương hiệu
  const orQueries = keywords.map(kw => ({
    OR: [
      { name: { contains: kw, mode: 'insensitive' } },
      { category: { contains: kw, mode: 'insensitive' } },
      { brand: { name: { contains: kw, mode: 'insensitive' } } }
    ]
  }));

  // Thử tìm kiếm chặt chẽ (AND tất cả từ khóa)
  let products = await prisma.product.findMany({
    where: { AND: orQueries },
    take: 10,
    include: { brand: true }
  });

  // Nếu ít kết quả quá, chuyển sang tìm kiếm lỏng lẻo (OR bất kỳ từ khóa nào)
  if (products.length < 3) {
    products = await prisma.product.findMany({
      where: { OR: orQueries },
      take: 10,
      include: { brand: true }
    });
  }

  return products;
};

// Bảng ánh xạ từ tên Danh mục tiếng Việt (trong DB) sang slug route frontend
const CATEGORY_SLUG_MAP = {
  "Điện thoại": "phone",
  "Laptop": "laptop",
  "Máy tính bảng": "tablet",
  "Phụ kiện": "accessories",
  "Tai nghe": "accessories", // Tai nghe thuộc nhóm phụ kiện trên frontend
};

// Helper: Định dạng danh sách sản phẩm thành ngữ cảnh văn bản cho AI
const formatProductsContext = (products) => {
  if (products.length === 0) return "Không tìm thấy sản phẩm nào phù hợp trong kho hàng hiện tại.";
  
  return products.map(p => {
    const brandName = p.brand?.name || "Hãng khác";
    const priceStr = Math.round(Number(p.price)).toLocaleString("vi-VN") + "đ";
    const salePriceStr = p.salePrice ? Math.round(Number(p.salePrice)).toLocaleString("vi-VN") + "đ" : null;
    const finalPrice = salePriceStr ? `${salePriceStr} (Giá gốc: ${priceStr})` : priceStr;
    const stockStatus = p.stock > 0 ? `Còn hàng (${p.stock} sản phẩm)` : "Hết hàng";
    
    // Đường dẫn chính xác khớp với routing frontend: /{categorySlug}/{productSlug}
    const categorySlug = CATEGORY_SLUG_MAP[p.category] || "phone";
    const productLink = `/${categorySlug}/${p.slug}`;
    
    return `- [${p.name}](${productLink}) | Hãng: ${brandName} | Giá: ${finalPrice} | Trạng thái: ${stockStatus} | Mô tả: ${p.description.substring(0, 80)}...`;
  }).join("\n");
};

/**
 * GET /api/ai-chat/history
 * Lấy lịch sử chat (Đã đăng nhập) - Hỗ trợ phân trang cursor-based
 */
const getChatHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const cursor = req.query.cursor; // ID của tin nhắn cũ nhất làm mốc

    const queryOptions = {
      where: { userId: req.user.id },
      take: limit,
      orderBy: { createdAt: "desc" },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Bỏ qua chính bản ghi cursor
    }

    const messages = await prisma.aIChatMessage.findMany(queryOptions);

    // Trả về dạng đảo ngược để frontend hiển thị đúng thứ tự thời gian
    res.status(200).json({
      success: true,
      data: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0].id : null // cursor để lấy trang tiếp theo khi cuộn lên
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai-chat/send
 * Gửi tin nhắn và phản hồi từ AI (Đã Đăng Nhập)
 */
const sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Tin nhắn không được trống." });
    }

    const userId = req.user.id;

    // 1. Lưu tin nhắn của User vào DB
    const userMessage = await prisma.aIChatMessage.create({
      data: {
        userId,
        role: "user",
        content: message,
      }
    });

    // 2. Kéo 10 tin nhắn lịch sử hội thoại gần nhất làm ngữ cảnh
    const recentHistory = await prisma.aIChatMessage.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    
    // Đảo thứ tự về đúng trình tự hội thoại
    const chatHistoryContext = recentHistory.reverse().map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // 3. RAG: Tìm kiếm sản phẩm liên quan trong Database
    let keywords = extractKeywords(message);
    
    // Kế thừa ngữ cảnh nếu từ khóa quá ngắn và có lịch sử hội thoại
    if (keywords.length <= 1 && chatHistoryContext.length > 0) {
      const lastUserMsg = [...chatHistoryContext].reverse().find(msg => msg.role === "user");
      if (lastUserMsg && lastUserMsg.parts && lastUserMsg.parts[0]) {
        const prevKeywords = extractKeywords(lastUserMsg.parts[0].text);
        keywords = [...new Set([...keywords, ...prevKeywords])];
      }
    }

    const relatedProducts = await searchRelatedProducts(keywords);
    const productsContext = formatProductsContext(relatedProducts);

    // 4. Xây dựng prompt và gọi Gemini API
    
    const systemInstruction = `
Bạn là Trợ lý ảo AI thông minh và thân thiện của cửa hàng công nghệ NexTech.
Nhiệm vụ của bạn là tư vấn mua sắm sản phẩm và giải đáp chính sách bán hàng cho khách hàng.

QUY TẮC PHẢN HỒI:
1. TRẢ LỜI NGẮN GỌN: Câu trả lời tối đa 3 câu, ngắn gọn, đi thẳng vào ý khách hàng hỏi. Không dông dài.
2. CUNG CẤP LINK SẢN PHẨM: Khi nhắc đến bất kỳ sản phẩm nào có trong danh sách được cung cấp dưới đây, BẮT BUỘC phải chèn liên kết Markdown chính xác theo cấu trúc có sẵn trong danh sách (Ví dụ: [iPhone 15 Pro Max](/phone/iphone-15-pro-max)).
3. KHÔNG TỰ CHẾ LINK: Tuyệt đối không tự chế ra slug hay đường dẫn nếu sản phẩm đó không nằm trong danh sách ngữ cảnh dưới đây.
4. KHÔNG BỊA ĐẶT: Nếu khách hàng hỏi sản phẩm hoặc chính sách không có trong ngữ cảnh, hãy lịch sự trả lời rằng shop chưa có thông tin đó và đề xuất khách liên hệ Hotline 1800 xxxx.
5. Ngôn ngữ: Tiếng Việt tự nhiên, chuyên nghiệp.

NGỮ CẢNH HÀNG HÓA VÀ CHÍNH SÁCH HIỆN CÓ:
${NEXTECH_POLICIES_CONTEXT}

DANH SÁCH SẢN PHẨM LIÊN QUAN TRONG KHO:
${productsContext}
`;

    const model = getGeminiModel(systemInstruction);

    // Khởi tạo phiên chat với lịch sử
    const chatSession = model.startChat({
      history: chatHistoryContext.slice(0, -1), // Bỏ đi tin nhắn cuối vừa gửi vì ta sẽ gửi nó trong sendMessage
    });

    // Gửi tin nhắn mới nhất
    const result = await chatSession.sendMessage(message);
    const aiResponseText = result.response.text().trim();

    // 5. Lưu phản hồi của AI vào DB
    const aiMessage = await prisma.aIChatMessage.create({
      data: {
        userId,
        role: "model",
        content: aiResponseText,
      }
    });

    res.status(200).json({
      success: true,
      data: aiMessage
    });
  } catch (err) {
    console.error("[AI Chat LoggedIn Error]", err);
    next(err);
  }
};

/**
 * POST /api/ai-chat/send-guest
 * Gửi tin nhắn và phản hồi từ AI (Khách vãng lai - Guest Mode)
 * Không lưu DB, nhận lịch sử hội thoại truyền từ localStorage của Frontend.
 */
const sendGuestChatMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Tin nhắn không được trống." });
    }

    // Định dạng lại mảng lịch sử nhận từ frontend phù hợp định dạng Gemini SDK
    const chatHistoryContext = (history || []).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // RAG: Tìm kiếm sản phẩm liên quan trong Database
    let keywords = extractKeywords(message);
    
    // Kế thừa ngữ cảnh nếu từ khóa quá ngắn và có lịch sử hội thoại
    if (keywords.length <= 1 && chatHistoryContext.length > 0) {
      const lastUserMsg = [...chatHistoryContext].reverse().find(msg => msg.role === "user");
      if (lastUserMsg && lastUserMsg.parts && lastUserMsg.parts[0]) {
        const prevKeywords = extractKeywords(lastUserMsg.parts[0].text);
        keywords = [...new Set([...keywords, ...prevKeywords])];
      }
    }

    const relatedProducts = await searchRelatedProducts(keywords);
    const productsContext = formatProductsContext(relatedProducts);

    // Cấu hình Gemini System Instruction
    const systemInstruction = `
Bạn là Trợ lý ảo AI thông minh và thân thiện của cửa hàng công nghệ NexTech.
Nhiệm vụ của bạn là tư vấn mua sắm sản phẩm và giải đáp chính sách bán hàng cho khách hàng.

QUY TẮC PHẢN HỒI:
1. TRẢ LỜI NGẮN GỌN: Câu trả lời tối đa 3 câu, ngắn gọn, đi thẳng vào ý khách hàng hỏi. Không dông dài.
2. CUNG CẤP LINK SẢN PHẨM: Khi nhắc đến bất kỳ sản phẩm nào có trong danh sách được cung cấp dưới đây, BẮT BUỘC phải chèn liên kết Markdown chính xác theo cấu trúc có sẵn trong danh sách (Ví dụ: [iPhone 15 Pro Max](/phone/iphone-15-pro-max)).
3. KHÔNG TỰ CHẾ LINK: Tuyệt đối không tự chế ra slug hay đường dẫn nếu sản phẩm đó không nằm trong danh sách ngữ cảnh dưới đây.
4. KHÔNG BỊA ĐẶT: Nếu khách hàng hỏi sản phẩm hoặc chính sách không có trong ngữ cảnh, hãy lịch sự trả lời rằng shop chưa có thông tin đó và đề xuất khách liên hệ Hotline 1800 xxxx.
5. Ngôn ngữ: Tiếng Việt tự nhiên, chuyên nghiệp.

NGỮ CẢNH HÀNG HÓA VÀ CHÍNH SÁCH HIỆN CÓ:
${NEXTECH_POLICIES_CONTEXT}

DANH SÁCH SẢN PHẨM LIÊN QUAN TRONG KHO:
${productsContext}
`;

    const model = getGeminiModel(systemInstruction);

    // Khởi tạo phiên chat với lịch sử khách gửi lên
    const chatSession = model.startChat({
      history: chatHistoryContext,
    });

    console.log("[AI CHAT DEBUG] Keywords used:", keywords);
    console.log("[AI CHAT DEBUG] Products context sent:\n", productsContext);

    const result = await chatSession.sendMessage(message);
    const aiResponseText = result.response.text().trim();

    console.log("[AI CHAT DEBUG] Raw AI Response:\n", aiResponseText);

    // Trả về trực tiếp câu trả lời để Frontend tự append vào localStorage
    res.status(200).json({
      success: true,
      data: {
        role: "model",
        content: aiResponseText,
        createdAt: new Date(),
      }
    });
  } catch (err) {
    console.error("[AI Chat Guest Error]", err);
    next(err);
  }
};

/**
 * DELETE /api/ai-chat/history
 * Xóa toàn bộ lịch sử chat của người dùng đã đăng nhập
 */
const deleteChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.aIChatMessage.deleteMany({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      message: "Đã xóa toàn bộ lịch sử trò chuyện.",
    });
  } catch (err) {
    console.error("[AI Chat Delete Error]", err);
    next(err);
  }
};

module.exports = {
  getChatHistory,
  sendChatMessage,
  sendGuestChatMessage,
  deleteChatHistory,
};
