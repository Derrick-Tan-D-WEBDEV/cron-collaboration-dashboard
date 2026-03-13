import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead: (_id: string) => {},
    markAllAsRead: () => {},
    clearAll: () => {},
  };
}
