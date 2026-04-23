"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { EscrowListScreen } from "@/components/escrow/EscrowStatus";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { track } = useAnalytics("Orders");

  if (!user) return null;

  return (
    <EscrowListScreen
      currentUserId={user.id}
      onSelectTransaction={(txId) => {
        track("listing_viewed", { transactionId: txId, screen: "Orders" });
        router.push(`/user/orders/${txId}`);
      }}
      onBack={() => router.back()}
    />
  );
}
