"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Users, BarChart3, PieChart, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const modules = [
    {
      title: "User Management",
      description: "Manage users, verify IDs, issue strikes, ban users",
      icon: Users,
      href: "/admin/users",
      color: "text-ahia-trust",
    },
    {
      title: "Dispute Resolution",
      description: "Handle disputes, view evidence, communicate, make decisions",
      icon: BarChart3,
      href: "/admin/disputes",
      color: "text-ahia-sunset",
    },
    {
      title: "Analytics Dashboard",
      description: "Monitor DAU, transactions, revenue, user growth",
      icon: PieChart,
      href: "/admin/analytics",
      color: "text-ahia-success",
    },
    {
      title: "Reports",
      description: "Generate and schedule reports, export data",
      icon: FileText,
      href: "/admin/reports",
      color: "text-ahia-gold",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-fredoka font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage platform operations, users, disputes, and analytics
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="p-6 rounded-xl border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full space-y-3">
                <div
                  className={`p-3 rounded-lg bg-opacity-10 w-fit ${module.color.replace(
                    "text-",
                    "bg-"
                  )}`}
                >
                  <Icon size={24} className={module.color} />
                </div>
                <h2 className="font-fredoka font-semibold text-foreground">
                  {module.title}
                </h2>
                <p className="text-sm text-gray-600">{module.description}</p>
                <Button className="w-full rounded-lg bg-ahia-sunset hover:opacity-90 text-white text-sm mt-4">
                  Open
                </Button>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
        <div className="text-center p-4">
          <div className="text-3xl font-fredoka font-bold text-ahia-trust">2,847</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-fredoka font-bold text-ahia-sunset">₦4.2M</div>
          <div className="text-sm text-gray-600">Transaction Volume</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-fredoka font-bold text-ahia-success">94.2%</div>
          <div className="text-sm text-gray-600">Escrow Success</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-fredoka font-bold text-ahia-gold">23</div>
          <div className="text-sm text-gray-600">Open Disputes</div>
        </div>
      </div>
    </div>
  );
}
