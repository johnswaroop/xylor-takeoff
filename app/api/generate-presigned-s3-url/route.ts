import { NextResponse } from "next/server";
import AWS from "aws-sdk";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = "ponderbucket";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const operation = url.searchParams.get("operation") || "upload"; // 'upload' or 'download'
    const filename = url.searchParams.get("filename");
    const filetype = url.searchParams.get("filetype");
    const key = url.searchParams.get("key"); // S3 key for download operations

    if (operation === "upload") {
      if (!filename || !filetype) {
        return NextResponse.json(
          { error: "filename and filetype are required for upload" },
          { status: 400 }
        );
      }

      const s3Key = `xylo-leads/${filename}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 300, // 5 minutes for upload
        ContentType: filetype,
      };

      const signedUrl = await s3.getSignedUrlPromise("putObject", params);

      return NextResponse.json({
        url: signedUrl,
        key: s3Key, // Return the key so it can be stored in the database
      });
    } else if (operation === "download") {
      if (!key) {
        return NextResponse.json(
          { error: "key is required for download" },
          { status: 400 }
        );
      }

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: 3600, // 1 hour for download
      };

      const signedUrl = await s3.getSignedUrlPromise("getObject", params);

      return NextResponse.json({ url: signedUrl });
    } else {
      return NextResponse.json(
        { error: "Invalid operation. Must be 'upload' or 'download'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return NextResponse.json(
      { error: "Error generating pre-signed URL" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { operation, filename, filetype, key } = body;

    if (operation === "upload") {
      if (!filename || !filetype) {
        return NextResponse.json(
          { error: "filename and filetype are required for upload" },
          { status: 400 }
        );
      }

      const s3Key = `xylo-leads/${filename}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 300, // 5 minutes for upload
        ContentType: filetype,
      };

      const signedUrl = await s3.getSignedUrlPromise("putObject", params);

      return NextResponse.json({
        url: signedUrl,
        key: s3Key,
      });
    } else if (operation === "download") {
      if (!key) {
        return NextResponse.json(
          { error: "key is required for download" },
          { status: 400 }
        );
      }

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: 3600, // 1 hour for download
      };

      const signedUrl = await s3.getSignedUrlPromise("getObject", params);

      return NextResponse.json({ url: signedUrl });
    } else {
      return NextResponse.json(
        { error: "Invalid operation. Must be 'upload' or 'download'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return NextResponse.json(
      { error: "Error generating pre-signed URL" },
      { status: 500 }
    );
  }
}
