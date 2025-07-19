import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { UserRole } from "@/lib/types/user-roles";
import { LeadStatus } from "@/lib/types/lead-status";
import nodemailer from "nodemailer";

// Helper functions for authentication (same as other endpoints)
const getAuthenticatedUser = async (request: NextRequest) => {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return null;
  }

  try {
    const user = await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
};

interface UserWithRoles {
  _id: string;
  roles: UserRole[];
}

const hasRequiredRole = (
  user: UserWithRoles | null,
  roles: UserRole[]
): boolean => {
  return Boolean(
    user &&
      user.roles &&
      user.roles.some((role: UserRole) => roles.includes(role))
  );
};

interface SendEstimateRequest {
  subject?: string;
  message?: string;
  includeJSON?: boolean;
  includeHTML?: boolean;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

interface LeadForEmail {
  contactPerson: string;
  projectType: string;
  companyName: string;
  email: string;
}

interface EstimateDataForEmail {
  projectName?: string;
  costBreakdown?: {
    total?: number;
  };
}

const createEstimateEmailTemplate = (
  lead: LeadForEmail,
  customMessage: string,
  estimateData: EstimateDataForEmail
) => {
  const defaultMessage = `Dear ${lead.contactPerson},

We are pleased to provide you with the detailed estimate for your ${lead.projectType.toLowerCase()} project at ${
    lead.companyName
  }.

Please find attached:
- Detailed estimate in JSON format (for your records)
- Professional estimate document in HTML format (for viewing/printing)

The estimate includes a comprehensive breakdown of materials, labor, and all associated costs. If you have any questions or would like to discuss any aspects of this estimate, please don't hesitate to contact us.

We look forward to working with you on this project.`;

  const message = customMessage || defaultMessage;

  const projectName =
    estimateData?.projectName || lead.companyName || "Your Project";
  const totalAmount = estimateData?.costBreakdown?.total || 0;

  return {
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Estimate - ${projectName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .estimate-summary {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        
        .estimate-summary h3 {
            margin: 0 0 10px 0;
            color: #047857;
            font-size: 18px;
        }
        
        .amount {
            font-size: 28px;
            font-weight: bold;
            color: #047857;
            margin: 10px 0;
        }
        
        .project-info {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        
        .project-info h3 {
            margin: 0 0 10px 0;
            color: #1f2937;
            font-size: 16px;
        }
        
        .info-item {
            margin: 8px 0;
            color: #6b7280;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
        }
        
        .message-content {
            font-size: 15px;
            margin: 20px 0;
            color: #374151;
            white-space: pre-line;
        }
        
        .attachments {
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }
        
        .attachments h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 16px;
        }
        
        .attachment-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            color: #92400e;
            font-size: 14px;
        }
        
        .footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }
        
        .cta-text {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0 10px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 20px;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .amount {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Project Estimate</h1>
            <p>${projectName}</p>
        </div>
        
        <div class="content">
            <div class="project-info">
                <h3>Project Details</h3>
                <div class="info-item">
                    <span class="info-label">Company:</span> ${lead.companyName}
                </div>
                <div class="info-item">
                    <span class="info-label">Contact:</span> ${
                      lead.contactPerson
                    }
                </div>
                <div class="info-item">
                    <span class="info-label">Project Type:</span> ${
                      lead.projectType
                    }
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span> ${lead.email}
                </div>
            </div>
            
            ${
              totalAmount > 0
                ? `
            <div class="estimate-summary">
                <h3>💰 Estimate Summary</h3>
                <div class="amount">$${totalAmount.toLocaleString()}</div>
                <p style="margin: 0; color: #047857; font-size: 14px;">Total estimated project cost</p>
            </div>
            `
                : ""
            }
            
            <div class="message-content">
                ${message}
            </div>
            
            <div class="attachments">
                <h3>📎 Attached Documents</h3>
                <div class="attachment-item">
                    📄 Detailed estimate data (JSON format)
                </div>
                <div class="attachment-item">
                    🌐 Professional estimate document (HTML format)
                </div>
            </div>
            
            <div class="cta-section">
                <p class="cta-text">
                    Please review the attached documents and contact us if you have any questions or concerns.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2024 Xylor Construction. All rights reserved.</p>
            <p>Need assistance? <a href="mailto:${
              process.env.EMAIL_USER
            }">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
    `,
  };
};

// POST /api/leads/[id]/send-estimate - Send estimate to client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - BD and ADMIN can send estimates
    if (!hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN])) {
      return NextResponse.json(
        { success: false, error: "BD or Admin access required" },
        { status: 403 }
      );
    }

    await connect();

    const { id } = await params;
    const body: SendEstimateRequest = await request.json();
    const { subject, message, includeJSON = true, includeHTML = true } = body;

    // Find the lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if lead has estimation data
    if (!lead.estimationData) {
      return NextResponse.json(
        { success: false, error: "No estimation data found for this lead" },
        { status: 400 }
      );
    }

    // Check if user has permission to send estimates for this lead
    const canSend =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy.toString() === user._id.toString());

    if (!canSend) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied to send estimates for this lead",
        },
        { status: 403 }
      );
    }

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: "Email credentials not configured" },
        { status: 500 }
      );
    }

    try {
      const transporter = createTransporter();
      const emailTemplate = createEstimateEmailTemplate(
        lead,
        message || "",
        lead.estimationData
      );

      const defaultSubject = `Project Estimate - ${lead.companyName}`;
      const emailSubject = subject || defaultSubject;

      // Prepare attachments
      const attachments = [];

      if (includeJSON && lead.estimationData) {
        // Create JSON attachment
        const jsonData = JSON.stringify(lead.estimationData, null, 2);
        const timestamp = new Date().toISOString().split("T")[0];
        attachments.push({
          filename: `estimate_${lead.companyName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}_${timestamp}.json`,
          content: Buffer.from(jsonData, "utf-8"),
          contentType: "application/json",
        });
      }

      if (includeHTML && lead.estimationData?.htmlData) {
        // Create HTML attachment
        const timestamp = new Date().toISOString().split("T")[0];
        attachments.push({
          filename: `estimate_${lead.companyName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}_${timestamp}.html`,
          content: Buffer.from(lead.estimationData.htmlData, "utf-8"),
          contentType: "text/html",
        });
      }

      const mailOptions = {
        from: `"Xylor Construction" <${process.env.EMAIL_USER}>`,
        to: lead.email,
        subject: emailSubject,
        html: emailTemplate.html,
        attachments: attachments,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log("Estimate email sent successfully:", {
        leadId: lead._id,
        to: lead.email,
        messageId: info.messageId,
        attachmentCount: attachments.length,
      });

      // Log email communication in lead
      const emailCommunication = {
        type: "EMAIL",
        direction: "OUTBOUND",
        subject: emailSubject,
        content: `Estimate sent to client with ${attachments.length} attachment(s)`,
        sentBy: user._id,
        sentAt: new Date(),
        emailData: {
          to: [lead.email],
          messageId: info.messageId,
          attachments: attachments.map((att) => att.filename),
        },
      };
      lead.communications.push(emailCommunication);

      // Update lead status to SHARED_WITH_CLIENT
      const statusChange = {
        fromStatus: lead.status,
        toStatus: LeadStatus.SHARED_WITH_CLIENT,
        changedBy: user._id,
        changedAt: new Date(),
        reason: "Estimate sent to client",
        notes: `Estimate email sent to ${lead.email} with ${attachments.length} attachment(s)`,
      };
      lead.statusHistory.push(statusChange);
      lead.status = LeadStatus.SHARED_WITH_CLIENT;

      await lead.save();

      return NextResponse.json({
        success: true,
        message: "Estimate sent successfully",
        messageId: info.messageId,
        attachmentCount: attachments.length,
      });
    } catch (emailError) {
      console.error("Failed to send estimate email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send estimate email",
          details:
            emailError instanceof Error
              ? emailError.message
              : "Unknown email error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in send estimate endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
