import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { UserRole } from "@/lib/types/user-roles";
import AWS from "aws-sdk";
import pdf from "pdf-poppler";
import path from "path";
import fs from "fs";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import os from "os";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = "ponderbucket";

// Helper function to extract S3 key from URL
function extractS3Key(s3Url: string): string | null {
  try {
    const url = new URL(s3Url);

    // Format 1 & 2: bucket.s3.[region.]amazonaws.com/key
    if (
      url.hostname.includes(".s3.") &&
      url.hostname.includes(".amazonaws.com")
    ) {
      return decodeURIComponent(url.pathname.substring(1));
    }

    // Format 3 & 4: s3.[region.]amazonaws.com/bucket/key
    if (
      url.hostname.includes("s3.") &&
      url.hostname.includes(".amazonaws.com")
    ) {
      const pathParts = url.pathname
        .split("/")
        .filter((part) => part.length > 0);
      if (pathParts.length >= 2) {
        return decodeURIComponent(pathParts.slice(1).join("/"));
      }
    }

    // Format 5: Direct S3 key
    if (
      !url.hostname.includes("amazonaws.com") &&
      s3Url.startsWith("xylo-leads/")
    ) {
      return s3Url;
    }

    return null;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", s3Url, error);
    return null;
  }
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

// Helper function to check if user has required roles
function hasRequiredRole(
  user: { roles?: UserRole[] } | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: UserRole) => allowedRoles.includes(role));
}

// POST /api/leads/[id]/convert-pdf - Convert PDF page to image
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

    // Check permissions
    if (!hasRequiredRole(user, [UserRole.ESTIMATOR, UserRole.ADMIN])) {
      return NextResponse.json(
        {
          success: false,
          error: "Only estimators and admins can convert PDFs",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { pageNumber } = await request.json();

    if (!pageNumber || pageNumber < 1) {
      return NextResponse.json(
        { success: false, error: "Valid page number is required" },
        { status: 400 }
      );
    }

    await connect();

    // Find lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to access this lead
    const canAccess =
      user.roles.includes(UserRole.ADMIN) ||
      (user.roles.includes(UserRole.ESTIMATOR) &&
        lead.assignedEstimator?.toString() === user._id.toString());

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied to this lead" },
        { status: 403 }
      );
    }

    // Extract PDF URL
    const pdfUrl = lead.qualifierFormData?.["plan-upload"];
    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, error: "No floor plan PDF found for this lead" },
        { status: 404 }
      );
    }

    // Extract S3 key
    const s3Key = extractS3Key(pdfUrl);
    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: "Invalid PDF URL format" },
        { status: 400 }
      );
    }

    console.log("Converting PDF:", { leadId: id, pageNumber, s3Key });

    // Download PDF from S3
    const pdfData = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })
      .promise();

    if (!pdfData.Body) {
      return NextResponse.json(
        { success: false, error: "Failed to download PDF from storage" },
        { status: 500 }
      );
    }

    const pdfBuffer = Buffer.isBuffer(pdfData.Body)
      ? pdfData.Body
      : Buffer.from(pdfData.Body as Uint8Array);

    console.log("PDF downloaded from S3:", { size: pdfBuffer.length });

    // Create temporary directory for PDF processing
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "pdf-convert-"));
    const tempPdfPath = path.join(tempDir, "temp.pdf");

    try {
      // Write PDF buffer to temporary file
      await writeFile(tempPdfPath, pdfBuffer);

      // Convert PDF page to image using pdf-poppler
      console.log("Converting PDF page to image:", { pageNumber, tempDir });

      const options = {
        format: "png" as const,
        out_dir: tempDir,
        out_prefix: "page",
        page: pageNumber,
        single_file: true,
      };

      const results = await pdf.convert(tempPdfPath, options);

      if (!results || results.length === 0) {
        throw new Error("Failed to convert PDF page");
      }

      // Read the converted image
      const imagePath = results[0];
      const imageBuffer = await fs.promises.readFile(imagePath);
      const base64Image = `data:image/png;base64,${imageBuffer.toString(
        "base64"
      )}`;

      console.log("PDF conversion successful:", {
        imagePath,
        imageSize: imageBuffer.length,
        base64Length: base64Image.length,
      });

      // Clean up temporary files
      await unlink(tempPdfPath);
      await unlink(imagePath);
      await fs.promises.rmdir(tempDir);

      return NextResponse.json({
        success: true,
        base64Image,
        leadId: id,
        pageNumber,
        width: 0, // pdf-poppler doesn't provide dimensions directly
        height: 0,
      });
    } catch (conversionError) {
      // Clean up temporary files on error
      try {
        await unlink(tempPdfPath);
        await fs.promises.rmdir(tempDir);
      } catch (cleanupError) {
        console.error("Failed to clean up temp files:", cleanupError);
      }

      console.error("PDF conversion error:", conversionError);
      throw new Error(
        `PDF conversion failed: ${
          conversionError instanceof Error
            ? conversionError.message
            : "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("Error converting PDF:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
