import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { UserRole } from "@/lib/types/user-roles";
import { LeadStatus } from "@/lib/types/lead-status";
import {
  EstimatorDashboardStats,
  EstimatorLead,
  EstimatorDashboardResponse,
} from "@/lib/types/dashboard";

// Helper function to verify authentication and get user
async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;

  await connect();
  const user = await User.findById(userId);
  return user;
}

// Helper function to check if user has required roles
function hasRequiredRole(
  user: { roles?: UserRole[] } | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: UserRole) => allowedRoles.includes(role));
}

// MongoDB document types use any for ObjectId
/* eslint-disable @typescript-eslint/no-explicit-any */

// GET /api/estimator/dashboard - Get estimator dashboard data
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<EstimatorDashboardResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only ESTIMATOR role can access
    if (!hasRequiredRole(user, [UserRole.ESTIMATOR])) {
      return NextResponse.json<EstimatorDashboardResponse>(
        { success: false, error: "Estimator access required" },
        { status: 403 }
      );
    }

    await connect();

    // Find leads assigned to this estimator
    const assignedLeads = await Lead.find({
      assignedEstimator: user._id,
    })
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    // Filter leads by estimation-relevant statuses
    const estimationStatuses = [
      LeadStatus.SENT_FOR_ESTIMATES,
      LeadStatus.ESTIMATION_IN_PROGRESS,
      LeadStatus.ESTIMATES_READY,
    ];

    const relevantLeads = assignedLeads.filter((lead) =>
      estimationStatuses.includes(lead.status)
    );

    // Calculate stats
    const stats: EstimatorDashboardStats = {
      totalAssigned: assignedLeads.length,
      pendingEstimation: assignedLeads.filter(
        (lead) => lead.status === LeadStatus.SENT_FOR_ESTIMATES
      ).length,
      inProgress: assignedLeads.filter(
        (lead) => lead.status === LeadStatus.ESTIMATION_IN_PROGRESS
      ).length,
      completed: assignedLeads.filter(
        (lead) => lead.status === LeadStatus.ESTIMATES_READY
      ).length,
    };

    // Transform leads for response
    const leadsResponse: EstimatorLead[] = relevantLeads.map((lead) => ({
      _id: (lead._id as any).toString(),
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      projectType: lead.projectType,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      ageInDays: Math.floor(
        (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json<EstimatorDashboardResponse>({
      success: true,
      stats,
      leads: leadsResponse,
    });
  } catch (error) {
    console.error("Error fetching estimator dashboard:", error);
    return NextResponse.json<EstimatorDashboardResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
