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
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // JWT token generation can be implemented later if needed
    const token = undefined;

    // Return success response
    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Login successful",
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          roles: user.roles,
          company: user.company,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
