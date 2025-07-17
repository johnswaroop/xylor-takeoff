import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import {
  DashboardActivityResponse,
  ActivityItem,
  ActivityType,
} from "@/lib/types/dashboard";
import { UserRole } from "@/lib/types/user-roles";
import { LEAD_STATUS_LABELS } from "@/lib/types/lead-status";

// Helper function to verify authentication and get user
async function getAuthenticatedUser(request: NextRequest) {
  // In a real app, you'd verify JWT token from headers
  // For now, we'll get user ID from headers (temporary)
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
  user: { roles?: UserRole[] } | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: UserRole) => allowedRoles.includes(role));
}

// GET /api/bd/dashboard/activity - Get recent activity feed
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<DashboardActivityResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only BD and Admin can view dashboard activity
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<DashboardActivityResponse>(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query based on user role - BD sees own leads, Admin sees all
    const query: Record<string, string | boolean | object> = {};
    if (
      user.roles.includes(UserRole.BD) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      query.createdBy = user._id;
    }

    // Get leads with populated user data and recent activity
    const leads = (await Lead.find(query)
      .populate("createdBy", "name")
      .populate("assignedEstimator", "name")
      .sort({ updatedAt: -1 })
      .limit(limit * 2) // Get more leads to extract activities from
      .lean()) as Array<Record<string, any>>;

    // Collect activities from leads
    const activities: ActivityItem[] = [];

    for (const lead of leads) {
      // Add lead creation activity
      activities.push({
        id: `lead-created-${lead._id}`,
        type: ActivityType.LEAD_CREATED,
        title: "New lead created",
        description: `Lead created for ${lead.companyName}`,
        timestamp: lead.createdAt,
        leadId: lead._id.toString(),
        leadCompanyName: lead.companyName,
        userId: lead.createdBy._id.toString(),
        userName: lead.createdBy.name,
      });

      // Add status change activities from statusHistory
      if (lead.statusHistory && lead.statusHistory.length > 0) {
        for (const statusChange of lead.statusHistory) {
          const statusLabel =
            LEAD_STATUS_LABELS[
              statusChange.toStatus as keyof typeof LEAD_STATUS_LABELS
            ] || statusChange.toStatus;
          activities.push({
            id: `status-${lead._id}-${statusChange._id}`,
            type: ActivityType.STATUS_CHANGE,
            title: "Status updated",
            description: `${lead.companyName} status changed to ${statusLabel}`,
            timestamp: statusChange.changedAt,
            leadId: lead._id.toString(),
            leadCompanyName: lead.companyName,
            userId: statusChange.changedBy.toString(),
            userName: "User", // We'd need to populate this properly in a real app
          });
        }
      }

      // Add communication activities
      if (lead.communications && lead.communications.length > 0) {
        for (const comm of lead.communications) {
          const isOutbound = comm.direction === "OUTBOUND";
          activities.push({
            id: `comm-${lead._id}-${comm._id}`,
            type: isOutbound
              ? ActivityType.COMMUNICATION_SENT
              : ActivityType.COMMUNICATION_RECEIVED,
            title: `${comm.type} ${isOutbound ? "sent" : "received"}`,
            description: `${comm.type} ${
              isOutbound ? "sent to" : "received from"
            } ${lead.companyName}${comm.subject ? ": " + comm.subject : ""}`,
            timestamp: comm.sentAt,
            leadId: lead._id.toString(),
            leadCompanyName: lead.companyName,
            userId: comm.sentBy?.toString(),
            userName: isOutbound ? "BD User" : lead.contactPerson,
          });
        }
      }

      // Add note activities
      if (lead.notes && lead.notes.length > 0) {
        for (const note of lead.notes) {
          if (!note.isPrivate) {
            // Only show non-private notes in activity feed
            activities.push({
              id: `note-${lead._id}-${note._id}`,
              type: ActivityType.NOTE_ADDED,
              title: "Note added",
              description: `Note added to ${
                lead.companyName
              }: ${note.content.substring(0, 100)}${
                note.content.length > 100 ? "..." : ""
              }`,
              timestamp: note.createdAt,
              leadId: lead._id.toString(),
              leadCompanyName: lead.companyName,
              userId: note.createdBy.toString(),
              userName: "BD User",
            });
          }
        }
      }

      // Add estimator assignment activity
      if (lead.assignedEstimator) {
        activities.push({
          id: `estimator-assigned-${lead._id}`,
          type: ActivityType.ESTIMATOR_ASSIGNED,
          title: "Estimator assigned",
          description: `${lead.assignedEstimator.name} assigned to ${lead.companyName}`,
          timestamp: lead.updatedAt, // Approximation - in real app we'd track assignment date
          leadId: lead._id.toString(),
          leadCompanyName: lead.companyName,
          userId: lead.createdBy._id.toString(),
          userName: lead.createdBy.name,
        });
      }
    }

    // Sort activities by timestamp (most recent first) and limit
    const sortedActivities = activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);

    return NextResponse.json<DashboardActivityResponse>({
      success: true,
      activities: sortedActivities,
    });
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);
    return NextResponse.json<DashboardActivityResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
