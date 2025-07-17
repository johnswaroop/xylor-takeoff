/**
 * Utility functions for generating and handling form links
 */

/**
 * Generate a qualification form link for a specific lead
 * @param leadId - The MongoDB ObjectId of the lead
 * @returns The full URL to the qualification form
 */
export const generateQualificationFormLink = (leadId: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/form/${leadId}`;
};

/**
 * Get the base URL for the application
 * Handles different environments (development, production, etc.)
 */
export const getBaseUrl = (): string => {
  // In production, use the environment variable
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // In development or when env var is not set
  if (typeof window !== "undefined") {
    // Client-side: use window.location
    return window.location.origin;
  }

  // Server-side fallback
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.VERCEL_URL || "localhost:3000";
  return `${protocol}://${host}`;
};

/**
 * Generate a preview form link (with placeholder)
 * Used in UI before the actual lead is created
 */
export const generatePreviewFormLink = (): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/form/[leadId]`;
};

/**
 * Validate if a form link is valid
 * @param link - The form link to validate
 * @returns boolean indicating if the link is valid
 */
export const validateFormLink = (link: string): boolean => {
  try {
    const url = new URL(link);
    return (
      url.pathname.startsWith("/form/") && url.pathname.split("/").length === 3
    );
  } catch {
    return false;
  }
};

/**
 * Extract lead ID from a form link
 * @param link - The form link
 * @returns The lead ID or null if invalid
 */
export const extractLeadIdFromLink = (link: string): string | null => {
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split("/");
    if (pathParts.length === 3 && pathParts[1] === "form") {
      return pathParts[2];
    }
    return null;
  } catch {
    return null;
  }
};
