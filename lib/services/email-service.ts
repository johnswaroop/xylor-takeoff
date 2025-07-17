import nodemailer from "nodemailer";
import { generateQualificationFormLink } from "@/lib/utils/form-links";

export interface LeadEmailData {
  leadId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  projectType: string;
  customSubject?: string;
  customMessage?: string;
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

const createQualificationEmailTemplate = (data: LeadEmailData) => {
  const formLink = generateQualificationFormLink(data.leadId);

  const defaultSubject = `Project Qualification Form - ${data.companyName}`;
  const defaultMessage = `Dear ${data.contactPerson},

Thank you for your interest in our construction estimation services. To provide you with an accurate and detailed estimate for your ${data.projectType.toLowerCase()} project, we need some additional information about your requirements.

Please complete our qualification form by clicking the link below. This will help us better understand your project scope and provide you with the most accurate estimate possible.`;

  const subject = data.customSubject || defaultSubject;
  const personalMessage = data.customMessage || defaultMessage;

  return {
    subject,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Qualification Form</title>
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
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #374151;
        }
        
        .message {
            font-size: 15px;
            margin-bottom: 30px;
            color: #6b7280;
            white-space: pre-line;
        }
        
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px 0;
            transition: transform 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
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
        
        .help-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #fef3c7;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
        }
        
        .help-section p {
            margin: 0;
            font-size: 14px;
            color: #92400e;
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
            
            .cta-button {
                padding: 14px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Project Qualification Form</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                ${personalMessage}
            </div>
            
            <div class="project-info">
                <h3>Project Details</h3>
                <div class="info-item">
                    <span class="info-label">Company:</span> ${data.companyName}
                </div>
                <div class="info-item">
                    <span class="info-label">Contact:</span> ${data.contactPerson}
                </div>
                <div class="info-item">
                    <span class="info-label">Project Type:</span> ${data.projectType}
                </div>
            </div>
            
            <div class="cta-section">
                <a href="${formLink}" class="cta-button">Complete Qualification Form</a>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                    This form typically takes 5-10 minutes to complete
                </p>
            </div>
            
            <div class="help-section">
                <p><strong>Need help?</strong> If you have any questions about the form or your project, please don't hesitate to reach out to us directly.</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Form link: <a href="${formLink}" style="color: #3b82f6; word-break: break-all;">${formLink}</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2024 Xylor Construction. All rights reserved.</p>
            <p>Need assistance? <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
    `,
  };
};

export const sendQualificationFormEmail = async (
  data: LeadEmailData
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = createQualificationEmailTemplate(data);

    const mailOptions = {
      from: `"Xylor Construction" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Qualification form email sent successfully:", {
      leadId: data.leadId,
      to: data.email,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send qualification form email:", {
      leadId: data.leadId,
      to: data.email,
      error: error,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
};

export const scheduleQualificationFormEmail = async (
  data: LeadEmailData,
  scheduleTime: Date
): Promise<{ success: boolean; error?: string }> => {
  // For now, we'll implement basic scheduling using setTimeout
  // In production, you'd want to use a proper job queue like Bull/Redis
  const now = new Date();
  const delay = scheduleTime.getTime() - now.getTime();

  if (delay <= 0) {
    return {
      success: false,
      error: "Schedule time must be in the future",
    };
  }

  setTimeout(async () => {
    const result = await sendQualificationFormEmail(data);
    console.log("Scheduled email sent:", result);
  }, delay);

  console.log(
    "Email scheduled for:",
    scheduleTime.toISOString(),
    "Lead ID:",
    data.leadId
  );

  return {
    success: true,
  };
};
