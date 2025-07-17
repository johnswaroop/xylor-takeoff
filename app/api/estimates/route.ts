import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import mongoose from "mongoose";

// Type definitions for the estimation data
interface EstimateElement {
  name?: string;
  type?: string;
  totalLength?: number;
  totalArea?: number;
  count?: number;
  price?: number;
  metricType?: string;
}

interface ScaleDimensions {
  width?: number;
  height?: number;
  standard?: string;
  orientation?: string;
}

interface EstimateRequestBody {
  leadId: string;
  estimateData?: Record<string, unknown>;
  pdfBase64?: string;
  htmlContent?: string;
  projectName?: string;
  clientName?: string;
  elements?: EstimateElement[];
  subtotal?: number;
  total?: number;
  scale?: Record<string, unknown>;
  dimensions?: ScaleDimensions;
  timestamp?: number;
}

export async function POST(request: NextRequest) {
  try {
    await connect();

    const body: EstimateRequestBody = await request.json();
    const {
      leadId,
      estimateData,
      pdfBase64,
      htmlContent,
      projectName,
      clientName,
      elements,
      subtotal,
      total,
      scale,
      dimensions,
      timestamp,
    } = body;

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    // Check if lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Debug logging
    console.log("Elements received:", JSON.stringify(elements, null, 2));

    // Create estimation data as a flexible object
    const estimationData = {
      leadId: new mongoose.Types.ObjectId(leadId),
      estimatorId: lead.assignedEstimator || null,
      projectName: projectName || lead.companyName || "Untitled Project",
      clientName: clientName || lead.contactPerson || "Client",
      estimateData: estimateData || {},
      pdfData: pdfBase64 || null,
      htmlData: htmlContent || null,

      costBreakdown: {
        materials: 0,
        labor: 0,
        equipment: 0,
        overhead: 0,
        profit: 0,
        total: total || 0,
        subtotal: subtotal || 0,
        elements: elements
          ? elements.map((el: EstimateElement) => ({
              name: el.name || "Unnamed Element",
              type: el.type || "custom",
              quantity: el.totalLength || el.totalArea || el.count || 0,
              unit:
                el.metricType === "length"
                  ? "m"
                  : el.metricType === "area"
                  ? "m²"
                  : el.metricType === "count"
                  ? "units"
                  : "units",
              unitPrice: el.price || 0,
              totalPrice:
                (el.totalLength || el.totalArea || el.count || 0) *
                (el.price || 0),
              metricType: el.metricType || "count",
            }))
          : [],
        breakdown: [],
      },

      timeline: {
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalDuration: 30,
        phases: [],
      },

      confidence: "MEDIUM",
      notes: `Estimate for ${projectName || lead.companyName || "project"}`,
      attachments: [
        ...(pdfBase64 ? [`estimate_${Date.now()}.pdf`] : []),
        ...(htmlContent ? [`estimate_${Date.now()}.html`] : []),
      ],
      status: "COMPLETED", // Use string instead of enum to avoid type conflicts

      metadata: {
        scale: scale || null,
        dimensions: dimensions || null,
        originalTimestamp: timestamp || Date.now(),
        elementsCount: elements?.length || 0,
        totalAmount: total || 0,
      },

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(
      "Final estimation data:",
      JSON.stringify(estimationData, null, 2)
    );

    // Assign estimation data to lead document with proper typing
    Object.assign(lead, { estimationData });

    // Mark the lead as updated
    lead.updatedAt = new Date();

    await lead.save();

    // Create response data
    const estimateRecord = {
      leadId,
      projectName: lead.estimationData.projectName,
      clientName: lead.estimationData.clientName,
      estimateData: lead.estimationData.estimateData,
      pdfData: lead.estimationData.pdfData,
      htmlData: lead.estimationData.htmlData,
      costBreakdown: lead.estimationData.costBreakdown,
      timeline: lead.estimationData.timeline,
      metadata: lead.estimationData.metadata,
      createdAt: lead.estimationData.createdAt,
    };

    return NextResponse.json({
      success: true,
      estimateId: lead._id,
      message: "Estimate saved successfully",
      data: estimateRecord,
    });
  } catch (error) {
    console.error("Error saving estimate:", error);
    return NextResponse.json(
      {
        error: "Failed to save estimate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve estimates
export async function GET(request: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    if (leadId) {
      // Get specific lead's estimation data
      const lead = await Lead.findById(leadId).populate(
        "assignedEstimator",
        "name email"
      );
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          leadId: lead._id,
          estimationData: lead.estimationData || null,
          leadInfo: {
            companyName: lead.companyName,
            contactPerson: lead.contactPerson,
            email: lead.email,
            projectType: lead.projectType,
            status: lead.status,
          },
        },
      });
    } else {
      // Get all leads with estimation data
      const leads = await Lead.find({
        estimationData: { $exists: true, $ne: null },
      })
        .populate("assignedEstimator", "name email")
        .select(
          "companyName contactPerson email projectType status estimationData createdAt updatedAt"
        )
        .sort({ updatedAt: -1 });

      return NextResponse.json({
        success: true,
        data: leads,
        count: leads.length,
      });
    }
  } catch (error) {
    console.error("Error retrieving estimates:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve estimates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
