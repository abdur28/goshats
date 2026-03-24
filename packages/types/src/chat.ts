import { Timestamp } from "firebase/firestore";

export type SenderRole = "customer" | "rider";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  text: string;
  isRead: boolean;
  createdAt: Timestamp;
}
