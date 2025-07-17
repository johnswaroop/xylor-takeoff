import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { LeadApiResponse } from "@/lib/types/lead";
import { UserRole } from "@/lib/types/user-roles";

// Interface for adding note data
interface AddNoteData {
  content: string;
  isPrivate?: boolean;
  tags?: string[];
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

// POST /api/leads/[id]/notes - Add note to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check permissions - BD, Admin, and Estimators can add notes
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
    const noteData: AddNoteData = await request.json();

    // Validate required fields
    if (!noteData.content || noteData.content.trim().length === 0) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Note content is required" },
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

    // Check if user has permission to add notes to this lead
    const canAddNote =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?.toString() === user._id.toString());

    if (!canAddNote) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Access denied to add notes to this lead" },
        { status: 403 }
      );
    }

    // Add note to the array
    const note = {
      content: noteData.content.trim(),
      createdBy: user._id,
      createdAt: new Date(),
      isPrivate: noteData.isPrivate || false,
      tags: noteData.tags || [],
    };
    lead.notes.push(note);

    // Save the updated lead
    await lead.save();

    // Return updated lead with populated references
    const updatedLead = await Lead.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email")
      .populate("notes.createdBy", "name email");

    return NextResponse.json<LeadApiResponse>({
      success: true,
      message: "Note added successfully",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lead: updatedLead?.toObject() as any,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/leads/[id]/notes - Get notes for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      .populate("notes.createdBy", "name email")
      .select("notes createdBy assignedEstimator");

    if (!lead) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view notes for this lead
    const canView =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?.toString() === user._id.toString());

    if (!canView) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Access denied to view notes for this lead" },
        { status: 403 }
      );
    }

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const includePrivate = searchParams.get("includePrivate") === "true";
    const tag = searchParams.get("tag");

    // Filter notes based on permissions and parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notes = (lead.notes || []) as any[];

    // Filter private notes - only show private notes to the author or admin
    if (!includePrivate || !user.roles.includes(UserRole.ADMIN)) {
      notes = notes.filter(
        (note: { isPrivate: boolean; createdBy: { toString(): string } }) =>
          !note.isPrivate || note.createdBy.toString() === user._id.toString()
      );
    }

    // Filter by tag if specified
    if (tag) {
      notes = notes.filter(
        (note: { tags: string[] }) => note.tags && note.tags.includes(tag)
      );
    }

    // Sort by most recent first
    notes.sort(
      (a: { createdAt: Date }, b: { createdAt: Date }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotes = notes.slice(startIndex, endIndex);

    const totalPages = Math.ceil(notes.length / limit);

    return NextResponse.json({
      success: true,
      notes: paginatedNotes,
      pagination: {
        page,
        limit,
        total: notes.length,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
