"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";

interface Report {
  id: string;
  name: string;
  type: "transaction" | "verification" | "dispute" | "revenue";
  description: string;
  generatedAt: string;
  fileSize: string;
  status: "ready" | "generating" | "failed";
}

interface ReportPreviewProps {
  report: Report;
  onClose: () => void;
}

export default function ReportPreview({ report, onClose }: ReportPreviewProps) {
  // Mock preview data based on report type
  const getPreviewData = () => {
    switch (report.type) {
      case "transaction":
        return {
          title: "Transaction Report",
          columns: ["Transaction ID", "Amount", "Buyer", "Seller", "Status", "Date"],
          rows: [
            ["TXN-001", "₦5,000", "John Doe", "Jane Smith", "Completed", "2024-02-01"],
            ["TXN-002", "₦12,000", "Mary Johnson", "Tom Brown", "Pending", "2024-02-01"],
            ["TXN-003", "₦8,500", "Ahmed Hassan", "Lisa Wang", "Completed", "2024-02-02"],
          ],
        };
      case "verification":
        return {
          title: "Verification Report",
          columns: ["User ID", "Name", "Student ID", "Campus", "Status", "Date"],
          rows: [
            ["USR-001", "John Doe", "UNIBEN001", "UNIBEN", "Verified", "2024-02-01"],
            ["USR-002", "Jane Smith", "UNILAG002", "UNILAG", "Pending", "2024-02-01"],
            ["USR-003", "Tom Brown", "OAU003", "OAU", "Verified", "2024-02-02"],
          ],
        };
      case "dispute":
        return {
          title: "Dispute Resolution Report",
          columns: ["Dispute ID", "Reason", "Status", "Decision", "Resolved Date"],
          rows: [
            ["DSP-001", "Item Not Received", "Resolved", "Refund", "2024-02-01"],
            ["DSP-002", "Damaged Item", "In Review", "Pending", "-"],
            ["DSP-003", "Wrong Item", "Resolved", "Replacement", "2024-02-02"],
          ],
        };
      case "revenue":
        return {
          title: "Revenue Report",
          columns: ["Campus", "Transactions", "Total Amount", "Platform Fee", "Payout"],
          rows: [
            ["UNIBEN", "245", "₦1,225,000", "₦122,500", "₦1,102,500"],
            ["UNILAG", "523", "₦2,615,000", "₦261,500", "₦2,353,500"],
            ["OAU", "189", "₦945,000", "₦94,500", "₦850,500"],
          ],
        };
      default:
        return {
          title: "Report",
          columns: [],
          rows: [],
        };
    }
  };

  const preview = getPreviewData();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-4xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">{report.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Info */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-1">Generated</div>
              <div className="font-medium text-foreground">
                {new Date(report.generatedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">File Size</div>
              <div className="font-medium text-foreground">{report.fileSize}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Status</div>
              <Badge className="bg-ahia-success/10 text-ahia-success w-fit">
                {report.status}
              </Badge>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {preview.columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, ridx) => (
                  <tr key={ridx} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="px-3 py-2 text-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-gray-500 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            This is a preview of the first few rows. The complete report contains all
            data and can be downloaded in CSV or PDF format.
          </div>
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
