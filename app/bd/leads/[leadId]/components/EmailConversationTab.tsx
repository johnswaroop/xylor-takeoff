"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MailOpen,
  RefreshCw,
  Send,
  Inbox,
  Clock,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
} from "lucide-react";
import { Lead } from "@/lib/types/lead";
import { toast } from "sonner";

interface EmailMessage {
  _id: string;
  direction: "INBOUND" | "OUTBOUND";
  subject: string;
  content: string;
  sentAt: string;
  sentBy?: {
    _id: string;
    name: string;
    email: string;
  };
  emailData?: {
    messageId?: string;
    to?: string[];
    html?: string;
  };
  fullContent?: {
    text: string;
    html?: string;
    from: string;
    to: string[];
  };
}

interface EmailConversationTabProps {
  lead: Lead;
  userId?: string;
}

export function EmailConversationTab({
  lead,
  userId,
}: EmailConversationTabProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [htmlViewEmails, setHtmlViewEmails] = useState<Set<string>>(new Set());

  const fetchEmails = async (showToast = false) => {
    if (!userId) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${lead._id}/emails`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      setEmails(data.emails || []);
      setLastSynced(new Date());

      if (showToast) {
        toast.success(`Synced ${data.count || 0} email(s)`, {
          description: data.warning || "Email sync completed successfully",
        });
      }

      if (data.warning) {
        setError(data.warning);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch emails";
      setError(errorMessage);

      if (showToast) {
        toast.error("Email sync failed", {
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch emails on component mount
  useEffect(() => {
    fetchEmails();
  }, [lead._id, userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getEmailIcon = (direction: "INBOUND" | "OUTBOUND") => {
    return direction === "INBOUND" ? (
      <Inbox className="h-4 w-4 text-blue-600" />
    ) : (
      <Send className="h-4 w-4 text-green-600" />
    );
  };

  const getEmailBadgeColor = (direction: "INBOUND" | "OUTBOUND") => {
    return direction === "INBOUND"
      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
      : "bg-green-100 text-green-800 hover:bg-green-200";
  };

  const toggleEmailExpansion = (emailId: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const isEmailExpanded = (emailId: string) => {
    return expandedEmails.has(emailId);
  };

  const toggleHtmlView = (emailId: string) => {
    setHtmlViewEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const isHtmlView = (emailId: string) => {
    return htmlViewEmails.has(emailId);
  };

  const getDisplayContent = (
    email: EmailMessage,
    emailId: string,
    maxLength = 150
  ) => {
    const isHtml = isHtmlView(emailId);
    const content =
      isHtml && email.fullContent?.html
        ? email.fullContent.html
        : email.content;

    if (content.length <= maxLength) return content;
    if (isEmailExpanded(emailId)) return content;
    return content.substring(0, maxLength) + "...";
  };

  const hasHtmlContent = (email: EmailMessage) => {
    return !!(email.fullContent?.html || email.emailData?.html);
  };

  return (
    <div className="space-y-6">
      {/* Header with sync controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Conversations
          </h3>
          <p className="text-sm text-muted-foreground">
            Emails with {lead.contactPerson} ({lead.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSynced && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last synced: {formatRelativeTime(lastSynced.toISOString())}
            </div>
          )}

          <Button
            onClick={() => fetchEmails(true)}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing..." : "Sync Emails"}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Warning</p>
                <p>{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email list */}
      {emails.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-8">
              <MailOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h4 className="text-lg font-medium">No emails found</h4>
                <p className="text-muted-foreground">
                  No email conversations found with this client yet.
                </p>
              </div>
              <Button onClick={() => fetchEmails(true)} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for emails
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Email count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {emails.length} email{emails.length !== 1 ? "s" : ""} found
          </div>

          {/* Email timeline */}
          <div className="space-y-3">
            {emails.map((email, index) => (
              <Card key={email._id || index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getEmailIcon(email.direction)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={getEmailBadgeColor(email.direction)}
                          >
                            {email.direction === "INBOUND"
                              ? "Received"
                              : "Sent"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(email.sentAt)}
                          </span>
                        </div>

                        {email.subject && (
                          <h4 className="font-medium text-sm leading-relaxed">
                            {email.subject}
                          </h4>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {email.direction === "INBOUND"
                            ? `From: ${lead.contactPerson}`
                            : `To: ${lead.contactPerson}`}
                          {email.sentBy && (
                            <span className="ml-2">by {email.sentBy.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(email.sentAt)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none">
                    {/* Email Content Display */}
                    <div
                      className={`text-sm text-gray-700 bg-gray-50 p-3 rounded-md border ${
                        isHtmlView(email._id) ? "" : "whitespace-pre-wrap"
                      }`}
                    >
                      {isHtmlView(email._id) &&
                      (email.fullContent?.html || email.emailData?.html) ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              email.fullContent?.html ||
                              email.emailData?.html ||
                              "",
                          }}
                        />
                      ) : (
                        getDisplayContent(email, email._id)
                      )}
                    </div>

                    {/* Email Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Show More/Less Button */}
                      {email.content.length > 150 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEmailExpansion(email._id)}
                          className="h-6 px-2 text-xs"
                        >
                          {isEmailExpanded(email._id) ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Show More
                            </>
                          )}
                        </Button>
                      )}

                      {/* HTML/Text Toggle Button */}
                      {hasHtmlContent(email) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleHtmlView(email._id)}
                          className="h-6 px-2 text-xs"
                        >
                          {isHtmlView(email._id) ? (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Show Text
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Show HTML
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load more placeholder for future pagination */}
          {emails.length >= 20 && (
            <div className="text-center py-4">
              <Button variant="ghost" size="sm">
                Load older emails
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
