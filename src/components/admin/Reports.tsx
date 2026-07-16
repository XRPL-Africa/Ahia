"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, Download, Calendar, Mail, Clock } from "lucide-react";
import ReportScheduler from "./ReportScheduler";
import ReportPreview from "./ReportPreview";

interface Report {
  id: string;
  name: string;
  type: "transaction" | "verification" | "dispute" | "revenue";
  description: string;
  generatedAt: string;
  fileSize: string;
  status: "ready" | "generating" | "failed";
}

interface ScheduledReport {
  id: string;
  reportType: string;
  frequency: "daily" | "weekly" | "monthly";
  lastRun: string;
  nextRun: string;
  recipients: string[];
  enabled: boolean;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      name: "Transaction Report - January 2024",
      type: "transaction",
      description: "All transactions processed in January",
      generatedAt: "2024-02-01",
      fileSize: "2.4 MB",
      status: "ready",
    },
    {
      id: "2",
      name: "User Verification Report - December 2023",
      type: "verification",
      description: "Student ID verification submissions",
      generatedAt: "2024-01-15",
      fileSize: "1.8 MB",
      status: "ready",
    },
  ]);

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: "sch1",
      reportType: "Transaction Report",
      frequency: "monthly",
      lastRun: "2024-02-01",
      nextRun: "2024-03-01",
      recipients: ["admin@ahiamarket.app"],
      enabled: true,
    },
  ]);

  const [dialog, setDialog] = useState<{
    type: "generate" | "schedule" | "preview" | null;
    report?: Report;
  }>({ type: null });

  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async (reportType: string) => {
    setGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newReport: Report = {
        id: Date.now().toString(),
        name: `${reportType} Report - ${new Date().toLocaleDateString()}`,
        type: reportType as Report["type"],
        description: `Generated on ${new Date().toLocaleDateString()}`,
        generatedAt: new Date().toISOString(),
        fileSize: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)} MB`,
        status: "ready",
      };

      setReports((prev) => [newReport, ...prev]);
      setDialog({ type: null });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report: Report, format: "csv" | "pdf") => {
    // Mock download
    const element = document.createElement("a");
    element.setAttribute("href", "#");
    element.setAttribute("download", `${report.id}.${format}`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "transaction":
        return "bg-blue-100 text-blue-700";
      case "verification":
        return "bg-green-100 text-green-700";
      case "dispute":
        return "bg-orange-100 text-orange-700";
      case "revenue":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-fredoka font-bold text-foreground mb-2">
          Report Generation
        </h1>
        <p className="text-sm text-gray-600">
          Generate, download, and schedule automated reports.
        </p>
      </div>

      {/* Quick Generate */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: "transaction", label: "Transaction Report" },
          { type: "verification", label: "Verification Report" },
          { type: "dispute", label: "Dispute Report" },
          { type: "revenue", label: "Revenue Report" },
        ].map((report) => (
          <Button
            key={report.type}
            onClick={() => handleGenerateReport(report.type)}
            disabled={generating}
            className="rounded-xl bg-ahia-sunset hover:opacity-90 text-white h-20 flex flex-col items-center justify-center"
          >
            <Download size={20} className="mb-2" />
            <span className="text-sm font-medium">{report.label}</span>
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button className="px-4 py-2 text-sm font-medium text-ahia-sunset border-b-2 border-ahia-sunset">
          Generated Reports
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-foreground">
          Scheduled Reports
        </button>
      </div>

      {/* Generated Reports Table */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No reports generated yet
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="rounded-xl border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{report.name}</h3>
                      <Badge className={getTypeColor(report.type)}>
                        {report.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Generated: {new Date(report.generatedAt).toLocaleDateString()}
                      </span>
                      <span>Size: {report.fileSize}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setDialog({ type: "preview", report })}
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-gray-200"
                    >
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleDownload(report, "csv")}
                      size="sm"
                      className="rounded-lg bg-ahia-success hover:opacity-90 text-white"
                    >
                      CSV
                    </Button>
                    <Button
                      onClick={() => handleDownload(report, "pdf")}
                      size="sm"
                      className="rounded-lg bg-ahia-sunset hover:opacity-90 text-white"
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Scheduled Reports Section */}
      <div className="pt-6 border-t space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-fredoka font-semibold text-foreground">
            Scheduled Reports
          </h2>
          <Button
            onClick={() => setDialog({ type: "schedule" })}
            className="rounded-xl bg-ahia-sunset hover:opacity-90 text-white"
          >
            <Clock size={16} className="mr-2" />
            Schedule Report
          </Button>
        </div>

        {scheduledReports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No scheduled reports
          </div>
        ) : (
          scheduledReports.map((scheduled) => (
            <Card key={scheduled.id} className="rounded-xl border-gray-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Report Type</div>
                    <div className="font-medium text-foreground">
                      {scheduled.reportType}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Frequency</div>
                    <Badge className="bg-blue-100 text-blue-700 w-fit">
                      {scheduled.frequency}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Next Run</div>
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(scheduled.nextRun).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Recipients</div>
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <Mail size={14} />
                      {scheduled.recipients.length} email(s)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {dialog.type === "schedule" && (
        <ReportScheduler
          onClose={() => setDialog({ type: null })}
          onSchedule={() => {
            setDialog({ type: null });
          }}
        />
      )}

      {dialog.type === "preview" && dialog.report && (
        <ReportPreview
          report={dialog.report}
          onClose={() => setDialog({ type: null })}
        />
      )}
    </div>
  );
}
