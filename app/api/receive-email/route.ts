"use server";
import { NextRequest, NextResponse } from "next/server";
import * as Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

interface EmailMessage {
  from: string;
  subject: string;
  date: Date;
  text: string;
}

interface ReceiveEmailRequest {
  filterFromEmail?: string;
  filterAfterTimestamp?: string; // ISO string
  markAsSeen?: boolean;
}

const connectToImap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
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

    imap.once("error", (err: any) => {
      reject(err);
    });

    imap.connect();
  });
};

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

      const emailMessage: EmailMessage = {
        from: fromAddress,
        subject: parsed.subject || "",
        date: parsed.date || new Date(),
        text: text.trim(),
      };

      resolve(emailMessage);
    });
  });
};

const fetchEmails = async (
  imap: any,
  filterFromEmail?: string,
  filterAfterTimestamp?: Date,
  markAsSeen: boolean = false
): Promise<EmailMessage[]> => {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", !markAsSeen, (err: any, _box: any) => {
      if (err) {
        reject(err);
        return;
      }

      // Build search criteria
      const searchCriteria: any[] = ["UNSEEN"];
      if (filterAfterTimestamp) {
        searchCriteria.push(["SINCE", filterAfterTimestamp]);
      }

      imap.search(searchCriteria, async (err: any, results: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          resolve([]);
          return;
        }

        const fetch = imap.fetch(results, {
          bodies: "",
          markSeen: markAsSeen,
        });

        const emails: EmailMessage[] = [];
        const parsePromises: Promise<void>[] = [];

        fetch.on("message", (msg: any, _seqno: any) => {
          msg.on("body", (stream: any, _info: any) => {
            let buffer = "";

            stream.on("data", (chunk: any) => {
              buffer += chunk.toString("utf8");
            });

            const parsePromise = new Promise<void>(async (resolveMsg) => {
              stream.once("end", async () => {
                const parsedEmail = await parseEmailMessage(buffer);
                if (parsedEmail) {
                  // Apply client-side filtering
                  if (filterFromEmail && parsedEmail.from !== filterFromEmail) {
                    resolveMsg();
                    return;
                  }
                  emails.push(parsedEmail);
                }
                resolveMsg();
              });
            });

            parsePromises.push(parsePromise);
          });
        });

        fetch.once("error", (err: any) => {
          reject(err);
        });

        fetch.once("end", async () => {
          // Wait for all emails to be parsed
          await Promise.all(parsePromises);

          // Sort emails by date (newest first)
          emails.sort((a, b) => b.date.getTime() - a.date.getTime());
          resolve(emails);
        });
      });
    });
  });
};

export async function POST(request: NextRequest) {
  try {
    const body: ReceiveEmailRequest = await request.json();
    const { filterFromEmail, filterAfterTimestamp, markAsSeen = false } = body;

    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: "Email credentials not configured" },
        { status: 500 }
      );
    }

    // Parse timestamp if provided
    let afterDate: Date | undefined;
    if (filterAfterTimestamp) {
      afterDate = new Date(filterAfterTimestamp);
      if (isNaN(afterDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid timestamp format" },
          { status: 400 }
        );
      }
    }

    // Connect to IMAP
    const imap = await connectToImap();

    try {
      // Fetch emails
      const emails = await fetchEmails(
        imap,
        filterFromEmail,
        afterDate,
        markAsSeen
      );

      // Close IMAP connection
      imap.end();

      return NextResponse.json({
        success: true,
        emails,
        count: emails.length,
      });
    } catch (fetchError) {
      imap.end();
      throw fetchError;
    }
  } catch (error) {
    console.error("Error receiving emails:", error);
    return NextResponse.json(
      {
        error: "Failed to receive emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to receive emails",
    usage: {
      method: "POST",
      body: {
        filterFromEmail: "optional: filter by sender email",
        filterAfterTimestamp: "optional: ISO timestamp to filter emails after",
        markAsSeen: "optional: boolean to mark emails as read (default: false)",
      },
    },
  });
}
