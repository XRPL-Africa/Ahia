"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatListScreen, type Chat, type ChatParticipant } from "@/components/chat/ChatScreen";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function ChatListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { track } = useAnalytics("ChatList");

  if (!user) return null;

  const handleSelectChat = (chat: Chat, recipient: ChatParticipant) => {
    track("chat_opened", { chatId: chat.id, context: chat.listingId ? "listing" : "direct" });
    router.push(`/user/chat/${chat.id}?recipientId=${recipient.id}`);
  };

  return (
    <ChatListScreen
      currentUserId={user.id}
      onSelectChat={handleSelectChat}
      onBack={() => router.back()}
    />
  );
}
