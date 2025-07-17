"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatus, LEAD_STATUS_LABELS } from "@/lib/types/lead-status";
import { ProjectType, PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
import { DashboardLead } from "@/lib/types/dashboard";
import { useDashboardData } from "@/lib/hooks/useDashboard";
import { useAuth } from "@/lib/contexts/AuthContext";
import { NavigationHeader } from "@/components/NavigationHeader";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Plus,
  Download,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
} from "lucide-react";

// Using React Query now - no need for local state interface

// Mock data removed - now using React Query

// Status badge color mapping
const getStatusBadgeVariant = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.ADD_LEAD:
    case LeadStatus.ATTACH_QUALIFIERS:
      return "secondary";
    case LeadStatus.AWAITING_QUALIFIER_RESPONSE:
    case LeadStatus.AWAITING_ESTIMATE_DECISION:
      return "outline";
    case LeadStatus.ESTIMATION_IN_PROGRESS:
    case LeadStatus.REVIEW_QUALIFIER_RESPONSE:
      return "default";
    case LeadStatus.ESTIMATE_APPROVED:
    case LeadStatus.COMPLETED:
      return "default";
    case LeadStatus.ESTIMATE_REJECTED:
      return "destructive";
    default:
      return "secondary";
  }
};

export default function BDDashboard() {
  const { isAuthenticated } = useAuth();
  const { stats, leads, isLoading, error } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [projectTypeFilter, setProjectTypeFilter] = useState<
    ProjectType | "ALL"
  >("ALL");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">BD Dashboard</h1>
            <p className="text-muted-foreground text-red-600">
              Please log in to access the dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter leads based on search and filters
  const filteredLeads = (leads.data || []).filter((lead: DashboardLead) => {
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || lead.status === statusFilter;
    const matchesProjectType =
      projectTypeFilter === "ALL" || lead.projectType === projectTypeFilter;

    return matchesSearch && matchesStatus && matchesProjectType;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date - handles both Date objects and date strings
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }

      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(dateObj);
    } catch (error) {
      console.warn("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">BD Dashboard</h1>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
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
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">BD Dashboard</h1>
            <p className="text-muted-foreground text-red-600">
              Error: {error?.message || "An error occurred"}
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Failed to load dashboard data. Please try refreshing the page.
              </p>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">BD Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your leads and track business development performance
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Leads
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.data?.activeLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.data?.conversionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Pipeline
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.data?.revenuePipeline || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total estimated value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.data?.monthlyTargets || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                New leads generated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/bd/leads/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Lead
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Overview</CardTitle>
            <CardDescription>View and manage all your leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, contact person, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as LeadStatus | "ALL")
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(LEAD_STATUS_LABELS).map(([status, label]) => (
                    <SelectItem key={status} value={status}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={projectTypeFilter}
                onValueChange={(value) =>
                  setProjectTypeFilter(value as ProjectType | "ALL")
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Project Types</SelectItem>
                  {Object.entries(PROJECT_TYPE_LABELS).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leads Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Company & Contact
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Project Type
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Assigned Estimator
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No leads found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr
                          key={lead._id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {lead.companyName}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <User className="mr-1 h-3 w-3" />
                                {lead.contactPerson}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="mr-1 h-3 w-3" />
                                {lead.email}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={getStatusBadgeVariant(lead.status)}>
                              {lead.statusLabel}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center text-sm">
                              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                              {lead.projectTypeLabel}
                            </div>
                          </td>
                          <td className="p-4">
                            {lead.assignedEstimator ? (
                              <div className="flex items-center text-sm">
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                {lead.assignedEstimator.name}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-2 h-4 w-4" />
                              {formatDate(lead.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lead.ageInDays} days ago
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/bd/leads/${lead._id}`}>View</Link>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Results Summary */}
            {filteredLeads.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredLeads.length} of {leads.data?.length || 0}{" "}
                leads
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
