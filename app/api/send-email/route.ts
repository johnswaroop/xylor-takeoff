"use server";
import nodemailer from "nodemailer";

import { NextRequest, NextResponse } from "next/server";

const sendMail = async (email: string, application_id: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log(application_id);
  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Process</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #ffffff;
            color: #333333;
            line-height: 1.6;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e0e0e0;
            background-color: #ffffff;
        }

        .header {
            background-color: #000000;
            color: #ffffff;
            padding: 15px;
            text-align: center;
            font-size: 18px;
        }

        .content {
            padding: 15px;
            font-size: 14px;
            color: #333333;
        }

        .steps {
            margin: 20px 0;
        }

        .step {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background-color: #f9f9f9;
            display: flex;
            align-items: center;
            font-size: 14px;
        }

        .step-number {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 14px;
            font-weight: bold;
            color: #ffffff;
            background-color: #000000;
            margin-right: 10px;
        }

        .step.highlight {
            background-color: #eaffea;
            border-color: #28a745;
        }

        .step.highlight .step-number {
            background-color: #28a745;
        }

        .footer {
            padding: 15px;
            background-color: #f8f8f8;
            text-align: center;
            font-size: 12px;
            color: #666666;
        }

        @media (max-width: 480px) {
            .header {
                font-size: 16px;
                padding: 10px;
            }

            .content {
                font-size: 12px;
                padding: 10px;
            }

            .step {
                font-size: 12px;
                padding: 8px;
            }

            .step-number {
                width: 25px;
                height: 25px;
                font-size: 12px;
            }

            .footer {
                font-size: 10px;
                padding: 10px;
            }
        }
    </style>
</head>

<body>
    <table role="presentation">
        <tr>
            <td class="header">
                Application Process
            </td>
        </tr>
        <tr>
            <td class="content">
                <p>Dear Applicant,</p>

                <p>Your application is progressing through the following steps:</p>

                <div class="steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <p><strong>Application Created:</strong> Your application has been successfully created.</p>
                    </div>

                    <div class="step highlight">
                        <div class="step-number">2</div>
                        <p><strong>Application Sent for Final Decision:</strong> Your application is currently under
                            review for a final decision.</p>
                    </div>

                    <div class="step">
                        <div class="step-number">3</div>
                        <p><strong>Decision Made:</strong> A decision has been made on your application.</p>
                    </div>
                </div>

                <p>If you have any questions, please contact our support team.</p>

                <p>Best regards,<br>Verification Team</p>
            </td>
        </tr>
        <tr>
            <td class="footer">
                © 2023 Your Company Name. All rights reserved.<br>
                Need help? <a href="mailto:support@yourcompany.com">Contact Support</a>
            </td>
        </tr>
    </table>
</body>

</html>
    `;

  const mailOptions = {
    from: `"KMS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "KMS - Notification",
    html: html,
  };

  return new Promise((res, rej) => {
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        return rej();
      }
      console.log("Message sent: %s", info.messageId);

      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      return res(true);
    });
  });
};

// POST /api/send-email - Send email
export async function POST(request: NextRequest) {
  try {
    const { email, applicationId } = await request.json();

    if (!email || !applicationId) {
      return NextResponse.json(
        { success: false, error: "Email and applicationId are required" },
        { status: 400 }
      );
    }

    const result = await sendMail(email, applicationId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
