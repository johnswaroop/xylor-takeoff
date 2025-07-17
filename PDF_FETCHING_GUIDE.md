# PDF Fetching Guide for Lead Data

## Overview

This document describes how to fetch PDF files (floor plans) from lead data in the Xylor system. PDFs are stored in AWS S3 and accessed through presigned URLs for security and cost optimization.

## Data Structure

### Lead Data Storage

PDFs in lead data are stored in the `qualifierFormData` field under the key `"plan-upload"`:

```typescript
interface Lead {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  // ... other fields
  qualifierFormData?: QualifierFormData; // Contains PDF URLs
  // ... other fields
}

interface QualifierFormData {
  [fieldId: string]: string | string[] | boolean | number | File | null;
  "plan-upload"?: string; // S3 URL of the uploaded PDF
}
```

### PDF URL Format

PDFs are stored as S3 URLs in various formats:

- `https://ponderbucket.s3.amazonaws.com/xylo-leads/filename.pdf`
- `https://ponderbucket.s3.region.amazonaws.com/xylo-leads/filename.pdf`
- `https://s3.amazonaws.com/ponderbucket/xylo-leads/filename.pdf`
- `xylo-leads/filename.pdf` (S3 key only)

## API Endpoints

### 1. Get Lead Data

**Endpoint:** `GET /api/leads/{leadId}`

**Headers:**

```typescript
{
  "x-user-id": string // Required for authentication
}
```

**Response:**

```typescript
{
  success: boolean;
  lead?: {
    _id: string;
    companyName: string;
    // ... other lead fields
    qualifierFormData?: {
      "plan-upload"?: string; // S3 URL
      // ... other form responses
    };
  };
  error?: string;
}
```

### 2. Generate Presigned Download URL

**Endpoint:** `GET /api/generate-presigned-s3-url`

**Query Parameters:**

```typescript
{
  operation: "download"; // Required: must be "download"
  key: string; // Required: S3 key extracted from URL
}
```

**Response:**

```typescript
{
  url: string;  // Presigned download URL (valid for 1 hour)
  error?: string;
}
```

**Alternative POST Method:**

```typescript
// POST /api/generate-presigned-s3-url
{
  operation: "download",
  key: string
}
```

## Step-by-Step PDF Fetching Process

### 1. Fetch Lead Data

```typescript
async function fetchLead(leadId: string, userId: string) {
  const response = await fetch(`/api/leads/${leadId}`, {
    headers: {
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch lead data");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch lead");
  }

  return data.lead;
}
```

### 2. Extract PDF URL from Lead Data

```typescript
function extractPdfUrl(lead: Lead): string | null {
  return lead.qualifierFormData?.["plan-upload"] || null;
}
```

### 3. Extract S3 Key from PDF URL

```typescript
function extractS3Key(s3Url: string): string | null {
  try {
    const url = new URL(s3Url);

    // Format 1 & 2: bucket.s3.[region.]amazonaws.com/key
    if (
      url.hostname.includes(".s3.") &&
      url.hostname.includes(".amazonaws.com")
    ) {
      return decodeURIComponent(url.pathname.substring(1)); // Remove leading slash
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
    console.error("Error extracting S3 key:", error);
    return null;
  }
}
```

### 4. Generate Presigned Download URL

```typescript
async function generateDownloadUrl(s3Key: string): Promise<string> {
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
}
```

### 5. Download PDF File

```typescript
async function downloadPdf(downloadUrl: string): Promise<Uint8Array> {
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download PDF: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Downloaded PDF file is empty");
  }

  return new Uint8Array(arrayBuffer);
}
```

## Complete Implementation Example

### React Hook for PDF Fetching

```typescript
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UsePDFReturn {
  pdfFile: { data: Uint8Array } | null;
  loading: boolean;
  error: string;
  loadPDF: (pdfUrl: string) => Promise<void>;
}

export function usePDF(): UsePDFReturn {
  const [pdfFile, setPdfFile] = useState<{ data: Uint8Array } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const loadPDF = useCallback(async (pdfUrl: string) => {
    setLoading(true);
    setError("");
    setPdfFile(null);

    try {
      // Extract S3 key
      const s3Key = extractS3Key(pdfUrl);
      if (!s3Key) {
        throw new Error(`Invalid S3 URL format: ${pdfUrl}`);
      }

      // Generate presigned download URL
      const downloadUrl = await generateDownloadUrl(s3Key);

      // Download PDF data
      const pdfData = await downloadPdf(downloadUrl);
      setPdfFile({ data: pdfData });

      toast.success("PDF loaded successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load PDF";
      setError(errorMessage);
      toast.error("Failed to load PDF", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, []);

  return { pdfFile, loading, error, loadPDF };
}
```

### Complete Lead-to-PDF Pipeline

```typescript
async function fetchLeadPdf(
  leadId: string,
  userId: string
): Promise<{ data: Uint8Array } | null> {
  try {
    // 1. Fetch lead data
    const lead = await fetchLead(leadId, userId);

    // 2. Extract PDF URL
    const pdfUrl = extractPdfUrl(lead);
    if (!pdfUrl) {
      throw new Error("No floor plan PDF found for this lead");
    }

    // 3. Extract S3 key
    const s3Key = extractS3Key(pdfUrl);
    if (!s3Key) {
      throw new Error("Invalid PDF URL format");
    }

    // 4. Generate download URL
    const downloadUrl = await generateDownloadUrl(s3Key);

    // 5. Download PDF
    const pdfData = await downloadPdf(downloadUrl);

    return { data: pdfData };
  } catch (error) {
    console.error("Error fetching lead PDF:", error);
    throw error;
  }
}
```

## Error Handling

### Common Errors and Solutions

| Error                             | Cause                                      | Solution                                         |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `Lead not found`                  | Invalid leadId or insufficient permissions | Verify leadId and user permissions               |
| `No floor plan PDF found`         | Lead has no uploaded PDF                   | Check if qualifierFormData["plan-upload"] exists |
| `Invalid S3 URL format`           | Malformed S3 URL                           | Verify URL format and S3 key extraction          |
| `Failed to generate download URL` | S3 permissions or network issues           | Check AWS credentials and S3 bucket access       |
| `Failed to download PDF`          | Expired presigned URL or network issues    | Regenerate presigned URL                         |
| `Downloaded PDF file is empty`    | Corrupted file or upload issue             | Re-upload the PDF file                           |

### Error Handling Best Practices

```typescript
async function safeLoadPdf(leadId: string, userId: string) {
  try {
    const result = await fetchLeadPdf(leadId, userId);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      // Log specific error for debugging
      console.error("PDF loading error:", {
        leadId,
        userId,
        error: error.message,
        stack: error.stack,
      });

      // Provide user-friendly error messages
      if (error.message.includes("not found")) {
        toast.error("Lead not found", {
          description: "The requested lead could not be found.",
        });
      } else if (error.message.includes("No floor plan")) {
        toast.error("No PDF available", {
          description: "This lead doesn't have a floor plan uploaded yet.",
        });
      } else if (error.message.includes("permissions")) {
        toast.error("Access denied", {
          description: "You don't have permission to access this lead.",
        });
      } else {
        toast.error("Failed to load PDF", {
          description: "Please try again or contact support.",
        });
      }
    }

    return null;
  }
}
```

## Security Considerations

### Authentication

- All API calls require `x-user-id` header
- Users can only access leads they have permission to view:
  - **BD users**: Can access leads they created
  - **Estimators**: Can access leads assigned to them
  - **Admins**: Can access all leads

### Authorization Checks

```typescript
// Server-side permission check example
const canView =
  user.roles.includes(UserRole.ADMIN) ||
  (user.roles.includes(UserRole.BD) &&
    lead.createdBy.toString() === user._id.toString()) ||
  (user.roles.includes(UserRole.ESTIMATOR) &&
    lead.assignedEstimator?.toString() === user._id.toString());
```

### S3 Security

- Presigned URLs expire after 1 hour
- Bucket access is restricted through IAM policies
- Files are stored with unique paths (`xylo-leads/` prefix)

## Performance Considerations

### Caching

- Consider caching presigned URLs (with expiration tracking)
- Cache PDF data for recently accessed files
- Implement lazy loading for PDF display

### Optimization

- Use compression for large PDF files
- Implement progressive loading for multi-page PDFs
- Consider thumbnail generation for PDF previews

### Resource Management

```typescript
// Cleanup example for React components
useEffect(() => {
  return () => {
    // Cleanup PDF data when component unmounts
    setPdfFile(null);
  };
}, []);
```

## Testing

### Unit Tests

```typescript
describe("PDF Fetching", () => {
  test("should extract S3 key from various URL formats", () => {
    expect(
      extractS3Key("https://ponderbucket.s3.amazonaws.com/xylo-leads/test.pdf")
    ).toBe("xylo-leads/test.pdf");

    expect(extractS3Key("xylo-leads/test.pdf")).toBe("xylo-leads/test.pdf");
  });

  test("should handle invalid URLs gracefully", () => {
    expect(extractS3Key("invalid-url")).toBe(null);
  });
});
```

### Integration Tests

- Test complete lead-to-PDF pipeline
- Verify permission checks
- Test error scenarios (missing files, expired URLs)

## Configuration

### Environment Variables

```bash
# Required for S3 access
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region

# S3 bucket configuration
S3_BUCKET_NAME=ponderbucket
```

### AWS S3 Bucket Policy

Ensure the bucket has appropriate policies for presigned URL generation and file access.

## Monitoring and Logging

### Key Metrics to Track

- PDF fetch success/failure rates
- Presigned URL generation times
- Download completion rates
- Error frequencies by type

### Logging Best Practices

```typescript
// Log important events
console.log("PDF fetch started:", { leadId, userId, timestamp: new Date() });
console.log("PDF fetch completed:", {
  leadId,
  fileSize: pdfData.length,
  duration,
});
console.error("PDF fetch failed:", {
  leadId,
  error: error.message,
  timestamp: new Date(),
});
```

This guide provides a complete reference for fetching PDF files from lead data in the Xylor system. For additional support or questions, refer to the codebase implementation or contact the development team.
