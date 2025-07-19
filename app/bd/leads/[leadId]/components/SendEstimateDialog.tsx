"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Lead } from "@/lib/types/lead";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  FileText,
  Code,
  AlertTriangle,
  Send,
  DollarSign,
  Calendar,
  User,
  Building2,
} from "lucide-react";

interface SendEstimateDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

interface EstimateSummary {
  projectName?: string;
  totalAmount?: number;
  elementsCount?: number;
  hasHTML?: boolean;
  hasJSON?: boolean;
}

interface FlexibleEstimationData {
  projectName?: string;
  htmlData?: string;
  estimateData?: Record<string, unknown>;
  costBreakdown?: {
    total?: number;
    elements?: Record<string, unknown>[];
  };
}

export function SendEstimateDialog({
  lead,
  open,
  onOpenChange,
  onSent,
}: SendEstimateDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState(
    `Project Estimate - ${lead.companyName}`
  );
  const [message, setMessage] = useState("");
  const [includeJSON, setIncludeJSON] = useState(true);
  const [includeHTML, setIncludeHTML] = useState(true);

  // Get estimate summary from lead data
  const getEstimateSummary = (): EstimateSummary => {
    const estimationData = lead.estimationData as FlexibleEstimationData;
    if (!estimationData) {
      return {
        hasHTML: false,
        hasJSON: false,
      };
    }

    return {
      projectName: estimationData.projectName || lead.companyName,
      totalAmount: estimationData.costBreakdown?.total || 0,
      elementsCount: estimationData.costBreakdown?.elements?.length || 0,
      hasHTML: Boolean(estimationData.htmlData),
      hasJSON: Boolean(
        estimationData.estimateData || estimationData.costBreakdown
      ),
    };
  };

  const estimateSummary = getEstimateSummary();

  const handleSendEstimate = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setError("User ID not found");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/leads/${lead._id}/send-estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          includeJSON,
          includeHTML,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send estimate");
      }

      setSuccess(
        `Estimate sent successfully! ${data.attachmentCount} files attached.`
      );

      // Call onSent callback after a brief delay to show success message
      setTimeout(() => {
        onSent();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Error sending estimate:", err);
      setError(err instanceof Error ? err.message : "Failed to send estimate");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(null);
      setSubject(`Project Estimate - ${lead.companyName}`);
      setMessage("");
      setIncludeJSON(true);
      setIncludeHTML(true);
      onOpenChange(false);
    }
  };

  const canSendEstimate = Boolean(
    lead.estimationData &&
      (estimateSummary.hasJSON || estimateSummary.hasHTML) &&
      subject.trim() &&
      (includeJSON || includeHTML)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Estimate to Client
          </DialogTitle>
          <DialogDescription>
            Send the estimate for {lead.companyName} to {lead.contactPerson} at{" "}
            {lead.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estimate Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estimate Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Project:</span>{" "}
                    {estimateSummary.projectName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Total:</span> $
                    {estimateSummary.totalAmount?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Elements:</span>{" "}
                    {estimateSummary.elementsCount || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Created:</span>{" "}
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Company:</span>
                  <p className="text-sm text-muted-foreground">
                    {lead.companyName}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Contact:</span>
                  <p className="text-sm text-muted-foreground">
                    {lead.contactPerson}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-medium">Email:</span>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom message for the client. If left blank, a professional default message will be used."
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default professional message
              </p>
            </div>

            {/* Attachment Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Attachments</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">JSON Data File</div>
                      <div className="text-xs text-muted-foreground">
                        Raw estimate data for processing
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={includeJSON}
                    onCheckedChange={setIncludeJSON}
                    disabled={loading || !estimateSummary.hasJSON}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">HTML Document</div>
                      <div className="text-xs text-muted-foreground">
                        Professional formatted estimate
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={includeHTML}
                    onCheckedChange={setIncludeHTML}
                    disabled={loading || !estimateSummary.hasHTML}
                  />
                </div>
              </div>

              {!estimateSummary.hasJSON && !estimateSummary.hasHTML && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No estimate files available. The estimate may not have been
                    properly generated.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Send className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEstimate}
            disabled={loading || !canSendEstimate}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Estimate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
