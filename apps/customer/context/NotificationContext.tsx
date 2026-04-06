import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  requestNotificationPermission,
  saveFcmToken,
  listenToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  setupNotificationHandler,
  addNotificationResponseListener,
} from "@goshats/firebase";
import type { AppNotification } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";
import { handleNotificationResponse } from "@/lib/notifications";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    (async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          await saveFcmToken(user.uid, token, "users");
        }
      } catch {
        // Push notifications unavailable (e.g. Expo Go on iOS)
      }
    })();

    const unsubscribe = listenToNotifications(
      "users",
      user.uid,
      setNotifications
    );

    const subscription = addNotificationResponseListener(
      handleNotificationResponse
    );

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [isAuthenticated, user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    if (!user) return;
    await markNotificationRead("users", user.uid, id);
  };

  const markAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead("users", user.uid);
  };

  const removeNotification = async (id: string) => {
    if (!user) return;
    await deleteNotification("users", user.uid, id);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}
