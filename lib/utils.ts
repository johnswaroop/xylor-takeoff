import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to generate presigned download URL for S3 files
export async function generateDownloadUrl(s3Key: string): Promise<string> {
  try {
    const response = await fetch(
      `/api/generate-presigned-s3-url?operation=download&key=${encodeURIComponent(
        s3Key
      )}`
    );

    if (!response.ok) {
      throw new Error("Failed to generate download URL");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}

// Extract S3 key from S3 URL
export function extractS3Key(s3Url: string): string | null {
  try {
    const url = new URL(s3Url);

    // Format 1: bucket.s3.region.amazonaws.com/key
    // Format 2: bucket.s3.amazonaws.com/key
    if (
      url.hostname.includes(".s3.") &&
      url.hostname.includes(".amazonaws.com")
    ) {
      return decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode
    }

    // Format 3: s3.region.amazonaws.com/bucket/key
    // Format 4: s3.amazonaws.com/bucket/key
    if (
      url.hostname.includes("s3.") &&
      url.hostname.includes(".amazonaws.com") &&
      url.pathname.includes("/")
    ) {
      const pathParts = url.pathname
        .split("/")
        .filter((part) => part.length > 0);
      if (pathParts.length >= 2) {
        // Skip the bucket name (first part) and return the rest as the key
        const key = pathParts.slice(1).join("/");
        return decodeURIComponent(key);
      }
    }

    // Format 5: Direct S3 path (already just the key)
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
