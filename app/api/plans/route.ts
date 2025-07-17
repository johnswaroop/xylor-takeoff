import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { UserRole } from "@/lib/types/user-roles";

// Interface for authenticated user
interface AuthenticatedUser {
  _id: string;
  roles: UserRole[];
}

// Interface for plan data
interface PlanData {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  projectType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    name: string;
    email: string;
  };
  assignedEstimator: {
    name: string;
    email: string;
  };
  planUrl: string;
  hasFloorPlan: boolean;
  estimationStarted: boolean;
  estimationCompleted: boolean;
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

// Helper function to check user roles
function hasRequiredRole(
  user: AuthenticatedUser,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.some((role) => user.roles.includes(role));
}

// Interface for plan response
interface PlanResponse {
  success: boolean;
  plans?: PlanData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// GET /api/plans - Get leads with floor plans for estimators
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<PlanResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only Estimators and Admins can view plans
    if (!hasRequiredRole(user, [UserRole.ESTIMATOR, UserRole.ADMIN])) {
      return NextResponse.json<PlanResponse>(
        { success: false, error: "Estimator access required" },
        { status: 403 }
      );
    }

    await connect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const projectType = searchParams.get("projectType");
    const sortField = searchParams.get("sortField") || "updatedAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Build query - only show leads assigned to this estimator (unless admin)
    const query: Record<string, unknown> = {};

    if (!user.roles.includes(UserRole.ADMIN)) {
      query.assignedEstimator = user._id;
    }

    // Only show leads that have floor plan PDFs
    query["qualifierFormData.plan-upload"] = {
      $exists: true,
      $ne: null,
    };

    // Apply filters
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (projectType) {
      query.projectType = projectType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortField] = sortDirection === "asc" ? 1 : -1;

    // Execute query with pagination
    const [leads, totalCount] = await Promise.all([
      Lead.find(query)
        .populate("createdBy", "name email")
        .populate("assignedEstimator", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Transform leads to include plan-specific information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plans = leads.map((lead: any) => ({
      _id: lead._id,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      projectType: lead.projectType,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      createdBy: lead.createdBy,
      assignedEstimator: lead.assignedEstimator,
      planUrl: lead.qualifierFormData?.["plan-upload"] || "",
      hasFloorPlan: !!lead.qualifierFormData?.["plan-upload"],
      // Add any estimation-related status flags here
      estimationStarted: lead.estimationData?.startedAt ? true : false,
      estimationCompleted: lead.estimationData?.completedAt ? true : false,
    })) as PlanData[];

    return NextResponse.json<PlanResponse>({
      success: true,
      plans: plans,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json<PlanResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
