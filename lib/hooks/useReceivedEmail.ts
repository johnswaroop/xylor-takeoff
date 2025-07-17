import { useState, useEffect, useCallback, useRef } from "react";

// Types
interface EmailMessage {
  from: string;
  subject: string;
  date: Date;
  text: string;
}

interface UseReceivedEmailOptions {
  filterFromEmail?: string;
  filterAfterTimestamp?: Date;
  markAsSeen?: boolean;
  pollInterval?: number; // in milliseconds, default 30 seconds
  enabled?: boolean; // whether to start polling immediately
}

interface UseReceivedEmailReturn {
  emails: EmailMessage[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useReceivedEmail = (
  options: UseReceivedEmailOptions
): UseReceivedEmailReturn => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    filterFromEmail,
    filterAfterTimestamp,
    markAsSeen = false,
    pollInterval = 30000, // 30 seconds default
    enabled = true,
  } = options;

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Fetch emails from API
  const fetchEmails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const requestBody = {
        ...(filterFromEmail && { filterFromEmail }),
        ...(filterAfterTimestamp && {
          filterAfterTimestamp: filterAfterTimestamp.toISOString(),
        }),
        markAsSeen,
      };

      const response = await fetch("/api/receive-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Convert date strings back to Date objects
      interface ApiEmailMessage extends Omit<EmailMessage, "date"> {
        date: string;
      }
      const emailsWithDates = data.emails.map((email: ApiEmailMessage) => ({
        ...email,
        date: new Date(email.date),
      }));

      setEmails((prev) => {
        // Merge new emails with existing ones, avoiding duplicates
        const existingEmails = new Set(
          prev.map(
            (email) => `${email.from}-${email.subject}-${email.date.getTime()}`
          )
        );

        const uniqueNewEmails = emailsWithDates.filter(
          (email: EmailMessage) =>
            !existingEmails.has(
              `${email.from}-${email.subject}-${email.date.getTime()}`
            )
        );

        return [...uniqueNewEmails, ...prev].sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );
      });
    } catch (err) {
      setError(
        `Error fetching emails: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Email fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterFromEmail, filterAfterTimestamp, markAsSeen]);

  // Start polling
  const startPolling = useCallback(() => {
    clearPolling();
    fetchEmails(); // Fetch immediately
    pollIntervalRef.current = setInterval(fetchEmails, pollInterval);
  }, [fetchEmails, pollInterval, clearPolling]);

  // Stop polling
  const stopPolling = useCallback(() => {
    clearPolling();
  }, [clearPolling]);

  // Refresh emails manually
  const refresh = useCallback(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Auto-start polling on mount if enabled
  useEffect(() => {
    if (enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    emails,
    isLoading,
    error,
    refresh,
    startPolling,
    stopPolling,
  };
};
