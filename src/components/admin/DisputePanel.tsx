"use client";

import { useState, useCallback, useEffect } from "react";
import { Dispute } from "@/types/admin";
import adminService from "@/services/admin.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import DisputeDetailView from "./DisputeDetailView";
import DisputeChatPanel from "./DisputeChatPanel";
import DisputeDecisionForm from "./DisputeDecisionForm";

interface DisputeState {
  disputes: Dispute[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;
}

interface DialogState {
  type: "detail" | "chat" | "decision" | null;
  dispute: Dispute | null;
}

export default function DisputePanel() {
  const [state, setState] = useState<DisputeState>({
    disputes: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: false,
    error: null,
  });

  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    dispute: null,
  });

  const adminServiceWithDisputes = adminService as {
    fetchDisputes?: (
      page: number,
      perPage: number,
      filters?: { status?: string }
    ) => Promise<{ disputes: Dispute[]; total: number }>;
  };

  // Fetch disputes
  const fetchDisputes = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // This will be implemented via admin service
      const res = await adminServiceWithDisputes.fetchDisputes?.(state.page, state.perPage, {
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res) {
        setState((prev) => ({
          ...prev,
          disputes: res.disputes,
          total: res.total,
          loading: false,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to fetch disputes",
        loading: false,
      }));
    }
  }, [state.page, state.perPage, statusFilter]);

  useEffect(() => {
    const loadDisputes = async () => {
      await fetchDisputes();
    };

    loadDisputes();
  }, [fetchDisputes]);

  const handlePageChange = (newPage: number) => {
    setState((prev) => ({ ...prev, page: newPage }));
  };

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

  const totalPages = Math.ceil(state.total / state.perPage);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-fredoka font-bold text-foreground mb-2">
          Dispute Resolution
        </h1>
        <p className="text-sm text-gray-600">
          Manage buyer-seller disputes, view evidence, communicate, and make decisions.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {["all", "open", "in_review", "resolved", "closed"].map((status) => (
            <Button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setState((prev) => ({ ...prev, page: 1 }));
              }}
              variant={statusFilter === status ? "default" : "outline"}
              className={
                statusFilter === status
                  ? "rounded-xl bg-ahia-sunset text-white"
                  : "rounded-xl border-gray-200"
              }
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
            </Button>
          ))}
        </div>
        <Button
          onClick={fetchDisputes}
          disabled={state.loading}
          className="rounded-xl bg-ahia-sunset hover:opacity-90 text-white ml-auto"
        >
          Refresh
        </Button>
      </div>

      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-3 bg-ahia-red/10 border border-ahia-red/20 rounded-xl px-4 py-3 text-ahia-red text-sm">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-ahia">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-foreground">ID</TableHead>
              <TableHead className="font-semibold text-foreground">Buyer</TableHead>
              <TableHead className="font-semibold text-foreground">Seller</TableHead>
              <TableHead className="font-semibold text-foreground">Reason</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Created</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                  Loading disputes...
                </TableCell>
              </TableRow>
            ) : state.disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                  No disputes found
                </TableCell>
              </TableRow>
            ) : (
              state.disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {dispute.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-gray-600">Buyer</TableCell>
                  <TableCell className="text-gray-600">Seller</TableCell>
                  <TableCell className="text-gray-600 truncate max-w-xs">
                    {dispute.reason}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setDialog({ type: "detail", dispute })
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() =>
                          setDialog({ type: "chat", dispute })
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View Chat"
                      >
                        <MessageCircle size={16} className="text-blue-600" />
                      </button>
                      {dispute.status !== "closed" && (
                        <button
                          onClick={() =>
                            setDialog({ type: "decision", dispute })
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Make Decision"
                        >
                          <CheckCircle size={16} className="text-ahia-success" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {state.page} of {totalPages} ({state.total} total disputes)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(state.page - 1)}
              disabled={state.page === 1}
              variant="outline"
              className="rounded-lg border-gray-200"
              size="sm"
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = Math.max(1, state.page - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  variant={pageNum === state.page ? "default" : "outline"}
                  className={
                    pageNum === state.page
                      ? "rounded-lg bg-ahia-sunset text-white"
                      : "rounded-lg border-gray-200"
                  }
                  size="sm"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              onClick={() => handlePageChange(state.page + 1)}
              disabled={state.page === totalPages}
              variant="outline"
              className="rounded-lg border-gray-200"
              size="sm"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {dialog.dispute && dialog.type === "detail" && (
        <DisputeDetailView
          dispute={dialog.dispute}
          onClose={() => setDialog({ type: null, dispute: null })}
        />
      )}

      {dialog.dispute && dialog.type === "chat" && (
        <DisputeChatPanel
          dispute={dialog.dispute}
          onClose={() => setDialog({ type: null, dispute: null })}
        />
      )}

      {dialog.dispute && dialog.type === "decision" && (
        <DisputeDecisionForm
          dispute={dialog.dispute}
          onClose={() => setDialog({ type: null, dispute: null })}
          onDecisionMade={fetchDisputes}
        />
      )}
    </div>
  );
}
