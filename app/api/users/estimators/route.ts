import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/User";
import { UserRole } from "@/lib/types/user-roles";

// Helper function to authenticate and get user from request headers
async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;

  try {
    await connect();
    const user = await User.findById(userId).select("_id name email roles");
    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

// Helper function to check if user has required roles
function hasRequiredRole(
  user: { roles: UserRole[] },
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.some((role) => user.roles.includes(role));
}

interface EstimatorResponse {
  success: boolean;
  estimators?: Array<{
    _id: string;
    name: string;
    email: string;
    company?: string;
  }>;
  error?: string;
}

// GET /api/users/estimators - Get all users with ESTIMATOR role
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<EstimatorResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only BD and Admin can view estimators
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<EstimatorResponse>(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    // Find all users with ESTIMATOR role
    const estimators = await User.find({
      roles: { $in: [UserRole.ESTIMATOR] },
    })
      .select("_id name email company")
      .sort({ name: 1 })
      .lean();

    // Transform the response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const estimatorsList = estimators.map((estimator: any) => ({
      _id: estimator._id.toString(),
      name: estimator.name,
      email: estimator.email,
      company: estimator.company || "",
    }));

    return NextResponse.json<EstimatorResponse>({
      success: true,
      estimators: estimatorsList,
    });
  } catch (error) {
    console.error("Error fetching estimators:", error);
    return NextResponse.json<EstimatorResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
