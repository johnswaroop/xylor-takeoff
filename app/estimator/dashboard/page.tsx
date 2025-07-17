"use client";

import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { UserRole } from "@/lib/types/user-roles";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useEstimatorDashboardData } from "@/lib/hooks/useEstimatorDashboard";
import { EstimatorStatsCards } from "./components/EstimatorStatsCards";
import { EstimatorLeadsTable } from "./components/EstimatorLeadsTable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function EstimatorDashboard() {
  // Auth guard to ensure only estimators can access
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({
    requiredRoles: [UserRole.ESTIMATOR],
  });

  // Fetch dashboard data
  const { stats, leads, isLoading, error, refetch } =
    useEstimatorDashboardData();

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Estimator Dashboard
            </h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth guard will handle redirect if not authenticated/authorized
  if (!isAuthenticated) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Estimator Dashboard
            </h1>
            <p className="text-muted-foreground text-red-600">
              Error: {error?.message || "An error occurred"}
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Estimator Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your assigned projects and track estimation progress
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <EstimatorStatsCards stats={stats} isLoading={isLoading} />

        {/* Assigned Projects Table */}
        <EstimatorLeadsTable
          leads={leads}
          isLoading={isLoading}
          onRefresh={refetch}
        />
      </div>
    </div>
  );
}
