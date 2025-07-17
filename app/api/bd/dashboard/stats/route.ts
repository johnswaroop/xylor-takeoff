import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import {
  DashboardStatsResponse,
  DashboardStats,
  LeadsByStatus,
  LeadsByProjectType,
} from "@/lib/types/dashboard";
import { LeadStatus } from "@/lib/types/lead-status";
import { ProjectType } from "@/lib/types/project-types";
import { UserRole } from "@/lib/types/user-roles";

// Helper function to verify authentication and get user
async function getAuthenticatedUser(request: NextRequest) {
  // In a real app, you'd verify JWT token from headers
  // For now, we'll get user ID from headers (temporary)
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return null;
  }

  // Validate ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    return null;
  }

  await connect();
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

// Helper function to check if user has required roles
function hasRequiredRole(
  user: { roles?: UserRole[] } | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: UserRole) => allowedRoles.includes(role));
}

// GET /api/bd/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<DashboardStatsResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only BD and Admin can view dashboard stats
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<DashboardStatsResponse>(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    // Build query based on user role - BD sees own leads, Admin sees all
    const query: Record<string, string | boolean | object> = {};
    if (
      user.roles.includes(UserRole.BD) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      query.createdBy = user._id;
    }

    // Get current month date range for monthly targets calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate basic stats - simple counting without aggregations

    // 1. Active leads count (non-completed, non-draft leads)
    const activeLeadsQuery = {
      ...query,
      isDraft: false,
      status: { $ne: LeadStatus.COMPLETED },
    };
    const activeLeadsCount = await Lead.countDocuments(activeLeadsQuery);

    // 2. Conversion rate calculation (simple percentage)
    const totalLeadsQuery = { ...query, isDraft: false };
    const completedLeadsQuery = {
      ...query,
      status: LeadStatus.ESTIMATE_APPROVED,
    };

    const [totalLeads, completedLeads] = await Promise.all([
      Lead.countDocuments(totalLeadsQuery),
      Lead.countDocuments(completedLeadsQuery),
    ]);

    const conversionRate =
      totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

    // 3. Revenue pipeline (sum of estimated values from completed estimations)
    // For simplicity, we'll use a mock value for now since we don't have price aggregation
    const revenuePipeline = completedLeads * 50000; // Mock average project value

    // 4. Monthly targets (leads created this month)
    const monthlyLeadsQuery = {
      ...query,
      isDraft: false,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    };
    const monthlyTargets = await Lead.countDocuments(monthlyLeadsQuery);

    // Get leads by status (simple counting)
    const leadsByStatus: LeadsByStatus = {};
    const statusCounts = await Promise.all(
      Object.values(LeadStatus).map(async (status) => {
        const count = await Lead.countDocuments({
          ...query,
          status,
          isDraft: false,
        });
        return { status, count };
      })
    );

    statusCounts.forEach(({ status, count }) => {
      leadsByStatus[status] = count;
    });

    // Get leads by project type (simple counting)
    const leadsByProjectType: LeadsByProjectType = {};
    const typeCounts = await Promise.all(
      Object.values(ProjectType).map(async (projectType) => {
        const count = await Lead.countDocuments({
          ...query,
          projectType,
          isDraft: false,
        });
        return { projectType, count };
      })
    );

    typeCounts.forEach(({ projectType, count }) => {
      leadsByProjectType[projectType] = count;
    });

    // Build response
    const stats: DashboardStats = {
      activeLeads: activeLeadsCount,
      conversionRate,
      revenuePipeline,
      monthlyTargets,
    };

    return NextResponse.json<DashboardStatsResponse>({
      success: true,
      stats,
      leadsByStatus,
      leadsByProjectType,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json<DashboardStatsResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
