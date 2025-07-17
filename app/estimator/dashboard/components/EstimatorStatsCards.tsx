"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstimatorDashboardStats } from "@/lib/types/dashboard";
import { Users, Clock, Wrench, CheckCircle } from "lucide-react";

interface EstimatorStatsCardsProps {
  stats: EstimatorDashboardStats | null;
  isLoading?: boolean;
}

export function EstimatorStatsCards({
  stats,
  isLoading,
}: EstimatorStatsCardsProps) {
  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Assigned",
      value: stats?.totalAssigned || 0,
      description: "All assigned projects",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Pending Estimation",
      value: stats?.pendingEstimation || 0,
      description: "Awaiting estimation start",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "In Progress",
      value: stats?.inProgress || 0,
      description: "Currently estimating",
      icon: Wrench,
      color: "text-purple-600",
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      description: "Estimates ready",
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
