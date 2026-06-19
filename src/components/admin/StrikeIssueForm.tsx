"use client";

import { useState } from "react";
import { User } from "@/types/admin";
import adminService from "@/services/admin.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

interface StrikeIssueFormProps {
  user: User;
  onClose: () => void;
  onStrikeIssued: () => Promise<void>;
}

export default function StrikeIssueForm({
  user,
  onClose,
  onStrikeIssued,
}: StrikeIssueFormProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strikesRemaining = 4 - user.strikes;
  const willBeBanned = strikesRemaining === 1;

  const handleIssueStrike = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for the strike");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminService.issueStrike(user.id, reason);
      await onStrikeIssued();
      onClose();
    } catch (err) {
      setError("Failed to issue strike");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">Issue Strike</DialogTitle>
          <DialogDescription>
            Add a strike to <strong>{user.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Strikes */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">Current Strikes:</span>
              <span className="font-semibold text-ahia-trust">
                {user.strikes}/4
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-colors ${
                  user.strikes >= 4
                    ? "bg-ahia-red"
                    : user.strikes >= 3
                    ? "bg-orange-500"
                    : user.strikes >= 2
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${(user.strikes / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Warning */}
          {willBeBanned && (
            <div className="flex gap-2 bg-ahia-red/10 border border-ahia-red/20 rounded-xl p-3 text-sm text-ahia-red">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> This strike will result in a ban. User will be
                unable to use the platform.
              </div>
            </div>
          )}

          {/* Strike Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Reason</label>
            <Input
              placeholder="e.g., Inappropriate behavior, failed to complete transaction..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl border-gray-200 resize-none"
              maxLength={200}
            />
            <div className="text-xs text-gray-400 text-right">{reason.length}/200</div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-ahia-red bg-ahia-red/10 border border-ahia-red/20 rounded-xl px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-lg border-gray-200"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleIssueStrike}
            disabled={loading || !reason.trim()}
            className="rounded-lg bg-ahia-sunset hover:opacity-90 text-white"
          >
            {loading ? "Issuing..." : "Issue Strike"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
