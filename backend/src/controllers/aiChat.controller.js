const prisma = require("../utils/prisma");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Khởi tạo Gemini Client ────────────────────────────────────────────────────
const getGeminiModel = (systemInstruction, tools) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[AI Chat] CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong tệp .env");
  }
  const genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    tools,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1500,
    }
  });
};

// ── Chính Sách & FAQs NexTech ──────────────────────────────────────────────────
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

// ── Định nghĩa Function Calling Tools ────────────────────────────────────────
const SEARCH_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "searchProducts",
        description:
          "Tìm kiếm sản phẩm trong cửa hàng NexTech dựa trên nhu cầu của khách hàng. Gọi function này khi khách hỏi về sản phẩm, muốn tìm điện thoại/laptop/máy tính bảng/phụ kiện theo khoảng giá, hãng, hoặc tính năng.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Danh mục sản phẩm cần tìm. Các giá trị hợp lệ: 'Điện thoại', 'Laptop', 'Máy tính bảng', 'Phụ kiện', 'Tai nghe'. Để trống nếu không xác định.",
            },
            brand: {
              type: "string",
              description:
                "Tên hãng sản xuất cần tìm, ví dụ: 'Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'realme', 'Sony', 'Dell', 'HP', 'Asus', 'Lenovo'. Để trống nếu không xác định.",
            },
            minPrice: {
              type: "number",
              description:
                "Giá tối thiểu tính bằng VNĐ. Ví dụ: khách nói 'trên 10 triệu' thì minPrice = 10000000. Để null nếu không giới hạn.",
            },
            maxPrice: {
              type: "number",
              description:
                "Giá tối đa tính bằng VNĐ. Ví dụ: khách nói 'dưới 15 triệu' thì maxPrice = 15000000. Để null nếu không giới hạn.",
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description:
                "Danh sách từ khóa tính năng/mô tả cần tìm, ví dụ: ['pin trâu', 'chụp ảnh đẹp', 'màn hình lớn', 'RAM 12GB', 'gaming']. Bỏ qua các từ thông thường.",
            },
          },
          required: [],
        },
      },
    ],
  },
];

// ── Bảng ánh xạ Category → Slug route frontend ────────────────────────────────
const CATEGORY_SLUG_MAP = {
  "Điện thoại": "phone",
  "Laptop": "laptop",
  "Máy tính bảng": "tablet",
  "Phụ kiện": "accessories",
  "Tai nghe": "accessories",
};

// ── Execute DB Search với filter nâng cao ─────────────────────────────────────
const executeDbSearch = async (args) => {
  const { category, brand, minPrice, maxPrice, keywords = [] } = args;

  const whereClause = {};

  // Filter danh mục
  if (category && category.trim()) {
    whereClause.category = { contains: category.trim(), mode: "insensitive" };
  }

  // Filter thương hiệu
  if (brand && brand.trim()) {
    whereClause.brand = {
      name: { contains: brand.trim(), mode: "insensitive" },
    };
  }

  // Filter khoảng giá (dùng giá cuối = salePrice nếu có, không thì price)
  const priceFilter = {};
  if (minPrice != null && !isNaN(minPrice)) priceFilter.gte = minPrice;
  if (maxPrice != null && !isNaN(maxPrice)) priceFilter.lte = maxPrice;

  if (Object.keys(priceFilter).length > 0) {
    // Tìm sản phẩm mà (salePrice trong khoảng) OR (salePrice null AND price trong khoảng)
    whereClause.OR = [
      { salePrice: priceFilter },
      { salePrice: null, price: priceFilter },
    ];
  }

  // Filter theo từ khóa tính năng (name hoặc description)
  let products = [];
  if (keywords.length > 0) {
    const kwConditions = keywords.map((kw) => ({
      OR: [
        { name: { contains: kw, mode: "insensitive" } },
        { description: { contains: kw, mode: "insensitive" } },
        { category: { contains: kw, mode: "insensitive" } },
      ],
    }));

    // Thử AND trước (tất cả từ khóa đều khớp)
    products = await prisma.product.findMany({
      where: { ...whereClause, AND: kwConditions },
      take: 8,
      include: { brand: true },
      orderBy: [{ rating: "desc" }, { stock: "desc" }],
    });

    // Nếu quá ít kết quả, dùng OR (bất kỳ từ khóa nào khớp)
    if (products.length < 2) {
      products = await prisma.product.findMany({
        where: { ...whereClause, OR: kwConditions },
        take: 8,
        include: { brand: true },
        orderBy: [{ rating: "desc" }, { stock: "desc" }],
      });
    }
  } else {
    // Không có từ khóa, chỉ lọc theo giá/hãng/danh mục
    products = await prisma.product.findMany({
      where: whereClause,
      take: 8,
      include: { brand: true },
      orderBy: [{ rating: "desc" }, { stock: "desc" }],
    });
  }

  // Fallback: nếu vẫn không có kết quả và có filter, nới lỏng filter giá ±20%
  if (products.length === 0 && Object.keys(priceFilter).length > 0) {
    const relaxedPriceFilter = {};
    if (priceFilter.gte) relaxedPriceFilter.gte = priceFilter.gte * 0.8;
    if (priceFilter.lte) relaxedPriceFilter.lte = priceFilter.lte * 1.2;
    products = await prisma.product.findMany({
      where: {
        ...whereClause,
        OR: [
          { salePrice: relaxedPriceFilter },
          { salePrice: null, price: relaxedPriceFilter },
        ],
      },
      take: 8,
      include: { brand: true },
      orderBy: [{ rating: "desc" }, { stock: "desc" }],
    });
  }

  return products;
};

// ── Format danh sách sản phẩm thành context văn bản cho AI ───────────────────
const formatProductsContext = (products) => {
  if (!products || products.length === 0)
    return "Không tìm thấy sản phẩm nào phù hợp trong kho hàng hiện tại.";

  return products
    .map((p) => {
      const brandName = p.brand?.name || "Hãng khác";
      const priceStr =
        Math.round(Number(p.price)).toLocaleString("vi-VN") + "đ";
      const salePriceStr = p.salePrice
        ? Math.round(Number(p.salePrice)).toLocaleString("vi-VN") + "đ"
        : null;
      const finalPrice = salePriceStr
        ? `${salePriceStr} (Giá gốc: ${priceStr})`
        : priceStr;
      const stockStatus =
        p.stock > 0 ? `Còn hàng (${p.stock} sản phẩm)` : "Hết hàng";
      const categorySlug = CATEGORY_SLUG_MAP[p.category] || "phone";
      const productLink = `/${categorySlug}/${p.slug}`;
      const desc = p.description
        ? p.description.substring(0, 100) + "..."
        : "Không có mô tả.";
      return `- [${p.name}](${productLink}) | Hãng: ${brandName} | Giá: ${finalPrice} | Trạng thái: ${stockStatus} | Mô tả: ${desc}`;
    })
    .join("\n");
};

// ── System Instruction ────────────────────────────────────────────────────────
const buildSystemInstruction = () => `
Bạn là Trợ lý ảo AI thông minh và thân thiện của cửa hàng công nghệ NexTech.
Nhiệm vụ của bạn là tư vấn mua sắm sản phẩm và giải đáp chính sách bán hàng cho khách hàng.

QUY TẮC PHẢN HỒI:
1. TƯ VẤN SẢN PHẨM: Khi khách hỏi về sản phẩm, hãy gọi function searchProducts để tìm sản phẩm phù hợp trước, sau đó gợi ý 3–5 sản phẩm cụ thể kèm lý do tại sao phù hợp nhu cầu.
2. CUNG CẤP LINK SẢN PHẨM: Khi nhắc đến bất kỳ sản phẩm nào có trong danh sách được cung cấp, BẮT BUỘC phải chèn liên kết Markdown chính xác theo cấu trúc có sẵn. Ví dụ: [iPhone 15 Pro Max](/phone/iphone-15-pro-max).
3. KHÔNG TỰ CHẾ LINK: Tuyệt đối không tự tạo slug hay đường dẫn nếu sản phẩm đó không nằm trong kết quả tìm kiếm.
4. KHÔNG BỊA ĐẶT: Nếu khách hàng hỏi sản phẩm hoặc chính sách không có trong ngữ cảnh, hãy lịch sự nói shop chưa có thông tin và đề xuất liên hệ Hotline 1800 xxxx.
5. NGÔN NGỮ: Tiếng Việt tự nhiên, chuyên nghiệp, thân thiện.
6. FORMAT: Khi gợi ý nhiều sản phẩm, dùng danh sách bullet có icon ✅ hoặc 🔥 để dễ đọc. Nêu rõ giá và lý do phù hợp nhu cầu khách.

NGỮ CẢNH CHÍNH SÁCH NexTech:
${NEXTECH_POLICIES_CONTEXT}
`;

// ── Core: Gọi AI với Function Calling loop ─────────────────────────────────────
const callAiWithFunctionCalling = async (message, chatHistoryContext) => {
  const model = getGeminiModel(buildSystemInstruction(), SEARCH_TOOLS);

  // Bắt đầu chat session với lịch sử
  const chatSession = model.startChat({
    history: chatHistoryContext,
  });

  // Vòng lặp xử lý function calling
  let response = await chatSession.sendMessage(message);
  let maxIterations = 3; // Tránh vòng lặp vô tận

  while (maxIterations-- > 0) {
    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    // Kiểm tra xem AI có muốn gọi function không
    const functionCalls = candidate.content?.parts?.filter(
      (p) => p.functionCall
    );
    if (!functionCalls || functionCalls.length === 0) break;

    // Thực thi tất cả function calls
    const functionResponses = [];
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      console.log(`[AI Chat] Calling function: ${name}`, args);

      if (name === "searchProducts") {
        try {
          const products = await executeDbSearch(args);
          const productsText = formatProductsContext(products);
          console.log(`[AI Chat] Found ${products.length} products`);
          functionResponses.push({
            functionResponse: {
              name,
              response: { productsContext: productsText, count: products.length },
            },
          });
        } catch (err) {
          console.error("[AI Chat] DB search error:", err);
          functionResponses.push({
            functionResponse: {
              name,
              response: { productsContext: "Lỗi khi tìm kiếm sản phẩm.", count: 0 },
            },
          });
        }
      }
    }

    // Gửi kết quả function trở lại cho AI
    response = await chatSession.sendMessage(functionResponses);
  }

  return response.response.text().trim();
};

// ──────────────────────────────────────────────────────────────────────────────
// API Handlers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ai-chat/history
 * Lấy lịch sử chat (Đã đăng nhập) - Hỗ trợ phân trang cursor-based
 */
const getChatHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const cursor = req.query.cursor;

    const queryOptions = {
      where: { userId: req.user.id },
      take: limit,
      orderBy: { createdAt: "desc" },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const messages = await prisma.aIChatMessage.findMany(queryOptions);

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0].id : null,
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
      return res
        .status(400)
        .json({ success: false, message: "Tin nhắn không được trống." });
    }

    const userId = req.user.id;

    // 1. Lưu tin nhắn của User vào DB
    await prisma.aIChatMessage.create({
      data: { userId, role: "user", content: message },
    });

    // 2. Kéo 10 tin nhắn lịch sử gần nhất làm ngữ cảnh
    const recentHistory = await prisma.aIChatMessage.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const chatHistoryContext = recentHistory
      .reverse()
      .slice(0, -1) // Bỏ tin nhắn vừa gửi vì sẽ gửi trực tiếp
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // 3. Gọi AI với Function Calling
    const aiResponseText = await callAiWithFunctionCalling(
      message,
      chatHistoryContext
    );

    // 4. Lưu phản hồi AI vào DB
    const aiMessage = await prisma.aIChatMessage.create({
      data: { userId, role: "model", content: aiResponseText },
    });

    res.status(200).json({ success: true, data: aiMessage });
  } catch (err) {
    console.error("[AI Chat LoggedIn Error]", err);
    next(err);
  }
};

/**
 * POST /api/ai-chat/send-guest
 * Gửi tin nhắn và phản hồi từ AI (Khách vãng lai)
 * Không lưu DB, nhận lịch sử hội thoại từ localStorage của Frontend.
 */
const sendGuestChatMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Tin nhắn không được trống." });
    }

    // Định dạng lại mảng lịch sử nhận từ frontend
    const chatHistoryContext = (history || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Gọi AI với Function Calling
    const aiResponseText = await callAiWithFunctionCalling(
      message,
      chatHistoryContext
    );

    res.status(200).json({
      success: true,
      data: {
        role: "model",
        content: aiResponseText,
        createdAt: new Date(),
      },
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
    await prisma.aIChatMessage.deleteMany({ where: { userId } });
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
