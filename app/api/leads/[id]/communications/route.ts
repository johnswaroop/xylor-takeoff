import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { LeadApiResponse } from "@/lib/types/lead";
import { UserRole } from "@/lib/types/user-roles";
import { CommunicationType } from "@/lib/types/lead";

// Interface for adding communication data
interface AddCommunicationData {
  type: CommunicationType;
  direction: "INBOUND" | "OUTBOUND";
  subject?: string;
  content: string;
  attachments?: string[];
  // Email-specific data
  emailData?: {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    messageId?: string;
    threadId?: string;
  };
  // Call-specific data
  callData?: {
    duration?: number; // in minutes
    outcome?: string;
    nextAction?: string;
    transcript?: string;
  };
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

// POST /api/leads/[id]/communications - Add communication to lead
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

    // Check permissions - BD, Admin, and Estimators can add communications
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
    const commData: AddCommunicationData = await request.json();

    // Validate required fields
    if (!commData.type || !commData.direction || !commData.content) {
      return NextResponse.json<LeadApiResponse>(
        {
          success: false,
          error: "Communication type, direction, and content are required",
        },
        { status: 400 }
      );
    }

    // Validate enum values
    if (!Object.values(CommunicationType).includes(commData.type)) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Invalid communication type" },
        { status: 400 }
      );
    }

    if (!["INBOUND", "OUTBOUND"].includes(commData.direction)) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Direction must be INBOUND or OUTBOUND" },
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

    // Check if user has permission to add communications to this lead
    const canAddComm =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?.toString() === user._id.toString());

    if (!canAddComm) {
      return NextResponse.json<LeadApiResponse>(
        {
          success: false,
          error: "Access denied to add communications to this lead",
        },
        { status: 403 }
      );
    }

    // Build communication object
    const communicationData = {
      type: commData.type,
      direction: commData.direction,
      subject: commData.subject?.trim() || "",
      content: commData.content.trim(),
      sentBy: commData.direction === "OUTBOUND" ? user._id : undefined,
      sentAt: new Date(),
      attachments: commData.attachments || [],
      emailData: commData.emailData,
      callData: commData.callData,
    };

    // Add communication using the model method
    lead.addCommunication(communicationData);

    // Save the updated lead
    await lead.save();

    // Return updated lead with populated references
    const updatedLead = await Lead.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email")
      .populate("communications.sentBy", "name email");

    return NextResponse.json<LeadApiResponse>({
      success: true,
      message: "Communication added successfully",
      lead: updatedLead?.toObject(),
    });
  } catch (error) {
    console.error("Error adding communication:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/leads/[id]/communications - Get communications for a lead
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

    // Find the lead
    const lead = await Lead.findById(id)
      .populate("communications.sentBy", "name email")
      .select("communications createdBy assignedEstimator");

    if (!lead) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view communications for this lead
    const canView =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?.toString() === user._id.toString());

    if (!canView) {
      return NextResponse.json<LeadApiResponse>(
        {
          success: false,
          error: "Access denied to view communications for this lead",
        },
        { status: 403 }
      );
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") as CommunicationType | null;

    // Filter communications by type if specified
    let communications = lead.communications || [];
    if (type && Object.values(CommunicationType).includes(type)) {
      communications = communications.filter(
        (comm: { type: CommunicationType }) => comm.type === type
      );
    }

    // Sort by most recent first
    communications.sort(
      (a: { sentAt: Date }, b: { sentAt: Date }) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComms = communications.slice(startIndex, endIndex);

    const totalPages = Math.ceil(communications.length / limit);

    return NextResponse.json({
      success: true,
      communications: paginatedComms,
      pagination: {
        page,
        limit,
        total: communications.length,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching communications:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
