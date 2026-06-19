"use client";

import { Dispute } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface DisputeDetailViewProps {
  dispute: Dispute;
  onClose: () => void;
}

export default function DisputeDetailView({
  dispute,
  onClose,
}: DisputeDetailViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700";
      case "in_review":
        return "bg-amber-100 text-amber-700";
      case "resolved":
        return "bg-ahia-success/10 text-ahia-success";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">Dispute Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="text-xs text-gray-500 font-medium">Dispute ID</div>
              <div className="font-mono text-sm text-foreground">{dispute.id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Status</div>
              <Badge className={getStatusColor(dispute.status)}>
                {dispute.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Created</div>
              <div className="text-sm text-foreground">
                {new Date(dispute.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Last Updated</div>
              <div className="text-sm text-foreground">
                {new Date(dispute.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Parties</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-500">Buyer</div>
                <div className="font-medium text-foreground">{dispute.buyer_id}</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-500">Seller</div>
                <div className="font-medium text-foreground">{dispute.seller_id}</div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Reason</div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-foreground">
              {dispute.reason}
            </div>
          </div>

          {/* Evidence */}
          {dispute.evidence_urls.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Evidence</div>
              <div className="space-y-2">
                {dispute.evidence_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-blue-600"
                  >
                    <Download size={14} />
                    Evidence {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-lg border-gray-200"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
