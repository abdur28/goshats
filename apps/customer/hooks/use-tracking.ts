import { useState, useEffect, useCallback } from "react";
import {
  listenToTracking,
  listenToChat,
  sendMessage,
  markMessagesRead,
} from "@goshats/firebase";
import type { TrackingPoint, ChatMessage } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";

export function useTracking(orderId: string | null) {
  const user = useAuthStore((s) => s.user);
  const [latestPosition, setLatestPosition] = useState<TrackingPoint | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubTracking = listenToTracking(orderId, (point) => {
      setLatestPosition(point);
      setIsLoading(false);
    });

    const unsubChat = listenToChat(orderId, (msgs) => {
      setMessages(msgs);
      if (user) {
        markMessagesRead(orderId, user.uid).catch(() => {});
      }
    });

    return () => {
      unsubTracking();
      unsubChat();
    };
  }, [orderId, user]);

  const send = useCallback(
    async (text: string) => {
      if (!orderId || !user) return;
      await sendMessage(orderId, {
        senderId: user.uid,
        senderRole: "customer",
        text,
      });
    },
    [orderId, user]
  );

  return { latestPosition, messages, sendMessage: send, isLoading };
}
