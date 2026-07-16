"use client";

import { useState } from "react";
import { Dispute } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface DisputeDecisionFormProps {
  dispute: Dispute;
  onClose: () => void;
  onDecisionMade: () => Promise<void>;
}

export default function DisputeDecisionForm({
  dispute,
  onClose,
  onDecisionMade,
}: DisputeDecisionFormProps) {
  const [decision, setDecision] = useState<"buyer" | "seller" | "refund" | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!decision) {
      setError("Please select a decision");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock API call - replace with actual call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onDecisionMade();
      onClose();
    } catch (err) {
      setError("Failed to submit decision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">Make Decision</DialogTitle>
          <DialogDescription>
            Resolve dispute {dispute.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Decision Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Release escrow to:</div>
            <RadioGroup value={decision} onValueChange={(value: "buyer" | "seller" | "refund") => setDecision(value)}>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="buyer" id="buyer" />
                <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Buyer</div>
                  <div className="text-xs text-gray-500">Release full payment to buyer</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="seller" id="seller" />
                <Label htmlFor="seller" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Seller</div>
                  <div className="text-xs text-gray-500">Release full payment to seller</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="refund" id="refund" />
                <Label htmlFor="refund" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Refund</div>
                  <div className="text-xs text-gray-500">Refund full amount to buyer</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Decision Notes</label>
            <Input
              placeholder="Explain your decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl border-gray-200 resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-400 text-right">
              {notes.length}/500
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-ahia-red bg-ahia-red/10 border border-ahia-red/20 rounded-xl px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>This action will close the dispute and release escrow funds.</div>
          </div>
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
            onClick={handleSubmit}
            disabled={loading || !decision}
            className="rounded-lg bg-ahia-sunset hover:opacity-90 text-white"
          >
            {loading ? "Submitting..." : "Submit Decision"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
