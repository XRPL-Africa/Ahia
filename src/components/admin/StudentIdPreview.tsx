"use client";

import { useState } from "react";
import { User } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface StudentIdPreviewProps {
  user: User;
  onClose: () => void;
  onVerify: (userId: string) => Promise<void>;
}

export default function StudentIdPreview({
  user,
  onClose,
  onVerify,
}: StudentIdPreviewProps) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      await onVerify(user.id);
      onClose();
    } catch (err) {
      setError("Failed to verify student ID");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">Student ID Verification</DialogTitle>
          <DialogDescription>
            {user.name} • ID: {user.student_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="text-xs text-gray-500 font-medium">Name</div>
              <div className="font-medium text-foreground">{user.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Student ID</div>
              <div className="font-medium text-foreground">{user.student_id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Campus</div>
              <div className="font-medium text-foreground">{user.campus}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Status</div>
              <div className="font-medium">
                {user.student_id_verified ? (
                  <span className="flex items-center gap-1 text-ahia-success">
                    <CheckCircle size={14} />
                    Verified
                  </span>
                ) : (
                  <span className="text-amber-600">Pending</span>
                )}
              </div>
            </div>
          </div>

          {/* ID Image */}
          {user.student_id_image_url ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Submitted ID Image</div>
              <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={user.student_id_image_url}
                  alt="Student ID"
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              No ID image submitted yet
            </div>
          )}

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
            disabled={verifying}
          >
            Close
          </Button>
          {!user.student_id_verified && (
            <Button
              onClick={handleVerify}
              disabled={verifying || !user.student_id_image_url}
              className="rounded-lg bg-ahia-success hover:opacity-90 text-white"
            >
              {verifying ? "Verifying..." : "Approve Verification"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
