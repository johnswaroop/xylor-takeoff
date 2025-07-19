import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import connect from "@/lib/db";
import User from "@/lib/models/User";
import Lead from "@/lib/models/Lead";
import { UserRole } from "@/lib/types/user-roles";
import { ChatApiResult } from "@/lib/types/chat";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to verify authentication and get user
async function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return null;
  }

  // Validate ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    return null;
  }

  await connect();
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

// Helper function to check if user has required roles
function hasRequiredRole(
  user: { roles?: UserRole[] } | null,
  requiredRoles: UserRole[]
): boolean {
  return Boolean(
    user &&
      user.roles &&
      user.roles.some((role: UserRole) => requiredRoles.includes(role))
  );
}

// Helper function to fetch user's leads data
async function fetchUserLeadsData(user: { _id: string; roles: UserRole[] }) {
  try {
    await connect();

    // Build query based on user role
    const leadsQuery: Record<string, unknown> = {};

    // If estimator, only show assigned leads
    if (
      user.roles.includes(UserRole.ESTIMATOR) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      leadsQuery.assignedEstimator = user._id;
    }

    // If BD, show own leads unless admin
    if (
      user.roles.includes(UserRole.BD) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      leadsQuery.createdBy = user._id;
    }

    // Only show non-draft leads for context
    leadsQuery.isDraft = false;

    // Get recent leads (last 50 for context)
    const recentLeads = await Lead.find(leadsQuery)
      .populate("createdBy", "name email")
      .populate("assignedEstimator", "name email")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    // Get lead statistics
    const totalLeads = await Lead.countDocuments(leadsQuery);

    // Status breakdown
    const statusBreakdown = await Lead.aggregate([
      { $match: leadsQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Project type breakdown
    const projectTypeBreakdown = await Lead.aggregate([
      { $match: leadsQuery },
      { $group: { _id: "$projectType", count: { $sum: 1 } } },
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Lead.countDocuments({
      ...leadsQuery,
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      recentLeads,
      statistics: {
        totalLeads,
        statusBreakdown,
        projectTypeBreakdown,
        recentActivity,
      },
    };
  } catch (error) {
    console.error("Error fetching leads data:", error);
    return null;
  }
}

// Helper function to create enhanced system prompt with data
function createEnhancedSystemPrompt(
  user: {
    name: string;
    email: string;
    roles: UserRole[];
    company?: string;
    phone?: string;
  },
  leadsData: {
    recentLeads: unknown[];
    statistics: {
      totalLeads: number;
      statusBreakdown: { _id: string; count: number }[];
      projectTypeBreakdown: { _id: string; count: number }[];
      recentActivity: number;
    };
  } | null,
  leadContext?: {
    companyName: string;
    contactPerson: string;
    email: string;
    projectType: string;
    status: string;
    address?: string;
    assignedEstimator?: unknown;
    notes?: unknown[];
  }
) {
  const userRoleDescription = user.roles.includes(UserRole.ADMIN)
    ? "Admin user with full system oversight"
    : user.roles.includes(UserRole.BD)
    ? "Business Development professional managing leads and client relationships"
    : "Estimator working on project estimations";

  const basePrompt = `You are an AI assistant for Xylor, a construction takeoff and estimation platform. 

ABOUT XYLOR:
Xylor is a comprehensive lead management and estimation system that streamlines the construction process from initial lead creation to final estimate approval. The platform features integrated communication tools and provides data-driven insights for construction professionals.

USER CONTEXT:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${userRoleDescription}
- Company: ${user.company || "Xylor"}
${user.phone ? `- Phone: ${user.phone}` : ""}

BUSINESS WORKFLOW:
1. Business Development creates leads with client information
2. Qualifier forms are sent to clients to assess project readiness
3. Clients complete qualification forms with project details, funding status, council approvals, and plan uploads
4. BD reviews responses and approves for estimation
5. Estimators perform cost analysis and prepare estimates
6. BD shares estimates with clients for approval
7. Process concludes with project award or rejection`;

  // Add lead-specific context if provided
  if (leadContext) {
    const leadSpecificContext = `

CURRENT LEAD FOCUS:
You are currently assisting with a specific lead. Here are the details:

Lead Details:
- Company: ${leadContext.companyName}
- Contact: ${leadContext.contactPerson} (${leadContext.email})
- Project Type: ${leadContext.projectType}
- Status: ${leadContext.status}
${leadContext.address ? `- Location: ${leadContext.address}` : ""}
${
  leadContext.assignedEstimator
    ? "- ✅ Estimator assigned"
    : "- ⚠️ No estimator assigned yet"
}

${
  leadContext.notes &&
  Array.isArray(leadContext.notes) &&
  leadContext.notes.length > 0
    ? `Recent Notes (Last 3):
${leadContext.notes
  .slice(-3)
  .map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (note: any, index: number) =>
      `${index + 1}. ${typeof note === "object" ? note.content : note}`
  )
  .join("\n")}`
    : ""
}

LEAD-SPECIFIC ASSISTANCE:
Focus your responses on this specific lead. Provide contextual guidance about:
- Next steps for ${leadContext.companyName}
- Status-specific recommendations for ${leadContext.status} leads
- Project-specific advice for ${leadContext.projectType} projects
- Communication strategies with ${leadContext.contactPerson}
- Estimation considerations if applicable

When providing advice, reference this lead specifically by company name.`;

    return (
      basePrompt +
      leadSpecificContext +
      `

RESPONSE GUIDELINES FOR LEAD-SPECIFIC ASSISTANCE:
- Always reference ${leadContext.companyName} by name when providing specific advice
- Consider the current status (${leadContext.status}) when suggesting next steps
- Tailor project advice to the ${leadContext.projectType} project type
- Provide actionable recommendations specific to this lead's situation
- Be professional and helpful while staying focused on this particular client
- Reference the lead's current status and project details in your responses

How can I help you with ${leadContext.companyName} today?`
    );
  }

  if (leadsData && leadsData.statistics) {
    const stats = leadsData.statistics;
    const statusCounts = stats.statusBreakdown.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    const projectTypeCounts = stats.projectTypeBreakdown.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    const dataContext = `

CURRENT BUSINESS DATA (Your accessible leads):
Total Leads: ${stats.totalLeads}
New Leads (Last 30 days): ${stats.recentActivity}

Lead Status Breakdown:
${Object.entries(statusCounts)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join("\n")}

Project Type Distribution:
${Object.entries(projectTypeCounts)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join("\n")}`;

    if (leadsData.recentLeads && leadsData.recentLeads.length > 0) {
      const recentLeadsContext = `

RECENT LEADS CONTEXT (Last ${Math.min(
        10,
        leadsData.recentLeads.length
      )} for reference):
${leadsData.recentLeads
  .slice(0, 10)
  .map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (lead: any, index: number) =>
      `${index + 1}. ${lead.companyName} (${lead.contactPerson}) [Lead ID: ${
        lead._id
      }]
   - Project: ${lead.projectType}
   - Status: ${lead.status}
   - Created: ${new Date(lead.createdAt).toLocaleDateString()}
   ${
     lead.assignedEstimator
       ? `- Estimator: ${lead.assignedEstimator.name}`
       : "- No estimator assigned"
   }
   ${
     lead.initialNotes
       ? `- Notes: ${lead.initialNotes.substring(0, 100)}${
           lead.initialNotes.length > 100 ? "..." : ""
         }`
       : ""
   }`
  )
  .join("\n\n")}`;

      return (
        basePrompt +
        dataContext +
        recentLeadsContext +
        `

CRITICAL DATA CITATION REQUIREMENTS:
When referencing any business data or specific leads in your responses, you MUST include proper citations:

1. **Business Statistics Citations**:
   - Use: "According to your current business data..." or "Based on your lead statistics..."
   - Example: "Based on your lead statistics, you have 15 active leads with 5 in estimation status."

2. **Specific Lead Citations**:
   - Always include Lead ID and company name when referencing specific leads
   - Format: "Lead #[ID] ([Company Name])" or "[Company Name] (Lead #[ID])"
   - Example: "ABC Construction (Lead #507f1f77bcf86cd799439011) needs follow-up"

3. **Status and Project Type References**:
   - Cite the source when mentioning counts or percentages
   - Example: "Your status breakdown shows 8 leads waiting for qualifiers and 3 in estimation"

4. **Date and Timeline References**:
   - Include creation dates when relevant for urgency
   - Example: "XYZ Corp (Lead #12345) was created 5 days ago and hasn't received a qualifier response"

5. **Estimator Assignment Citations**:
   - Reference specific estimator names when discussing assignments
   - Example: "John Smith is currently assigned to 3 active projects including ABC Construction (Lead #12345)"

RESPONSE GUIDELINES:
- Always cite your data sources to build trust and transparency
- Use specific lead IDs and company names for clarity
- Reference business statistics when providing insights
- Make it clear when information comes from the provided business data
- Include creation dates for time-sensitive recommendations
- Provide specific, actionable advice based on the actual business data above
- Help with lead management, status tracking, and business development strategies
- For estimation questions, provide construction industry best practices
- Be professional, knowledgeable, and helpful
- Suggest actionable next steps based on current lead statuses and business metrics

How can I assist you with your Xylor operations today?`
      );
    }

    return (
      basePrompt +
      dataContext +
      `

CRITICAL DATA CITATION REQUIREMENTS:
When referencing any business data in your responses, you MUST include proper citations:

1. **Business Statistics Citations**:
   - Use: "According to your current business data..." or "Based on your lead statistics..."
   - Always reference the specific numbers when providing insights

2. **Status and Project Type References**:
   - Cite the source when mentioning counts or percentages
   - Example: "Your status breakdown shows [specific numbers from data]"

3. **Comparative Analysis**:
   - Reference the data source when making recommendations
   - Example: "Based on your project type distribution..."

RESPONSE GUIDELINES:
- Always cite your data sources to build trust and transparency
- Reference business statistics when providing insights
- Make it clear when information comes from the provided business data
- Provide specific, actionable advice based on the actual business data above
- Help with lead management, status tracking, and business development strategies
- For estimation questions, provide construction industry best practices
- Be professional, knowledgeable, and helpful
- Suggest actionable next steps based on current business metrics and lead distribution

How can I assist you with your Xylor operations today?`
    );
  }

  return (
    basePrompt +
    `

RESPONSE GUIDELINES:
- Provide helpful guidance on construction lead management and estimation
- Offer best practices for business development in construction
- Be professional, knowledgeable, and supportive
- Help with workflow optimization and process improvement
- When providing general advice, clearly indicate it's based on industry best practices
- If asked about specific data, explain that you need access to current lead information

How can I assist you with your Xylor operations today?`
  );
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<ChatApiResult>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions - only Admin and BD users can access AI assistant
    if (!hasRequiredRole(user, [UserRole.ADMIN, UserRole.BD])) {
      return NextResponse.json<ChatApiResult>(
        {
          success: false,
          error: "Access restricted to Admin and BD users only",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, leadContext } = body;

    // Validate message
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json<ChatApiResult>(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate message length (reasonable limit)
    if (message.length > 4000) {
      return NextResponse.json<ChatApiResult>(
        {
          success: false,
          error: "Message too long. Please keep it under 4000 characters.",
        },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json<ChatApiResult>(
        { success: false, error: "AI service temporarily unavailable" },
        { status: 500 }
      );
    }

    // Fetch user's leads data for context
    const leadsData = await fetchUserLeadsData(user);

    // Create enhanced system prompt with real data
    const systemPrompt = createEnhancedSystemPrompt(
      user,
      leadsData,
      leadContext
    );

    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json<ChatApiResult>(
        { success: false, error: "No response generated. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json<ChatApiResult>({
      success: true,
      message: assistantMessage,
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);

    // Handle specific OpenAI errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.error?.type === "insufficient_quota") {
      return NextResponse.json<ChatApiResult>(
        {
          success: false,
          error: "AI service quota exceeded. Please try again later.",
        },
        { status: 503 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.error?.type === "invalid_request_error") {
      return NextResponse.json<ChatApiResult>(
        {
          success: false,
          error: "Invalid request. Please check your message and try again.",
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json<ChatApiResult>(
      {
        success: false,
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
