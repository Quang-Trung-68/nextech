import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/lib/axios";
import pusher from "@/lib/pusher";
import { showNotificationToast } from "@/components/ui/NotificationToast";

const getActionUrl = (notification) => {
  const { type, data } = notification;
  switch (type) {
    case "order_status_changed":
    case "payment_result":
      return `/orders/${data?.orderId}`;
    case "new_order":
      return `/admin/orders?orderId=${data?.orderId}`;
    case "low_stock":
      return `/admin/products?productId=${data?.productId}`;
    default:
      return "/notifications";
  }
};

export function useNotifications(user) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await axios.get("/notifications/unread-count");
      return res.data.count;
    },
    enabled: !!user,
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
      await axios.patch(`/notifications/${id}/read`);
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
      await axios.patch("/notifications/read-all");
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

  // 4. Subscription
  useEffect(() => {
    if (!user) return;

    const channelName = `private-user.${user.id}`;
    const userChannel = pusher.subscribe(channelName);

    const handleNewNotification = (notification) => {
      // Invalidate count
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });

      // Prepend to list cache
      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            notifications: [notification, ...newPages[0].notifications],
          };
        }
        return { ...oldData, pages: newPages };
      });

      // Show enhanced toast with progress bar + click to navigate
      const url = getActionUrl(notification);
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
  }, [user, queryClient, navigate, markOneAsReadMutation]);

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
