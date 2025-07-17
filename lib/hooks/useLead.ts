import { useState, useCallback } from "react";
import { toast } from "sonner";

interface LeadData {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  projectType: string;
  qualifierFormData?: {
    [key: string]: string;
  };
}

interface UseLeadReturn {
  leadData: LeadData | null;
  pdfUrl: string | null;
  loading: boolean;
  error: string;
  fetchLead: () => Promise<void>;
}

export function useLead(leadId: string, userId?: string): UseLeadReturn {
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchLead = useCallback(async () => {
    if (!userId) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Lead not found");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to fetch lead");
      }

      const lead = responseData.lead;
      setLeadData(lead);

      // Extract PDF URL from qualifier form responses
      const extractedPdfUrl = lead.qualifierFormData?.["plan-upload"];

      console.log("Lead qualifier form data:", lead.qualifierFormData);
      console.log("Extracted PDF URL:", extractedPdfUrl);

      if (!extractedPdfUrl) {
        throw new Error("No floor plan PDF found for this lead");
      }

      setPdfUrl(extractedPdfUrl);

      toast.success("Lead data loaded successfully!", {
        description: `Floor plan for ${lead.companyName} is ready.`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load lead data";
      setError(errorMessage);
      toast.error("Failed to load lead data", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [leadId, userId]);

  return {
    leadData,
    pdfUrl,
    loading,
    error,
    fetchLead,
  };
}
