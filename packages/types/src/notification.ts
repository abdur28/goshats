import { Timestamp } from "firebase/firestore";

export type NotificationType =
  | "order_update"
  | "chat_message"
  | "promo"
  | "referral_reward"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;

  title: string;
  body: string;

  type: NotificationType;

  data: {
    orderId?: string;
    screen?: string;
  };

  isRead: boolean;
  createdAt: Timestamp;
}
