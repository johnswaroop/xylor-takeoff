import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Lead, CommunicationType } from "@/lib/types/lead";

interface AddCommunicationData {
  type: CommunicationType;
  direction: "INBOUND" | "OUTBOUND";
  subject?: string;
  content: string;
  attachments?: string[];
  emailData?: {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    messageId?: string;
    threadId?: string;
  };
  callData?: {
    duration?: number;
    outcome?: string;
    nextAction?: string;
    transcript?: string;
  };
}

interface UseLeadDetailsReturn {
  lead: Lead | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (
    newStatus: string,
    reason?: string,
    notes?: string
  ) => Promise<boolean>;
  updateLead: (updatedData: Partial<Lead>) => Promise<boolean>;
  addCommunication: (
    communicationData: AddCommunicationData
  ) => Promise<boolean>;
  addNote: (
    content: string,
    isPrivate?: boolean,
    tags?: string[]
  ) => Promise<boolean>;
}

export function useLeadDetails(
  leadId: string,
  userId?: string
): UseLeadDetailsReturn {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    if (!userId || !leadId) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Lead not found");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to view this lead");
        }
        throw new Error("Failed to fetch lead");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to fetch lead");
      }

      setLead(responseData.lead);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load lead data";
      setError(errorMessage);
      console.error("Error fetching lead:", err);
    } finally {
      setLoading(false);
    }
  }, [leadId, userId]);

  const updateStatus = useCallback(
    async (
      newStatus: string,
      reason?: string,
      notes?: string
    ): Promise<boolean> => {
      if (!userId || !leadId) {
        toast.error("Authentication required");
        return false;
      }

      try {
        const response = await fetch(`/api/leads/${leadId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            toStatus: newStatus,
            reason,
            notes,
          }),
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || "Failed to update status");
        }

        // Update local state
        setLead(responseData.lead);

        toast.success("Status updated successfully", {
          description: `Lead status changed to ${newStatus}`,
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update status";
        toast.error("Status update failed", {
          description: errorMessage,
        });
        return false;
      }
    },
    [leadId, userId]
  );

  const updateLead = useCallback(
    async (updatedData: Partial<Lead>): Promise<boolean> => {
      if (!userId || !leadId) {
        toast.error("Authentication required");
        return false;
      }

      try {
        // Transform assignedEstimator to assignedEstimatorId for API compatibility
        const apiData: Partial<Lead> & { assignedEstimatorId?: string } = {
          ...updatedData,
        };
        if ("assignedEstimator" in updatedData) {
          apiData.assignedEstimatorId = updatedData.assignedEstimator;
          delete apiData.assignedEstimator;
        }

        const response = await fetch(`/api/leads/${leadId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(apiData),
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || "Failed to update lead");
        }

        // Update local state
        setLead(responseData.lead);

        toast.success("Lead updated successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update lead";
        toast.error("Update failed", {
          description: errorMessage,
        });
        return false;
      }
    },
    [leadId, userId]
  );

  const addCommunication = useCallback(
    async (communicationData: AddCommunicationData): Promise<boolean> => {
      if (!userId || !leadId) {
        toast.error("Authentication required");
        return false;
      }

      try {
        const response = await fetch(`/api/leads/${leadId}/communications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(communicationData),
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || "Failed to add communication");
        }

        // Update local state
        setLead(responseData.lead);

        toast.success("Communication added successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add communication";
        toast.error("Communication failed", {
          description: errorMessage,
        });
        return false;
      }
    },
    [leadId, userId]
  );

  const addNote = useCallback(
    async (
      content: string,
      isPrivate: boolean = false,
      tags: string[] = []
    ): Promise<boolean> => {
      if (!userId || !leadId) {
        toast.error("Authentication required");
        return false;
      }

      try {
        const response = await fetch(`/api/leads/${leadId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            content,
            isPrivate,
            tags,
          }),
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || "Failed to add note");
        }

        // Update local state
        setLead(responseData.lead);

        toast.success("Note added successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add note";
        toast.error("Note creation failed", {
          description: errorMessage,
        });
        return false;
      }
    },
    [leadId, userId]
  );

  const refetch = useCallback(async () => {
    await fetchLead();
  }, [fetchLead]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return {
    lead,
    loading,
    error,
    refetch,
    updateStatus,
    updateLead,
    addCommunication,
    addNote,
  };
}
