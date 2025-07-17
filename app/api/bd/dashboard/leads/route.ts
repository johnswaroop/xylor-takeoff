import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { DashboardLeadsResponse, DashboardLead } from "@/lib/types/dashboard";
import { LeadStatus, LEAD_STATUS_LABELS } from "@/lib/types/lead-status";
import { ProjectType, PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
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

// Helper function to calculate last contact date from communications
function getLastContactDate(
  communications: Array<{ sentAt: Date }>
): Date | null {
  if (!communications || communications.length === 0) return null;

  const sortedComms = communications.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return sortedComms[0]?.sentAt || null;
}

// Helper function to calculate age in days
function calculateAgeInDays(createdAt: Date): number {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
}

// GET /api/bd/dashboard/leads - Get simplified leads overview for dashboard
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<DashboardLeadsResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only BD and Admin can view dashboard leads
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<DashboardLeadsResponse>(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build query based on user role - BD sees own leads, Admin sees all
    const query: Record<string, string | boolean | object> = {};
    if (
      user.roles.includes(UserRole.BD) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      query.createdBy = user._id;
    }

    // Only show non-draft leads in dashboard overview
    query.isDraft = false;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get leads with populated data
    const leads = await Lead.find(query)
      .populate("assignedEstimator", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Lead.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Transform leads to dashboard format
    const dashboardLeads: DashboardLead[] = leads.map((lead) => ({
      _id: (lead._id as { toString(): string }).toString(),
      companyName: lead.companyName as string,
      contactPerson: lead.contactPerson as string,
      email: lead.email as string,
      status: lead.status as LeadStatus,
      statusLabel:
        LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ||
        (lead.status as string),
      projectType: lead.projectType as ProjectType,
      projectTypeLabel:
        PROJECT_TYPE_LABELS[
          lead.projectType as keyof typeof PROJECT_TYPE_LABELS
        ] || (lead.projectType as string),
      lastContactDate: getLastContactDate(
        lead.communications as Array<{ sentAt: Date }>
      ),
      assignedEstimator: lead.assignedEstimator
        ? {
            _id: (
              lead.assignedEstimator as {
                _id: { toString(): string };
                name: string;
              }
            )._id.toString(),
            name: (
              lead.assignedEstimator as {
                _id: { toString(): string };
                name: string;
              }
            ).name,
          }
        : null,
      createdAt: lead.createdAt as Date,
      updatedAt: lead.updatedAt as Date,
      ageInDays: calculateAgeInDays(lead.createdAt as Date),
    }));

    return NextResponse.json<DashboardLeadsResponse>({
      success: true,
      leads: dashboardLeads,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard leads:", error);
    return NextResponse.json<DashboardLeadsResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
