"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import {
  LeadFormStepOne,
  LeadFormStepTwo,
  DEFAULT_QUALIFIER_FORM,
} from "@/lib/types/lead";

interface StepTwoFormAssignmentProps {
  data: LeadFormStepTwo;
  onChange: (data: LeadFormStepTwo) => void;
  leadData: LeadFormStepOne;
}

export default function StepTwoFormAssignment({
  data,
  onChange,
  leadData,
}: StepTwoFormAssignmentProps) {
  // Auto-enable the default form when component mounts
  useEffect(() => {
    if (!data.hasOwnProperty("useDefaultForm")) {
      onChange({
        ...data,
        useDefaultForm: true,
      });
    }
  }, [data, onChange]);

  const handleToggleForm = (checked: boolean) => {
    onChange({
      ...data,
      useDefaultForm: checked,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Qualification Form</h3>
        <p className="text-muted-foreground">
          Configure the qualification form to send to{" "}
          <strong>{leadData.contactPerson}</strong> at{" "}
          <strong>{leadData.companyName}</strong>
        </p>
      </div>

      {/* Default Form Option */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {DEFAULT_QUALIFIER_FORM.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="use-default-form">Send qualification form</Label>
              <Switch
                id="use-default-form"
                checked={data.useDefaultForm || false}
                onCheckedChange={handleToggleForm}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {DEFAULT_QUALIFIER_FORM.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{DEFAULT_QUALIFIER_FORM.questions.length} questions</span>
              <span>•</span>
              <span>5-10 minutes to complete</span>
            </div>

            {data.useDefaultForm && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Form Questions Preview
                </div>
                <div className="space-y-2 text-sm">
                  {DEFAULT_QUALIFIER_FORM.questions
                    .slice(0, 5)
                    .map((question, index) => (
                      <div key={question.id} className="flex items-start gap-2">
                        <span className="text-muted-foreground font-mono text-xs mt-0.5">
                          {index + 1}.
                        </span>
                        <span className="text-muted-foreground">
                          {question.label}
                          {question.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </span>
                      </div>
                    ))}
                  {DEFAULT_QUALIFIER_FORM.questions.length > 5 && (
                    <div className="text-xs text-muted-foreground italic">
                      + {DEFAULT_QUALIFIER_FORM.questions.length - 5} more
                      questions...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!data.useDefaultForm && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                No qualification form will be sent. The lead will be created
                without client qualification.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
