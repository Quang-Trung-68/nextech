import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Send, X, Bot, Trash2, ArrowDown, Sparkles } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

export default function AIChatWindow({ isOpen, onClose }) {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const chatEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  // 1. Tải lịch sử chat ban đầu
  useEffect(() => {
    if (!isOpen) return;

    if (isLoggedIn) {
      // Tải từ Database nếu đã đăng nhập
      const fetchHistory = async () => {
        try {
          const { data } = await axiosInstance.get("/ai-chat/history?limit=15");
          if (data.success) {
            // Nếu chưa có lịch sử, hiển thị tin nhắn chào mừng (chỉ ở frontend, không lưu DB)
            if (data.data.length === 0) {
              const userName = user?.name?.split(" ").slice(-1)[0] || "bạn";
              setMessages([
                {
                  id: "welcome",
                  role: "model",
                  content: `Xin chào ${userName}! 👋 Tôi là Trợ lý ảo AI của NexTech. Tôi có thể giúp gì cho bạn hôm nay? (Bạn có thể hỏi về điện thoại, laptop hoặc chính sách của shop nhé! 🤖)`,
                  createdAt: new Date(),
                },
              ]);
            } else {
              setMessages(data.data);
              setNextCursor(data.nextCursor);
              setTimeout(scrollToBottom, 50);
            }
          }
        } catch (err) {
          console.error("[AI Chat History Error]", err);
          toast.error("Không thể tải lịch sử trò chuyện.");
        }
      };
      fetchHistory();
    } else {
      // Tải từ localStorage đối với khách vãng lai
      const localHistory = localStorage.getItem("nextech_guest_ai_chat");
      if (localHistory) {
        try {
          setMessages(JSON.parse(localHistory));
          setTimeout(scrollToBottom, 50);
        } catch (e) {
          console.error(e);
          setMessages([]);
        }
      } else {
        // Tin nhắn chào mừng mặc định nếu chưa có lịch sử
        const welcomeMessage = {
          id: "welcome",
          role: "model",
          content: "Xin chào! Tôi là Trợ lý ảo AI của NexTech. Tôi có thể giúp gì cho bạn hôm nay? (Bạn có thể hỏi về điện thoại, laptop hoặc chính sách của shop nhé! 🤖)",
          createdAt: new Date(),
        };
        setMessages([welcomeMessage]);
        localStorage.setItem("nextech_guest_ai_chat", JSON.stringify([welcomeMessage]));
      }
      setNextCursor(null);
    }
  }, [isOpen, isLoggedIn]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cuộn xuống mỗi khi có tin nhắn mới hoặc đang gõ AI phản hồi
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      scrollToBottom();
    }
  }, [messages, isLoadingMore]);

  // 2. Tải thêm tin nhắn cũ (phân trang khi kéo lên trên)
  const handleLoadMore = async () => {
    if (!isLoggedIn || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    const prevScrollHeight = messageContainerRef.current?.scrollHeight || 0;

    try {
      const { data } = await axiosInstance.get(`/ai-chat/history?limit=15&cursor=${nextCursor}`);
      if (data.success) {
        setMessages((prev) => [...data.data, ...prev]);
        setNextCursor(data.nextCursor);
        
        // Giữ nguyên vị trí cuộn của người dùng sau khi chèn thêm tin nhắn cũ
        setTimeout(() => {
          if (messageContainerRef.current) {
            const newScrollHeight = messageContainerRef.current.scrollHeight;
            messageContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
        }, 30);
      }
    } catch (err) {
      console.error("[AI Chat Load More Error]", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 3. Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText("");
    setIsLoading(true);

    const newUserMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    // Append tin nhắn người dùng nhập ngay lập tức
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      if (isLoggedIn) {
        // Gửi tới API của thành viên đăng nhập
        const { data } = await axiosInstance.post("/ai-chat/send", { message: text });
        if (data.success) {
          // Thay thế tin nhắn AI giả định bằng tin nhắn DB trả về để đồng bộ ID
          setMessages((prev) => {
            const filtered = prev.filter(m => m.id !== newUserMessage.id);
            return [...filtered, data.data]; // Trả về tin nhắn đã lưu gồm cả câu trả lời của model
          });
          
          // Lấy tin nhắn phản hồi của model
          const aiResponse = {
            id: "model-" + Date.now(),
            role: "model",
            content: data.data.content, // Trong backend ta trả về aiMessage (role: model)
            createdAt: new Date(),
          };
          
          // Refetch hoặc sync lại lịch sử
          const { data: histData } = await axiosInstance.get("/ai-chat/history?limit=15");
          if (histData.success) {
            setMessages(histData.data);
            setNextCursor(histData.nextCursor);
          }
        }
      } else {
        // Gửi tới API của khách vãng lai kèm theo history hiện có
        const guestHistory = messages.map(m => ({ role: m.role, content: m.content }));
        
        const { data } = await axiosInstance.post("/ai-chat/send-guest", {
          message: text,
          history: guestHistory
        });

        if (data.success) {
          const aiMessage = data.data;
          const updatedHistory = [...messages, newUserMessage, aiMessage];
          setMessages(updatedHistory);
          localStorage.setItem("nextech_guest_ai_chat", JSON.stringify(updatedHistory));
        }
      }
    } catch (err) {
      console.error("[Send AI Message Error]", err);
      toast.error("Không thể kết nối tới Trợ lý ảo. Vui lòng thử lại!");
      setMessages((prev) => prev.filter((m) => m.id !== newUserMessage.id)); // Rollback tin nhắn lỗi
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Xóa lịch sử chat
  const handleClearHistory = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với AI?")) return;

    const resetMessage = {
      id: "welcome",
      role: "model",
      content: "Lịch sử trò chuyện đã được làm sạch. Bạn cần tôi giúp tìm kiếm sản phẩm gì mới không? 🤖",
      createdAt: new Date(),
    };

    if (isLoggedIn) {
      try {
        // Gọi API xóa thật trong DB
        await axiosInstance.delete("/ai-chat/history");
        setMessages([resetMessage]);
        setNextCursor(null);
        toast.success("Đã xóa lịch sử trò chuyện.");
      } catch (err) {
        console.error("[AI Chat Delete Error]", err);
        toast.error("Không thể xóa lịch sử. Vui lòng thử lại.");
      }
    } else {
      localStorage.removeItem("nextech_guest_ai_chat");
      setMessages([resetMessage]);
      toast.success("Đã xóa lịch sử trò chuyện.");
    }
  };

  // 5. Hàm phân tích liên kết Markdown [text](url) -> React Router Link
  const parseMarkdownLinks = (text) => {
    if (!text) return null;
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(textBefore);
      }

      const linkText = match[1];
      const linkUrl = match[2];

      if (linkUrl.startsWith("/")) {
        parts.push(
          <Link
            key={match.index}
            to={linkUrl}
            onClick={onClose} // Đóng khung chat khi bấm chuyển trang sản phẩm để nâng cao trải nghiệm
            className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-bold underline transition-colors"
          >
            {linkText}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-bold underline transition-colors"
          >
            {linkText}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    const textAfter = text.substring(lastIndex);
    if (textAfter) {
      parts.push(textAfter);
    }

    return parts.length > 0 ? parts : text;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-[88px] right-5 z-[100] w-[calc(100%-2.5rem)] sm:w-[380px] h-[520px] rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 pointer-events-auto"
      role="dialog"
      aria-label="AI Chatbot Assistant"
    >
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Sparkles size={20} className="text-purple-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-sans tracking-tight">Trợ Lý Ảo NexTech</h3>
            <p className="text-[10px] text-purple-200 font-medium">Hỗ trợ 24/7 • Sử dụng Gemini AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-purple-100 hover:text-white"
              title="Xóa lịch sử chat"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-purple-100 hover:text-white"
            title="Đóng cửa sổ"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50"
      >
        {/* Nút tải thêm lịch sử nếu có cursor */}
        {isLoggedIn && nextCursor && (
          <div className="flex justify-center pb-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3 py-1 transition-all disabled:opacity-50"
            >
              <ArrowDown size={12} className="rotate-180" />
              {isLoadingMore ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
            </button>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
            >
              {!isUser && (
                <div className="h-7 w-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-indigo-600" />
                </div>
              )}
              
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm font-sans ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                }`}
              >
                <p className="whitespace-pre-line">{parseMarkdownLinks(msg.content)}</p>
                <span
                  className={`block text-[9px] mt-1.5 text-right opacity-60 ${
                    isUser ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Typing effect */}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="h-7 w-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
              <Bot size={15} className="text-indigo-600" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce duration-300" style={{ animationDelay: "0ms" }}></span>
              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce duration-300" style={{ animationDelay: "150ms" }}></span>
              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce duration-300" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT SUBMISSION */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Chào mừng bạn...."
          disabled={isLoading}
          className="flex-1 min-h-[40px] px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-sans bg-gray-50/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center transition-colors active:scale-[0.96]"
          title="Gửi câu hỏi"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
