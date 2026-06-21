import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/lib/axios";
import pusher from "@/lib/pusher";
import { showNotificationToast } from "@/components/ui/NotificationToast";
import { getNotificationActionUrl } from "@/configs/adminPaths";

const ADMIN_NOTIFICATIONS_STORAGE_KEY = "admin_notifications";
const MAX_STORED_NOTIFICATIONS = 50;

/** Lưu notifications vào localStorage */
function saveNotificationsToStorage(notifications) {
  try {
    const toStore = notifications.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    // localStorage đầy hoặc bị lỗi — bỏ qua
  }
}

/** Đọc notifications từ localStorage */
function loadNotificationsFromStorage() {
  try {
    const raw = localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useNotifications(user) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Seed localStorage vào React Query cache khi mới mount
  // (Admin notifications không lưu DB nên cần load từ localStorage)
  useEffect(() => {
    if (!user) return;
    const stored = loadNotificationsFromStorage();
    if (stored.length > 0) {
      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        // Chỉ seed nếu chưa có data
        if (oldData && oldData.pages?.length > 0 && oldData.pages[0].notifications?.length > 0) {
          return oldData;
        }
        return {
          pages: [{ notifications: stored, nextCursor: null }],
          pageParams: [null],
        };
      });
      // Cập nhật unread count từ localStorage
      const unread = stored.filter((n) => !n.isRead).length;
      queryClient.setQueryData(["notifications", "unread-count"], (old) => {
        if (old && old > 0) return old;
        return unread;
      });
    }
  }, [user, queryClient]);

  // 1. Fetch unread count — Admin notifications không lưu DB nên dùng localStorage + setQueryData,
  //    không refetch từ API (luôn trả 0 vì Admin model không có relation với Notification).
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => 0,
    enabled: !!user,
    staleTime: Infinity,
    initialData: () => {
      const stored = loadNotificationsFromStorage();
      return stored.filter((n) => !n.isRead).length;
    },
  });

  // 2. Fetch notifications (infinite)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["notifications", "list"],
      queryFn: async ({ pageParam = null }) => {
        const params = { limit: 10 };
        if (pageParam) params.cursor = pageParam;
        const res = await axios.get("/notifications", { params });
        return res.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
      enabled: !!user,
    });

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];

  // 3. Mutations
  const markOneAsReadMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await axios.patch(`/notifications/${id}/read`);
      } catch {
        // Admin notifications không lưu DB — bỏ qua lỗi
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousCount = queryClient.getQueryData([
        "notifications",
        "unread-count",
      ]);
      queryClient.setQueryData(["notifications", "unread-count"], (old) =>
        Math.max(0, old - 1),
      );

      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          })),
        };
      });

      // Cập nhật localStorage
      const stored = loadNotificationsFromStorage();
      const updated = stored.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveNotificationsToStorage(updated);

      return { previousCount };
    },
    onError: (err, id, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          context.previousCount,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await axios.patch("/notifications/read-all");
      } catch {
        // Admin notifications không lưu DB — bỏ qua lỗi
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousCount = queryClient.getQueryData([
        "notifications",
        "unread-count",
      ]);
      queryClient.setQueryData(["notifications", "unread-count"], 0);

      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) => ({
              ...n,
              isRead: true,
            })),
          })),
        };
      });

      // Cập nhật localStorage
      const stored = loadNotificationsFromStorage();
      const updated = stored.map((n) => ({ ...n, isRead: true }));
      saveNotificationsToStorage(updated);

      return { previousCount };
    },
    onError: (err, _, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          context.previousCount,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  // Helper: thêm notification vào cache + localStorage
  const prependNotification = useCallback((notification) => {
    // Increment count (không invalidate — admin notifications không lưu DB)
    queryClient.setQueryData(["notifications", "unread-count"], (old) => (old || 0) + 1);

    // Prepend to list cache
    queryClient.setQueryData(["notifications", "list"], (oldData) => {
      if (!oldData) return oldData;
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        // Tránh duplicate
        const exists = newPages[0].notifications.some((n) => n.id === notification.id);
        if (!exists) {
          newPages[0] = {
            ...newPages[0],
            notifications: [notification, ...newPages[0].notifications],
          };
        }
      } else {
        // Chưa có data — tạo page mới
        newPages.push({
          notifications: [notification],
          nextCursor: null,
        });
      }
      return { ...oldData, pages: newPages };
    });

    // Lưu vào localStorage
    const stored = loadNotificationsFromStorage();
    const exists = stored.some((n) => n.id === notification.id);
    if (!exists) {
      const updated = [notification, ...stored].slice(0, MAX_STORED_NOTIFICATIONS);
      saveNotificationsToStorage(updated);
    }
  }, [queryClient]);

  // 4. Subscription — Pusher real-time
  useEffect(() => {
    if (!user) return;

    const channelName = `private-user.${user.id}`;
    const userChannel = pusher.subscribe(channelName);

    const handleNewNotification = (notification) => {
      prependNotification(notification);

      const url = getNotificationActionUrl(notification);
      showNotificationToast(notification, url, (dest) => {
        if (!notification.isRead) markOneAsReadMutation.mutate(notification.id);
        navigate(dest);
      });

      if (notification.type === "new_order" && user?.role === "ADMIN") {
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        const oid = notification.data?.orderId;
        if (oid) {
          window.dispatchEvent(
            new CustomEvent("admin:new-order", { detail: { orderId: oid } }),
          );
        }
      }
    };

    userChannel.bind("notification.new", handleNewNotification);

    let adminChannel = null;
    if (user.role === "ADMIN") {
      adminChannel = pusher.subscribe("private-admin");
      adminChannel.bind("notification.new", handleNewNotification);
    }

    return () => {
      userChannel.unbind("notification.new", handleNewNotification);
      pusher.unsubscribe(channelName);
      if (adminChannel) {
        adminChannel.unbind("notification.new", handleNewNotification);
        pusher.unsubscribe("private-admin");
      }
    };
  }, [user, queryClient, navigate, markOneAsReadMutation, prependNotification]);

  return {
    unreadCount,
    notifications,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    markOneAsRead: markOneAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
