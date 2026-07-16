"use client";

import { useState, useCallback, useEffect } from "react";
import { User, UserFilters } from "@/types/admin";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import StrikeIssueForm from "./StrikeIssueForm";
import StudentIdPreview from "./StudentIdPreview";
import DisputeHistoryView from "./DisputeHistoryView";

interface UserManagementState {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;
}

interface DialogState {
  type: "strikes" | "id-preview" | "disputes" | "ban" | null;
  userId: string | null;
  user: User | null;
}

export default function UserManagement() {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    campus: "",
    verified: undefined,
    banned: undefined,
  });

  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    userId: null,
    user: null,
  });

  const [exporting, setExporting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await adminService.fetchUsers(state.page, state.perPage, filters);
      setState((prev) => ({
        ...prev,
        users: res.users,
        total: res.total,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to fetch users",
        loading: false,
      }));
    }
  }, [state.page, state.perPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setState((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setState((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setState((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminService.downloadUsersCsv(filters);
    } catch (err) {
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      await adminService.banUser(userId, reason);
      await fetchUsers();
      setDialog({ type: null, userId: null, user: null });
    } catch (err) {
      alert("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await adminService.unbanUser(userId);
      await fetchUsers();
    } catch (err) {
      alert("Failed to unban user");
    }
  };

  const handleVerifyStudentId = async (userId: string) => {
    try {
      await adminService.verifyStudentId(userId);
      await fetchUsers();
    } catch (err) {
      alert("Failed to verify student ID");
    }
  };

  const getStrikeBadgeColor = (strikes: number) => {
    if (strikes === 0) return "bg-ahia-success/10 text-ahia-success";
    if (strikes === 1) return "bg-blue-100 text-blue-700";
    if (strikes === 2) return "bg-amber-100 text-amber-700";
    if (strikes === 3) return "bg-orange-100 text-orange-700";
    return "bg-ahia-red/10 text-ahia-red";
  };

  const totalPages = Math.ceil(state.total / state.perPage);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-fredoka font-bold text-foreground mb-2">
          User Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage users, verify IDs, issue strikes, and enforce platform rules.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search by name or email..."
          value={filters.search || ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="rounded-xl border border-gray-200"
        />

        <Select
          value={filters.campus || ""}
          onValueChange={(v: string) => handleFilterChange("campus", v || undefined)}
        >
          <option value="">All Campuses</option>
          <option value="UNIBEN">UNIBEN</option>
          <option value="UNILAG">UNILAG</option>
          <option value="OAU">OAU</option>
        </Select>

        <Select
          value={
            filters.verified === undefined
              ? ""
              : filters.verified
              ? "verified"
              : "unverified"
          }
          onValueChange={(v: string) => {
            if (v === "verified") handleFilterChange("verified", true);
            else if (v === "unverified") handleFilterChange("verified", false);
            else handleFilterChange("verified", undefined);
          }}
        >
          <option value="">All Verification</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="rounded-xl flex-1 border-gray-200"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button
            onClick={() => fetchUsers()}
            disabled={state.loading}
            className="rounded-xl flex-1 bg-ahia-sunset hover:opacity-90 text-white"
          >
            Refresh
          </Button>
        </div>
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
              <TableHead className="font-semibold text-foreground">Name</TableHead>
              <TableHead className="font-semibold text-foreground">Email</TableHead>
              <TableHead className="font-semibold text-foreground">Campus</TableHead>
              <TableHead className="font-semibold text-foreground">Trust Score</TableHead>
              <TableHead className="font-semibold text-foreground">Verified</TableHead>
              <TableHead className="font-semibold text-foreground">Strikes</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : state.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              state.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell className="text-gray-600">{user.campus}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-ahia-trust">
                        {user.trust_score.toFixed(1)}
                      </span>
                      <span className="text-gray-400">/5.0</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.student_id_verified ? (
                      <Badge className="bg-ahia-success/10 text-ahia-success">
                        <CheckCircle size={12} className="mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300">
                        Unverified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStrikeBadgeColor(user.strikes)}>
                      {user.strikes}/4
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <Badge className="bg-ahia-red/10 text-ahia-red">
                        <Ban size={12} className="mr-1" />
                        Banned
                      </Badge>
                    ) : (
                      <Badge className="bg-ahia-success/10 text-ahia-success">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setDialog({
                            type: "id-preview",
                            userId: user.id,
                            user,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View ID"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() =>
                          setDialog({
                            type: "strikes",
                            userId: user.id,
                            user,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Manage Strikes"
                      >
                        <AlertTriangle size={16} className="text-amber-600" />
                      </button>
                      <button
                        onClick={() =>
                          setDialog({
                            type: "disputes",
                            userId: user.id,
                            user,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View Disputes"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </button>
                      {user.is_banned ? (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Unban User"
                        >
                          <CheckCircle size={16} className="text-ahia-success" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setDialog({
                              type: "ban",
                              userId: user.id,
                              user,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Ban User"
                        >
                          <Ban size={16} className="text-ahia-red" />
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
            Page {state.page} of {totalPages} ({state.total} total users)
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
      {dialog.user && dialog.type === "strikes" && (
        <StrikeIssueForm
          user={dialog.user}
          onClose={() => setDialog({ type: null, userId: null, user: null })}
          onStrikeIssued={fetchUsers}
        />
      )}

      {dialog.user && dialog.type === "id-preview" && (
        <StudentIdPreview
          user={dialog.user}
          onClose={() => setDialog({ type: null, userId: null, user: null })}
          onVerify={handleVerifyStudentId}
        />
      )}

      {dialog.user && dialog.type === "disputes" && (
        <DisputeHistoryView
          user={dialog.user}
          onClose={() => setDialog({ type: null, userId: null, user: null })}
        />
      )}

      {dialog.user && dialog.type === "ban" && (
        <BanUserDialog
          user={dialog.user}
          onClose={() => setDialog({ type: null, userId: null, user: null })}
          onBan={handleBanUser}
        />
      )}
    </div>
  );
}

// Ban User Dialog Component
function BanUserDialog({
  user,
  onClose,
  onBan,
}: {
  user: User;
  onClose: () => void;
  onBan: (userId: string, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for banning");
      return;
    }
    setLoading(true);
    try {
      await onBan(user.id, reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-fredoka text-lg">Ban User</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to ban <strong>{user.name}</strong>. They will no longer be able to
            access the platform.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Reason for ban:</label>
          <Input
            placeholder="Violation of community guidelines, multiple strikes, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border-gray-200"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBan}
            disabled={loading}
            className="rounded-lg bg-ahia-red hover:bg-ahia-red/90 text-white"
          >
            {loading ? "Banning..." : "Ban User"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
