import { NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/User";
import Lead from "@/lib/models/Lead";
import { UserRole } from "@/lib/types/user-roles";
import { LeadStatus } from "@/lib/types/lead-status";
import { ProjectType } from "@/lib/types/project-types";

// POST /api/seed - Create test data for development
export async function POST() {
  try {
    await connect();

    // Create test users
    const testUsers = [
      {
        _id: "507f1f77bcf86cd799439011", // The ID we're using in the dashboard
        name: "Test BD User",
        email: "bd@test.com",
        roles: [UserRole.BD],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "507f1f77bcf86cd799439012",
        name: "Test Estimator",
        email: "estimator@test.com",
        roles: [UserRole.ESTIMATOR],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "507f1f77bcf86cd799439013",
        name: "Test Admin",
        email: "admin@test.com",
        roles: [UserRole.ADMIN],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Clear existing test users and create new ones
    await User.deleteMany({ _id: { $in: testUsers.map((u) => u._id) } });

    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }

    // Create test leads
    const testLeads = [
      {
        companyName: "Acme Construction Co.",
        contactPerson: "John Smith",
        email: "john@acme.com",
        phone: "555-0123",
        address: "123 Construction St, Builder City, BC 12345",
        projectType: ProjectType.COMMERCIAL_NEW_BUILD,
        initialNotes: "Large commercial project, needs detailed estimates",
        createdBy: "507f1f77bcf86cd799439011",
        assignedEstimator: "507f1f77bcf86cd799439012",
        status: LeadStatus.ESTIMATION_IN_PROGRESS,
        isDraft: false,
        hasQualifierForm: true,
        statusHistory: [],
        communications: [],
        notes: [],
      },
      {
        companyName: "Modern Homes LLC",
        contactPerson: "Sarah Wilson",
        email: "sarah@modernhomes.com",
        phone: "555-0124",
        address: "456 Residential Ave, Home Town, HT 67890",
        projectType: ProjectType.RESIDENTIAL_NEW_BUILD,
        initialNotes: "Luxury residential development",
        createdBy: "507f1f77bcf86cd799439011",
        assignedEstimator: null,
        status: LeadStatus.AWAITING_QUALIFIER_RESPONSE,
        isDraft: false,
        hasQualifierForm: true,
        statusHistory: [],
        communications: [],
        notes: [],
      },
      {
        companyName: "City Infrastructure Corp",
        contactPerson: "Mike Johnson",
        email: "mike@cityinfra.com",
        phone: "555-0125",
        address: "789 Municipal Blvd, Metro City, MC 13579",
        projectType: ProjectType.COMMERCIAL_RENOVATION,
        initialNotes: "Municipal building renovation project",
        createdBy: "507f1f77bcf86cd799439011",
        assignedEstimator: "507f1f77bcf86cd799439012",
        status: LeadStatus.ESTIMATE_APPROVED,
        isDraft: false,
        hasQualifierForm: true,
        statusHistory: [],
        communications: [],
        notes: [],
      },
    ];

    // Clear existing test leads and create new ones
    await Lead.deleteMany({
      email: { $in: testLeads.map((l) => l.email) },
    });

    for (const leadData of testLeads) {
      const lead = new Lead(leadData);

      // Add initial status change
      lead.addStatusChange(
        leadData.status,
        leadData.createdBy,
        "Lead created",
        "Initial lead creation"
      );

      await lead.save();
    }

    return NextResponse.json({
      success: true,
      message: "Test data created successfully",
      data: {
        users: testUsers.length,
        leads: testLeads.length,
      },
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed data" },
      { status: 500 }
    );
  }
}

// GET /api/seed - Check if test data exists
export async function GET() {
  try {
    await connect();

    const userCount = await User.countDocuments({
      _id: {
        $in: [
          "507f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439012",
          "507f1f77bcf86cd799439013",
        ],
      },
    });

    const leadCount = await Lead.countDocuments({
      createdBy: "507f1f77bcf86cd799439011",
    });

    return NextResponse.json({
      success: true,
      data: {
        users: userCount,
        leads: leadCount,
        hasTestData: userCount > 0 && leadCount > 0,
      },
    });
  } catch (error) {
    console.error("Error checking seed data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check seed data" },
      { status: 500 }
    );
  }
}
