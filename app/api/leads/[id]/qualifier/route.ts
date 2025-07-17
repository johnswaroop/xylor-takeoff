import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { LeadStatus } from "@/lib/types/lead-status";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const lead = await Lead.findById(params.id).select(
      "companyName contactPerson email projectType status"
    );

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Only allow access if the lead is in the correct status for qualifier submission
    const allowedStatuses = [
      LeadStatus.SEND_QUALIFIERS,
      LeadStatus.AWAITING_QUALIFIER_RESPONSE,
    ];

    if (!allowedStatuses.includes(lead.status)) {
      return NextResponse.json(
        {
          error: "This qualification form is no longer available",
          status: lead.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: {
        _id: lead._id,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        projectType: lead.projectType,
      },
    });
  } catch (error) {
    console.error("Error fetching lead for qualifier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { responses, submittedAt } = body;

    if (!responses || !submittedAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const lead = await Lead.findById(params.id);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check if lead is in the correct status for submission
    const allowedSubmissionStatuses = [
      LeadStatus.SEND_QUALIFIERS,
      LeadStatus.AWAITING_QUALIFIER_RESPONSE,
    ];

    if (!allowedSubmissionStatuses.includes(lead.status)) {
      return NextResponse.json(
        {
          error:
            "This form has already been submitted or is no longer available",
          status: lead.status,
        },
        { status: 400 }
      );
    }

    // Store the qualification responses
    lead.qualifierFormData = {
      ...responses,
      submittedAt: new Date(submittedAt),
      submittedFrom: {
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    };

    // Handle status transitions based on current status
    if (lead.status === LeadStatus.SEND_QUALIFIERS) {
      // First transition to awaiting response, then to response received
      lead.addStatusChange(
        LeadStatus.AWAITING_QUALIFIER_RESPONSE,
        lead.createdBy,
        "Client accessed qualification form"
      );
    }

    // Update status to indicate response received
    lead.addStatusChange(
      LeadStatus.RESPONSE_RECEIVED,
      lead.createdBy, // System change, using creator as the changer
      "Client submitted qualification form"
    );

    // Add communication record
    lead.addCommunication({
      type: "EMAIL",
      direction: "INBOUND",
      subject: "Qualification Form Submitted",
      content: `Qualification form submitted with ${
        Object.keys(responses).length
      } responses`,
      sentAt: new Date(submittedAt),
    });

    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Qualification form submitted successfully",
      leadId: lead._id,
    });
  } catch (error) {
    console.error("Error submitting qualifier form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
