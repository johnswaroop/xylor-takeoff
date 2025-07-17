import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { LeadStatus } from "@/lib/types/lead-status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const lead = await Lead.findById(id).select(
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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const lead = await Lead.findById(id);

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
      const statusChange1 = {
        fromStatus: lead.status,
        toStatus: LeadStatus.AWAITING_QUALIFIER_RESPONSE,
        changedBy: lead.createdBy,
        changedAt: new Date(),
        reason: "Client accessed qualification form",
      };
      lead.statusHistory.push(statusChange1);
      lead.status = LeadStatus.AWAITING_QUALIFIER_RESPONSE;
    }

    // Update status to indicate response received
    const statusChange2 = {
      fromStatus: lead.status,
      toStatus: LeadStatus.RESPONSE_RECEIVED,
      changedBy: lead.createdBy,
      changedAt: new Date(),
      reason: "Client submitted qualification form",
    };
    lead.statusHistory.push(statusChange2);
    lead.status = LeadStatus.RESPONSE_RECEIVED;

    // Add communication record
    const communication = {
      type: "EMAIL",
      direction: "INBOUND",
      subject: "Qualification Form Submitted",
      content: `Qualification form submitted with ${
        Object.keys(responses).length
      } responses`,
      sentAt: new Date(submittedAt),
    };
    lead.communications.push(communication);

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
