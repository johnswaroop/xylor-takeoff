import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { UserRole } from "@/lib/types/user-roles";
import * as Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  date: Date;
  text: string;
  html?: string;
  messageId: string;
  direction: "INBOUND" | "OUTBOUND";
}

// Helper function to verify authentication and get user
async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return null;
  }

  await connect();
  const user = await User.findById(userId);
  return user;
}

// Helper function to check required roles
function hasRequiredRole(
  user: { roles: UserRole[] },
  roles: UserRole[]
): boolean {
  return user.roles.some((role: UserRole) => roles.includes(role));
}

// Connect to IMAP
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connectToImap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imap = new (Imap as any)({
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => {
      resolve(imap);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imap.once("error", (err: any) => {
      reject(err);
    });

    imap.connect();
  });
};

// Parse email message
const parseEmailMessage = async (
  message: string | Buffer
): Promise<EmailMessage | null> => {
  return new Promise((resolve) => {
    simpleParser(message, (err: Error | null, parsed: ParsedMail) => {
      if (err) {
        console.error("Error parsing email:", err);
        resolve(null);
        return;
      }

      // Extract text content
      const htmlText = typeof parsed.html === "string" ? parsed.html : "";
      const text = parsed.text || htmlText.replace(/<[^>]*>/g, "") || "";

      // Extract from email address
      const fromAddress =
        typeof parsed.from === "object" && parsed.from.value
          ? parsed.from.value[0]?.address || ""
          : "";

      // Extract to email addresses
      const toAddresses: string[] = [];
      if (parsed.to && typeof parsed.to === "object" && "value" in parsed.to) {
        parsed.to.value.forEach((addr) => {
          if (addr.address) toAddresses.push(addr.address);
        });
      }

      const emailMessage: EmailMessage = {
        from: fromAddress,
        to: toAddresses,
        subject: parsed.subject || "",
        date: parsed.date || new Date(),
        text: text.trim(),
        html: htmlText,
        messageId: parsed.messageId || "",
        direction: "INBOUND", // Will be determined later
      };

      console.log("📧 Lead email detected:", {
        from: emailMessage.from,
        to: emailMessage.to,
        subject: emailMessage.subject,
        date: emailMessage.date.toISOString(),
        textLength: emailMessage.text.length,
        messageId: emailMessage.messageId,
      });

      resolve(emailMessage);
    });
  });
};

// Search emails in a specific folder
const searchEmailsInFolder = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imap: any,
  folderName: string,
  clientEmail: string,
  systemEmail: string,
  afterDate?: Date
): Promise<EmailMessage[]> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imap.openBox(folderName, true, (err: any) => {
      if (err) {
        console.log(`📂 Could not open folder "${folderName}":`, err.message);
        resolve([]); // Return empty array instead of rejecting
        return;
      }

      console.log(`📂 Searching folder: ${folderName}`);

      // Build search criteria for emails from/to client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchCriteria: any[] = [
        ["OR", ["FROM", clientEmail], ["TO", clientEmail]],
      ];
      if (afterDate) {
        searchCriteria.push(["SINCE", afterDate]);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imap.search(searchCriteria, async (err: any, results: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          console.log(`📪 No emails found for client: ${clientEmail}`);
          resolve([]);
          return;
        }

        console.log(
          `📨 Found ${results.length} emails for client: ${clientEmail}`
        );

        const fetch = imap.fetch(results, {
          bodies: "",
          markSeen: false,
        });

        const emails: EmailMessage[] = [];
        const parsePromises: Promise<void>[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch.on("message", (msg: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          msg.on("body", (stream: any) => {
            let buffer = "";

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stream.on("data", (chunk: any) => {
              buffer += chunk.toString("utf8");
            });

            const parsePromise = new Promise<void>(async (resolveMsg) => {
              stream.once("end", async () => {
                const parsedEmail = await parseEmailMessage(buffer);
                if (parsedEmail) {
                  // Determine direction
                  if (parsedEmail.from === clientEmail) {
                    parsedEmail.direction = "INBOUND";
                    console.log(
                      `📥 INBOUND email from client: ${parsedEmail.subject}`
                    );
                  } else if (parsedEmail.to.includes(clientEmail)) {
                    parsedEmail.direction = "OUTBOUND";
                    console.log(
                      `📤 OUTBOUND email to client: ${parsedEmail.subject}`
                    );
                  }

                  // Only include emails specifically between system and client
                  const isClientToSystem =
                    parsedEmail.from === clientEmail &&
                    parsedEmail.to.includes(systemEmail);
                  const isSystemToClient =
                    parsedEmail.from === systemEmail &&
                    parsedEmail.to.includes(clientEmail);

                  if (isClientToSystem || isSystemToClient) {
                    console.log(
                      `✅ Email accepted for lead: ${
                        parsedEmail.from
                      } → ${parsedEmail.to.join(", ")} - ${parsedEmail.subject}`
                    );
                    emails.push(parsedEmail);
                  } else {
                    console.log(
                      `🚫 Email filtered out (not between BD and client): ${
                        parsedEmail.from
                      } → ${parsedEmail.to.join(", ")}`
                    );
                  }
                }
                resolveMsg();
              });
            });

            parsePromises.push(parsePromise);
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch.once("error", (err: any) => {
          reject(err);
        });

        fetch.once("end", async () => {
          // Wait for all emails to be parsed
          await Promise.all(parsePromises);

          // Sort emails by date (newest first)
          emails.sort((a, b) => b.date.getTime() - a.date.getTime());

          console.log(`📬 Total lead emails processed: ${emails.length}`);
          if (emails.length > 0) {
            console.log(
              "📋 Lead emails summary:",
              emails.map((email) => ({
                direction: email.direction,
                from: email.from,
                subject: email.subject,
                date: email.date.toISOString(),
              }))
            );
          }

          resolve(emails);
        });
      });
    });
  });
};

// Fetch emails for specific lead from multiple folders
const fetchLeadEmails = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imap: any,
  clientEmail: string,
  systemEmail: string,
  afterDate?: Date
): Promise<EmailMessage[]> => {
  console.log(`🔍 Searching multiple folders for emails with ${clientEmail}`);

  // List of folders to search (common email folder names)
  const foldersToSearch = [
    "INBOX", // Received emails
    "Sent", // Sent emails (Gmail, Outlook)
    "[Gmail]/Sent Mail", // Gmail sent folder
    "Sent Items", // Outlook sent folder
    "Sent Messages", // Some providers
    "OUTBOX", // Outgoing emails
  ];

  const allEmails: EmailMessage[] = [];

  // Search each folder
  for (const folder of foldersToSearch) {
    try {
      const folderEmails = await searchEmailsInFolder(
        imap,
        folder,
        clientEmail,
        systemEmail,
        afterDate
      );

      if (folderEmails.length > 0) {
        console.log(
          `📧 Found ${folderEmails.length} emails in folder: ${folder}`
        );
        allEmails.push(...folderEmails);
      }
    } catch (error) {
      console.log(`⚠️ Error searching folder "${folder}":`, error);
      // Continue with other folders even if one fails
    }
  }

  // Remove duplicates based on messageId
  const uniqueEmails = allEmails.filter(
    (email: EmailMessage, index: number, self: EmailMessage[]) =>
      index ===
      self.findIndex((e: EmailMessage) => e.messageId === email.messageId)
  );

  // Sort by date (newest first)
  uniqueEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

  console.log(
    `📬 Total unique emails across all folders: ${uniqueEmails.length}`
  );

  return uniqueEmails;
};

// Note: Database storage removed - returning only live IMAP emails

// GET /api/leads/[id]/emails - Fetch emails for specific lead
export async function GET(
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

    // Check permissions
    if (
      !hasRequiredRole(user, [UserRole.BD, UserRole.ADMIN, UserRole.ESTIMATOR])
    ) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connect();

    const { id } = await params;

    // Find the lead
    const lead = await Lead.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email")
      .populate("communications.sentBy", "name email");

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view emails for this lead
    const canView =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.BD) &&
        lead.createdBy._id.toString() === user._id.toString()) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?._id.toString() === user._id.toString());

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied to view emails for this lead",
        },
        { status: 403 }
      );
    }

    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: "Email credentials not configured" },
        { status: 500 }
      );
    }

    try {
      // Connect to IMAP
      const imap = await connectToImap();
      console.log(
        `🔌 Connected to IMAP for lead: ${
          lead.companyName || lead.contactPerson
        }`
      );

      // Fetch emails between system and client
      console.log(
        `🔍 Fetching emails between BD (${
          process.env.EMAIL_USER
        }) and client (${lead.email}) since ${new Date(
          lead.createdAt
        ).toISOString()}`
      );

      const emails = await fetchLeadEmails(
        imap,
        lead.email,
        process.env.EMAIL_USER!,
        new Date(lead.createdAt)
      );

      // Close IMAP connection
      imap.end();
      console.log("🔚 IMAP connection closed for lead");

      console.log(
        `📬 Returning ${emails.length} live emails from IMAP (${
          emails.filter((e) => e.direction === "INBOUND").length
        } inbound, ${
          emails.filter((e) => e.direction === "OUTBOUND").length
        } outbound)`
      );

      // Convert fetched emails to expected format (skip database storage)
      const emailCommunications = emails.map((email, index) => ({
        _id: email.messageId || `temp-${index}`, // Use messageId or temp ID
        direction: email.direction,
        subject: email.subject,
        content: email.text,
        sentAt: email.date.toISOString(),
        sentBy:
          email.direction === "OUTBOUND"
            ? {
                _id: "system",
                name: "BD System",
                email: process.env.EMAIL_USER || "",
              }
            : undefined,
        emailData: {
          messageId: email.messageId,
          to: email.to,
          html: email.html,
        },
        fullContent: {
          text: email.text,
          html: email.html,
          from: email.from,
          to: email.to,
        },
      }));

      return NextResponse.json({
        success: true,
        emails: emailCommunications,
        count: emailCommunications.length,
        leadId: lead._id,
        clientEmail: lead.email,
        source: "live-imap", // Indicate this is live data
      });
    } catch (emailError) {
      console.error("Email fetching error:", emailError);

      // Return empty array if IMAP fails (no database fallback)
      return NextResponse.json({
        success: false,
        emails: [],
        count: 0,
        leadId: lead._id,
        clientEmail: lead.email,
        error: "Could not fetch emails from server",
        details:
          emailError instanceof Error ? emailError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error fetching lead emails:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/emails - Manually sync emails for specific lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // This is the same as GET but forces a fresh sync
  return GET(request, { params });
}
