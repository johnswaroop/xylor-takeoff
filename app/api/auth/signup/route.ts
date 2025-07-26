import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/User";
import { AuthResponse } from "@/lib/types/user";

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connect();

    // Parse the request body
    const body = await request.json();
    const { name, email, password, roles, company, phone } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Name, email, and password are required",
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed by the pre-save middleware
      roles: roles && roles.length > 0 ? roles : ["BD"],
      company: company?.trim() || "",
      phone: phone?.trim() || "",
    });

    // Save to database
    const savedUser = await newUser.save();

    // Return success response (without password)
    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Account created successfully",
        user: {
          _id: savedUser._id.toString(),
          name: savedUser.name,
          email: savedUser.email,
          roles: savedUser.roles,
          company: savedUser.company,
          phone: savedUser.phone,
          createdAt: savedUser.createdAt,
          updatedAt: savedUser.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Signup error:", error);
    console.error("Signup error:", error);

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

      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Handle duplicate key error (email already exists)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
