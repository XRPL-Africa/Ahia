"use client";
// src/app/user/orders/[transactionId]/page.tsx
// Ahia — Escrow Detail View

import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { EscrowStatus } from "@/components/escrow/EscrowStatus";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <EscrowStatus
      transactionId={params.transactionId as string}
      onBack={() => router.push("/user/orders")}
      onChat={(chatId, recipientId) =>
        router.push(`/user/chat/${chatId}?recipientId=${recipientId}`)
      }
      onViewListing={(listingId) => router.push(`/marketplace/${listingId}`)}
    />
  );
}
