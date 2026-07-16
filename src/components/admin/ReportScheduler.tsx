"use client";

import { useState } from "react";
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

interface ReportSchedulerProps {
  onClose: () => void;
  onSchedule: () => void;
}

export default function ReportScheduler({
  onClose,
  onSchedule,
}: ReportSchedulerProps) {
  const [reportType, setReportType] = useState("transaction");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recipients, setRecipients] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = async () => {
    if (!recipients.trim()) {
      setError("Please add at least one recipient email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSchedule();
      onClose();
    } catch (err) {
      setError("Failed to schedule report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">Schedule Report</DialogTitle>
          <DialogDescription>
            Set up automated report generation and delivery
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Report Type</Label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="transaction">Transaction Report</option>
              <option value="verification">Verification Report</option>
              <option value="dispute">Dispute Report</option>
              <option value="revenue">Revenue Report</option>
            </select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Frequency</Label>
            <RadioGroup value={frequency} onValueChange={(v: "daily" | "weekly" | "monthly") => setFrequency(v)}>
              <div className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="cursor-pointer">
                  <div className="font-medium text-foreground">Daily</div>
                  <div className="text-xs text-gray-500">Every day at 6:00 AM</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">
                  <div className="font-medium text-foreground">Weekly</div>
                  <div className="text-xs text-gray-500">Every Monday at 6:00 AM</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  <div className="font-medium text-foreground">Monthly</div>
                  <div className="text-xs text-gray-500">First day of month at 6:00 AM</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Email Recipients
            </Label>
            <Input
              placeholder="admin@ahiamarket.app, finance@ahiamarket.app"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="rounded-lg border-gray-200 text-sm"
            />
            <div className="text-xs text-gray-500">
              Separate multiple emails with commas
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-ahia-red bg-ahia-red/10 border border-ahia-red/20 rounded-lg px-3 py-2">
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
            onClick={handleSchedule}
            disabled={loading || !recipients.trim()}
            className="rounded-lg bg-ahia-sunset hover:opacity-90 text-white"
          >
            {loading ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
