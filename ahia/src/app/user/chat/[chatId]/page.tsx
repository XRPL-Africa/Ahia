"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatScreen, type ChatParticipant } from "@/components/chat/ChatScreen";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { track } = useAnalytics("Chat");

  if (!user) return null;

  const chatId = params.chatId as string;
  const recipientId = searchParams.get("recipientId") ?? "";

  const recipient: ChatParticipant = {
    id: recipientId,
    displayName: "Seller",
    campus: user.campus,
    isOnline: false,
  };

  return (
    <ChatScreen
      chatId={chatId}
      currentUserId={user.id}
      recipient={recipient}
      listingId={searchParams.get("listingId") ?? undefined}
      onBack={() => router.push("/user/chat")}
      onViewListing={(id) => {
        track("listing_viewed", { listingId: id, source: "chat" });
        router.push(`/marketplace/${id}`);
      }}
      onViewEscrow={(txId) => {
        track("escrow_initiated", { transactionId: txId, source: "chat" });
        router.push(`/user/orders/${txId}`);
      }}
    />
  );
}
