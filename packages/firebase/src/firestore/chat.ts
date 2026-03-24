import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { ChatMessage, SenderRole } from "@goshats/types";

function chatRef(orderId: string) {
  return collection(db, "orders", orderId, "chat");
}

export function listenToChat(
  orderId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(chatRef(orderId), orderBy("createdAt", "asc"));

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ChatMessage
    );
    callback(messages);
  });
}

export async function sendMessage(
  orderId: string,
  data: {
    senderId: string;
    senderRole: SenderRole;
    text: string;
  }
): Promise<string> {
  const ref = await addDoc(chatRef(orderId), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markMessagesRead(
  orderId: string,
  readerId: string
): Promise<void> {
  const q = query(
    chatRef(orderId),
    where("isRead", "==", false),
    where("senderId", "!=", readerId)
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  for (const d of snap.docs) {
    batch.update(d.ref, { isRead: true });
  }
  await batch.commit();
}
