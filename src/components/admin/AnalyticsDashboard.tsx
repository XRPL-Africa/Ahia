"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, DollarSign, Clock, MapPin, Activity, type LucideIcon } from "lucide-react";

interface AnalyticsData {
  dau: Array<{ date: string; users: number }>;
  transactions: Array<{ date: string; volume: number }>;
  escrowSuccess: number;
  avgVerificationTime: number;
  campusDensity: Array<{ campus: string; users: number }>;
  revenue: Array<{ month: string; amount: number }>;
  userGrowth: Array<{ month: string; total: number }>;
}

const COLORS = [
  "#ff7a00",
  "#ff4b4b",
  "#ffc700",
  "#0062ff",
  "#00c853",
  "#9c27b0",
  "#00bcd4",
  "#ff5722",
];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Mock data fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setData({
          dau: Array.from({ length: 7 }, (_, i) => ({
            date: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
            users: Math.floor(Math.random() * 2000) + 3000,
          })),
          transactions: Array.from({ length: 7 }, (_, i) => ({
            date: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
            volume: Math.floor(Math.random() * 50000) + 100000,
          })),
          escrowSuccess: 94.2,
          avgVerificationTime: 2.5,
          campusDensity: [
            { campus: "UNIBEN", users: 1245 },
            { campus: "UNILAG", users: 2100 },
            { campus: "OAU", users: 890 },
            { campus: "UI", users: 1567 },
            { campus: "LASU", users: 756 },
          ],
          revenue: Array.from({ length: 12 }, (_, i) => ({
            month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
            amount: Math.floor(Math.random() * 50000) + 50000,
          })),
          userGrowth: Array.from({ length: 12 }, (_, i) => ({
            month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
            total: (i + 1) * 2000 + Math.floor(Math.random() * 1000),
          })),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 text-center text-gray-400">
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 text-center text-red-500">
        Failed to load analytics
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-fredoka font-bold text-foreground mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Monitor platform health, transactions, and user growth.
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                timeRange === range
                  ? "bg-ahia-sunset text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Daily Active Users"
          value="5,234"
          change="+12%"
          color="text-ahia-trust"
        />
        <KpiCard
          icon={DollarSign}
          label="Transaction Volume"
          value="₦2.5M"
          change="+8%"
          color="text-ahia-success"
        />
        <KpiCard
          icon={Activity}
          label="Escrow Success Rate"
          value={`${data.escrowSuccess}%`}
          change="+2%"
          color="text-ahia-sunset"
        />
        <KpiCard
          icon={Clock}
          label="Avg Verification Time"
          value={`${data.avgVerificationTime}h`}
          change="-30%"
          color="text-ahia-gold"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users */}
        <Card className="p-6 rounded-xl border-gray-200">
          <h3 className="font-fredoka font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-ahia-trust" />
            Daily Active Users
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dau}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#0062ff"
                strokeWidth={2}
                dot={{ fill: "#0062ff", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaction Volume */}
        <Card className="p-6 rounded-xl border-gray-200">
          <h3 className="font-fredoka font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-ahia-success" />
            Transaction Volume
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.transactions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="volume" fill="#00c853" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Campus Density */}
        <Card className="p-6 rounded-xl border-gray-200">
          <h3 className="font-fredoka font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-ahia-sunset" />
            Campus User Density
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.campusDensity}
                dataKey="users"
                nameKey="campus"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {data.campusDensity.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Month */}
        <Card className="p-6 rounded-xl border-gray-200">
          <h3 className="font-fredoka font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-ahia-gold" />
            Monthly Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="amount" fill="#ff7a00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* User Growth */}
        <Card className="p-6 rounded-xl border-gray-200 lg:col-span-2">
          <h3 className="font-fredoka font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users size={18} className="text-ahia-trust" />
            Cumulative User Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#0062ff"
                strokeWidth={3}
                dot={{ fill: "#0062ff", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// KPI Card Component
function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
  color: string;
}) {
  return (
    <Card className="p-4 rounded-xl border-gray-200 space-y-2">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace("text-", "bg-")}`}>
          <Icon size={20} className={color} />
        </div>
        <span className={`text-xs font-semibold ${change.startsWith("+") ? "text-ahia-success" : "text-ahia-red"}`}>
          {change}
        </span>
      </div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-fredoka font-bold text-foreground">{value}</div>
    </Card>
  );
}
