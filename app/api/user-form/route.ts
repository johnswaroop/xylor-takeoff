import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/User";
import { UserFormData, ApiResponse } from "@/lib/types/user";

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connect();

    // Parse the request body
    const body: UserFormData = await request.json();
    const { name, email, phone, company, title, wantDemo } = body;

    // Validate required fields
    if (!name || !email || !company || !title) {
      return NextResponse.json<ApiResponse>(
        { error: "Name, email, company, and title are required fields" },
        { status: 400 }
      );
    }

    // Validate wantDemo field
    if (typeof wantDemo !== "boolean") {
      return NextResponse.json<ApiResponse>(
        { error: "Please specify if you want a demo (Yes/No)" },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          error: "A user with this email already exists",
          userId: existingUser._id.toString(),
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      company: company.trim(),
      title: title.trim(),
      wantDemo,
    });

    // Save to database
    const savedUser = await newUser.save();

    return NextResponse.json<ApiResponse>(
      {
        message: "User registered successfully",
        userId: savedUser._id.toString(),
        user: {
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          company: savedUser.company,
          title: savedUser.title,
          wantDemo: savedUser.wantDemo,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    // Handle mongoose validation errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError" &&
      "errors" in error
    ) {
      const validationError = error as unknown as {
        errors: Record<string, { message: string }>;
      };
      const validationErrors = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return NextResponse.json<ApiResponse>(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connect();

    // Get count of total users
    const userCount = await User.countDocuments();

    return NextResponse.json(
      {
        message: "User form endpoint is working",
        totalUsers: userCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
