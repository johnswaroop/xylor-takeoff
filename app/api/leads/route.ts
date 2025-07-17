import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { LeadApiResponse, CreateLeadFormData } from "@/lib/types/lead";
import { LeadStatus } from "@/lib/types/lead-status";
import { UserRole } from "@/lib/types/user-roles";
import {
  sendQualificationFormEmail,
  scheduleQualificationFormEmail,
  LeadEmailData,
} from "@/lib/services/email-service";
import { PROJECT_TYPE_LABELS } from "@/lib/types/project-types";

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
function hasRequiredRole(user: any, allowedRoles: UserRole[]): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: UserRole) => allowedRoles.includes(role));
}

// GET /api/leads - Get leads with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - BD, Admin can view leads, Estimator can view assigned leads
    if (
      !hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN, UserRole.ESTIMATOR])
    ) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const projectType = searchParams.get("projectType");
    const assignedEstimator = searchParams.get("assignedEstimator");
    const isDraft = searchParams.get("isDraft");
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Build query based on user role
    let query: any = {};

    // If estimator, only show assigned leads
    if (
      user.roles.includes(UserRole.ESTIMATOR) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      query.assignedEstimator = user._id;
    }

    // If BD, show own leads unless admin
    if (
      user.roles.includes(UserRole.BD) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      query.createdBy = user._id;
    }

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

    if (assignedEstimator) {
      query.assignedEstimator = assignedEstimator;
    }

    if (isDraft !== null) {
      query.isDraft = isDraft === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
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

    return NextResponse.json<LeadApiResponse>({
      success: true,
      leads: leads as any[],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only BD and Admin can create leads
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "Only BD and Admin users can create leads" },
        { status: 403 }
      );
    }

    await connect();

    // Parse request body
    const formData: CreateLeadFormData = await request.json();

    // Validate required fields
    if (
      !formData.companyName ||
      !formData.contactPerson ||
      !formData.email ||
      !formData.projectType
    ) {
      return NextResponse.json<LeadApiResponse>(
        {
          success: false,
          error: "Missing required fields",
          details: [
            "Company name, contact person, email, and project type are required",
          ],
        },
        { status: 400 }
      );
    }

    // Validate assigned estimator if provided
    if (formData.assignedEstimatorId) {
      const estimator = await User.findById(formData.assignedEstimatorId);
      if (!estimator || !estimator.roles.includes(UserRole.ESTIMATOR)) {
        return NextResponse.json<LeadApiResponse>(
          { success: false, error: "Invalid estimator assignment" },
          { status: 400 }
        );
      }
    }

    // No form template validation needed - using default form

    // Create lead object
    const leadData = {
      // Basic Information
      companyName: formData.companyName.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone?.trim() || "",
      address: formData.address?.trim() || "",
      projectType: formData.projectType,
      initialNotes: formData.initialNotes?.trim() || "",

      // Assignment & Management
      createdBy: user._id,
      assignedEstimator: formData.assignedEstimatorId || undefined,
      status: formData.saveAsDraft
        ? LeadStatus.ADD_LEAD
        : LeadStatus.ATTACH_QUALIFIERS,
      isDraft: formData.saveAsDraft || false,

      // Form & Communication
      hasQualifierForm: formData.useDefaultForm || false,

      // Initialize arrays
      statusHistory: [],
      communications: [],
      notes: [],
    };

    // Create and save lead
    const newLead = new Lead(leadData);

    // Add initial status change
    newLead.addStatusChange(
      newLead.status,
      user._id.toString(),
      "Lead created",
      `Lead created ${
        formData.saveAsDraft ? "as draft" : "and ready for qualifier attachment"
      }`
    );

    const savedLead = await newLead.save();

    // Populate user references for response
    await savedLead.populate("createdBy", "name email");
    if (savedLead.assignedEstimator) {
      await savedLead.populate("assignedEstimator", "name email");
    }

    // Send qualification form email if not a draft and has qualifier form
    let emailResult = null;
    if (!formData.saveAsDraft && (formData.useDefaultForm || false)) {
      const emailData: LeadEmailData = {
        leadId: savedLead._id.toString(),
        companyName: savedLead.companyName,
        contactPerson: savedLead.contactPerson,
        email: savedLead.email,
        projectType:
          PROJECT_TYPE_LABELS[savedLead.projectType] || savedLead.projectType,
        customSubject: formData.emailSubject,
        customMessage: formData.emailMessage,
      };

      try {
        if (formData.scheduleDateTime) {
          // Schedule email for later
          emailResult = await scheduleQualificationFormEmail(
            emailData,
            formData.scheduleDateTime
          );
        } else if (formData.sendImmediately !== false) {
          // Send immediately (default behavior)
          emailResult = await sendQualificationFormEmail(emailData);
        }

        // Log email communication in lead
        if (emailResult?.success) {
          savedLead.addCommunication({
            type: "EMAIL",
            direction: "OUTBOUND",
            subject:
              emailData.customSubject ||
              `Project Qualification Form - ${emailData.companyName}`,
            content: `Qualification form email sent to ${emailData.email}`,
            sentBy: user._id,
            sentAt: formData.scheduleDateTime || new Date(),
            emailData: {
              to: [emailData.email],
              messageId: emailResult.messageId || undefined,
            },
          });
          await savedLead.save();
        }
      } catch (emailError) {
        console.error("Failed to send qualification email:", emailError);
        // Continue with lead creation even if email fails
        // Email failure shouldn't block lead creation
      }
    }

    const response: LeadApiResponse = {
      success: true,
      message: `Lead ${
        formData.saveAsDraft ? "saved as draft" : "created"
      } successfully`,
      lead: savedLead.toObject() as any,
    };

    // Add email status to response if email was attempted
    if (emailResult) {
      response.emailSent = emailResult.success;
      if (!emailResult.success) {
        response.emailError = emailResult.error;
      }
    }

    return NextResponse.json<LeadApiResponse>(response, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);

    // Handle mongoose validation errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      const validationError = error as any;
      const validationErrors = Object.values(validationError.errors).map(
        (err: any) => err.message
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

    // Handle duplicate key errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json<LeadApiResponse>(
        { success: false, error: "A lead with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json<LeadApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
