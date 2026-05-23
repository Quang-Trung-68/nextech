const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChat.controller");
const { protect } = require("../middleware/auth");

// GET /api/ai-chat/history — Lấy lịch sử chat (Cần đăng nhập)
router.get("/history", protect, aiChatController.getChatHistory);

// DELETE /api/ai-chat/history — Xóa toàn bộ lịch sử chat (Cần đăng nhập)
router.delete("/history", protect, aiChatController.deleteChatHistory);

// POST /api/ai-chat/send — Gửi tin nhắn và phản hồi từ AI (Cần đăng nhập)
router.post("/send", protect, aiChatController.sendChatMessage);

// POST /api/ai-chat/send-guest — Gửi tin nhắn khách vãng lai (Public - lưu localStorage)
router.post("/send-guest", aiChatController.sendGuestChatMessage);

module.exports = router;
