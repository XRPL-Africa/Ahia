"use client";

import { useState, useEffect } from "react";
import { User, DisputeHistory } from "@/types/admin";
import adminService from "@/services/admin.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader } from "lucide-react";

interface DisputeHistoryViewProps {
  user: User;
  onClose: () => void;
}

export default function DisputeHistoryView({
  user,
  onClose,
}: DisputeHistoryViewProps) {
  const [history, setHistory] = useState<DisputeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await adminService.getUserDisputeHistory(user.id);
        setHistory(data);
      } catch (err) {
        setError("Failed to load dispute history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-ahia-success/10 text-ahia-success";
      case "in_review":
        return "bg-amber-100 text-amber-700";
      case "open":
        return "bg-blue-100 text-blue-700";
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
          <DialogTitle className="font-fredoka text-lg">Dispute History</DialogTitle>
          <DialogDescription>
            {user.name} • Total Disputes: {history?.dispute_count || 0}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader size={20} className="animate-spin mr-2" />
              Loading disputes...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-ahia-red bg-ahia-red/10 border border-ahia-red/20 rounded-xl px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          ) : !history || history.disputes.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              No disputes found
            </div>
          ) : (
            history.disputes.map((dispute, idx) => (
              <div
                key={dispute.id}
                className="border border-gray-200 rounded-xl p-4 space-y-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      vs. {dispute.opponent}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {dispute.reason}
                    </div>
                  </div>
                  <Badge className={getStatusColor(dispute.status)}>
                    {dispute.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(dispute.date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
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
