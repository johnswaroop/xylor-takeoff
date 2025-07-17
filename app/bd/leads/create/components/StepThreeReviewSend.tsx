"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Send,
  Edit,
  ExternalLink,
  Copy,
} from "lucide-react";
import {
  LeadFormStepOne,
  LeadFormStepTwo,
  LeadFormStepThree,
  DEFAULT_QUALIFIER_FORM,
} from "@/lib/types/lead";
import { PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
import { generatePreviewFormLink } from "@/lib/utils/form-links";

interface StepThreeReviewSendProps {
  stepOneData: LeadFormStepOne;
  stepTwoData: LeadFormStepTwo;
  stepThreeData: LeadFormStepThree;
  onChange: (data: LeadFormStepThree) => void;
}

export default function StepThreeReviewSend({
  stepOneData,
  stepTwoData,
  stepThreeData,
  onChange,
}: StepThreeReviewSendProps) {
  const [showEmailCustomization, setShowEmailCustomization] = useState(false);
  const [copied, setCopied] = useState(false);

  const formLink = generatePreviewFormLink();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleChange = (
    field: keyof LeadFormStepThree,
    value: string | boolean | Date | undefined
  ) => {
    onChange({
      ...stepThreeData,
      [field]: value,
    });
  };

  // Using the default qualifier form
  const hasQualifierForm = stepTwoData.useDefaultForm;

  return (
    <div className="space-y-6">
      {/* Lead Summary Review */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building className="h-4 w-4" />
                Company
              </div>
              <p className="text-sm text-muted-foreground">
                {stepOneData.companyName}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Contact Person
              </div>
              <p className="text-sm text-muted-foreground">
                {stepOneData.contactPerson}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="text-sm text-muted-foreground">
                {stepOneData.email}
              </p>
            </div>

            {stepOneData.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
                <p className="text-sm text-muted-foreground">
                  {stepOneData.phone}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Project Type
              </div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_TYPE_LABELS[stepOneData.projectType]}
              </p>
            </div>

            {stepOneData.address && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <p className="text-sm text-muted-foreground">
                  {stepOneData.address}
                </p>
              </div>
            )}
          </div>

          {stepOneData.initialNotes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Initial Notes</div>
                <p className="text-sm text-muted-foreground">
                  {stepOneData.initialNotes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Template Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Qualification Form</CardTitle>
        </CardHeader>
        <CardContent>
          {hasQualifierForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{DEFAULT_QUALIFIER_FORM.name}</p>
                  <p className="text-sm text-muted-foreground">
                    This form will be sent to {stepOneData.contactPerson}
                  </p>
                </div>
              </div>

              {/* Form Link Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-sm font-medium">Form Link Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background px-2 py-1 rounded border">
                    {formLink}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This link will be included in the email sent to the client.
                  Once the lead is created, [leadId] will be replaced with the
                  actual ID.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No qualification form will be sent
            </p>
          )}
        </CardContent>
      </Card>

      {/* Send Options */}
      <Card>
        <CardHeader>
          <CardTitle>Send Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Send Option */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Schedule for later</Label>
              <p className="text-sm text-muted-foreground">
                Schedule the qualification form to be sent at a specific time
              </p>
            </div>
            <Switch
              checked={!!stepThreeData.scheduleDateTime}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Set default to tomorrow at 9 AM
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  handleChange("scheduleDateTime", tomorrow);
                } else {
                  handleChange("scheduleDateTime", undefined);
                }
              }}
            />
          </div>

          {stepThreeData.scheduleDateTime && (
            <div className="space-y-2">
              <Label
                htmlFor="scheduleDateTime"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Schedule Date & Time
              </Label>
              <Input
                id="scheduleDateTime"
                type="datetime-local"
                value={
                  stepThreeData.scheduleDateTime
                    ? new Date(
                        stepThreeData.scheduleDateTime.getTime() -
                          stepThreeData.scheduleDateTime.getTimezoneOffset() *
                            60000
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  handleChange("scheduleDateTime", new Date(e.target.value))
                }
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Email Customization */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Customize email message</Label>
                <p className="text-sm text-muted-foreground">
                  Personalize the email that will be sent with the qualification
                  form
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setShowEmailCustomization(!showEmailCustomization)
                }
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {showEmailCustomization ? "Hide" : "Customize"}
              </Button>
            </div>

            {showEmailCustomization && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input
                    id="emailSubject"
                    placeholder="Project Qualification - [Company Name]"
                    value={stepThreeData.emailSubject || ""}
                    onChange={(e) =>
                      handleChange("emailSubject", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailMessage">Email Message</Label>
                  <Textarea
                    id="emailMessage"
                    placeholder="Dear [Contact Name],&#10;&#10;Thank you for your interest in our construction services. Please complete the attached qualification form so we can better understand your project requirements.&#10;&#10;Best regards,&#10;[Your Name]"
                    value={stepThreeData.emailMessage || ""}
                    onChange={(e) =>
                      handleChange("emailMessage", e.target.value)
                    }
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables like [Contact Name] and [Company Name] will be
                    automatically replaced
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Final Action Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Send className="h-5 w-5" />
              Ready to {stepThreeData.scheduleDateTime ? "Schedule" : "Send"}
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground">
                {stepThreeData.scheduleDateTime ? (
                  <>
                    The qualification form will be sent to{" "}
                    <strong>{stepOneData.email}</strong> on{" "}
                    <strong>
                      {stepThreeData.scheduleDateTime.toLocaleDateString()}
                    </strong>{" "}
                    at{" "}
                    <strong>
                      {stepThreeData.scheduleDateTime.toLocaleTimeString()}
                    </strong>
                  </>
                ) : (
                  <>
                    The qualification form will be sent immediately to{" "}
                    <strong>{stepOneData.email}</strong>
                  </>
                )}
              </p>

              {hasQualifierForm && (
                <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email Details</span>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Subject:</strong>{" "}
                      {stepThreeData.emailSubject ||
                        `Project Qualification Form - ${stepOneData.companyName}`}
                    </p>
                    {stepThreeData.emailMessage && (
                      <p>
                        <strong>Custom Message:</strong> Included
                      </p>
                    )}
                    <p>
                      <strong>Contains:</strong> Interactive form link, project
                      details, and professional email template
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
