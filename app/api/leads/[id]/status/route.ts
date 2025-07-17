import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { LeadApiResponse } from "@/lib/types/lead";
import { UserRole } from "@/lib/types/user-roles";
import { LeadStatus, LEAD_STATUS_TRANSITIONS } from "@/lib/types/lead-status";

// Interface for status update data
interface StatusUpdateData {
  toStatus: LeadStatus;
  reason?: string;
  notes?: string;
}

// User interface
interface AuthenticatedUser {
  _id: string;
  roles: UserRole[];
  name?: string;
  email?: string;
}

// Helper function to verify authentication and get user
async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return null;
  }

  await connect();
  const user = await User.findById(userId);
  return user;
}

// Helper function to check if user has required roles
function hasRequiredRole(
  user: AuthenticatedUser | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: UserRole) => allowedRoles.includes(role));
}

// POST /api/leads/[id]/status - Update lead status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - BD, Admin, and Estimators can update status
    if (
      !hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN, UserRole.ESTIMATOR])
    ) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    const { id } = await params;
    const statusData: StatusUpdateData = await request.json();

    // Validate required fields
    if (!statusData.toStatus) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "New status is required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!Object.values(LeadStatus).includes(statusData.toStatus)) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Find the lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this lead's status
    const canUpdate =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?.toString() === user._id.toString());

    if (!canUpdate) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Access denied to update this lead's status" },
        { status: 403 }
      );
    }

    // Check if status is actually changing
    if (lead.status === statusData.toStatus) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead is already in the specified status" },
        { status: 400 }
      );
    }

    // Use the predefined status transitions from the types
    const allowedNextStatuses =
      LEAD_STATUS_TRANSITIONS[lead.status as LeadStatus] || [];

    // Admin can override status transition rules
    if (
      !user.roles.includes(UserRole.ADMIN) &&
      !allowedNextStatuses.includes(statusData.toStatus)
    ) {
      return NextResponse.json<LeadApiResponse>(
        {
          success: false,
          error: `Invalid status transition from ${lead.status} to ${statusData.toStatus}`,
          details: [`Allowed transitions: ${allowedNextStatuses.join(", ")}`],
        },
        { status: 400 }
      );
    }

    // Update lead status using the model method
    lead.addStatusChange(
      statusData.toStatus,
      user._id.toString(),
      statusData.reason,
      statusData.notes
    );

    // Save the updated lead
    await lead.save();

    // Return updated lead with populated references
    const updatedLead = await Lead.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email")
      .populate("statusHistory.changedBy", "name email");

    return NextResponse.json<LeadApiResponse>({
      success: true,
      message: `Lead status updated to ${statusData.toStatus}`,
      lead: updatedLead?.toObject(),
    });
  } catch (error) {
    console.error("Error updating lead status:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
