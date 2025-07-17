import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { LeadApiResponse } from "@/lib/types/lead";
import { UserRole } from "@/lib/types/user-roles";
import { ProjectType } from "@/lib/types/project-types";

// Interface for updating lead data
interface UpdateLeadFormData {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  projectType?: ProjectType;
  initialNotes?: string;
  assignedEstimatorId?: string | null;
  assignedEstimator?: string | null;
  isDraft?: boolean;
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

// GET /api/leads/[id] - Get specific lead by ID
export async function GET(
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

    // Check permissions
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

    // Find lead with populated references
    const lead = await Lead.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email")
      .populate("statusHistory.changedBy", "name email")
      .populate("communications.sentBy", "name email")
      .populate("notes.createdBy", "name email");

    if (!lead) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this lead
    const canView =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy._id.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?._id.toString() === user._id.toString());

    if (!canView) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Access denied to this lead" },
        { status: 403 }
      );
    }

    return NextResponse.json<LeadApiResponse>({
      success: true,
      lead: lead.toObject(),
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update specific lead
export async function PUT(
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

    // Check permissions - only BD and Admin can update leads
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Only BD and Admin users can update leads" },
        { status: 403 }
      );
    }

    await connect();

    const { id } = await params;
    const updateData: UpdateLeadFormData = await request.json();

    // Find the lead first
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this lead
    const canUpdate =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString());

    if (!canUpdate) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Access denied to update this lead" },
        { status: 403 }
      );
    }

    // Validate assigned estimator if provided
    if (
      updateData.assignedEstimatorId !== null &&
      updateData.assignedEstimatorId
    ) {
      const estimator = await User.findById(updateData.assignedEstimatorId);
      if (!estimator || !estimator.roles.includes(UserRole.ESTIMATOR)) {
        return NextResponse.json<LeadApiResponse>(
          { success: false, error: "Invalid estimator assignment" },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateFields: Partial<UpdateLeadFormData> = {};

    if (updateData.companyName !== undefined) {
      updateFields.companyName = updateData.companyName.trim();
    }
    if (updateData.contactPerson !== undefined) {
      updateFields.contactPerson = updateData.contactPerson.trim();
    }
    if (updateData.email !== undefined) {
      updateFields.email = updateData.email.toLowerCase().trim();
    }
    if (updateData.phone !== undefined) {
      updateFields.phone = updateData.phone.trim();
    }
    if (updateData.address !== undefined) {
      updateFields.address = updateData.address.trim();
    }
    if (updateData.projectType !== undefined) {
      updateFields.projectType = updateData.projectType;
    }
    if (updateData.initialNotes !== undefined) {
      updateFields.initialNotes = updateData.initialNotes.trim();
    }
    if (updateData.assignedEstimatorId !== undefined) {
      updateFields.assignedEstimator =
        updateData.assignedEstimatorId === null
          ? null
          : updateData.assignedEstimatorId;
    }
    if (updateData.isDraft !== undefined) {
      updateFields.isDraft = updateData.isDraft;
    }

    // Update the lead
    const updatedLead = await Lead.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email");

    return NextResponse.json<LeadApiResponse>({
      success: true,
      message: "Lead updated successfully",
      lead: updatedLead?.toObject(),
    });
  } catch (error) {
    console.error("Error updating lead:", error);

    // Handle mongoose validation errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      const validationError = error as unknown as {
        errors: Record<string, { message: string }>;
      };
      const validationErrors = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return NextResponse.json<LeadApiResponse>(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete specific lead
export async function DELETE(
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

    // Check permissions - only BD and Admin can delete leads
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Only BD and Admin users can delete leads" },
        { status: 403 }
      );
    }

    await connect();

    const { id } = await params;

    // Find the lead first
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this lead
    const canDelete =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString());

    if (!canDelete) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Access denied to delete this lead" },
        { status: 403 }
      );
    }

    // Delete the lead
    await Lead.findByIdAndDelete(id);

    return NextResponse.json<LeadApiResponse>({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
