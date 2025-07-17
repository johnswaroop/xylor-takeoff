"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CreateLeadFormData,
  LeadFormStepOne,
  LeadFormStepTwo,
  LeadFormStepThree,
} from "@/lib/types/lead";
import { ProjectType } from "@/lib/types/project-types";

// Import step components (we'll create these)
import StepOneLeadInfo from "./components/StepOneLeadInfo";
import StepTwoFormAssignment from "./components/StepTwoFormAssignment";
import StepThreeReviewSend from "./components/StepThreeReviewSend";

export default function CreateLeadPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [stepOneData, setStepOneData] = useState<LeadFormStepOne>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    projectType: ProjectType.RESIDENTIAL_NEW_BUILD,
    initialNotes: "",
  });

  const [stepTwoData, setStepTwoData] = useState<LeadFormStepTwo>({
    useDefaultForm: true,
    emailTemplate: "",
  });

  const [stepThreeData, setStepThreeData] = useState<LeadFormStepThree>({
    saveAsDraft: false,
    sendImmediately: true,
    scheduleDateTime: undefined,
    emailSubject: "",
    emailMessage: "",
  });

  const steps = [
    {
      number: 1,
      title: "Lead Information",
      description: "Basic details about the lead",
    },
    {
      number: 2,
      title: "Form Assignment",
      description: "Select qualification form",
    },
    {
      number: 3,
      title: "Review & Send",
      description: "Review and send to client",
    },
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!stepOneData.companyName.trim()) {
          toast.error("Company name is required");
          return false;
        }
        if (!stepOneData.contactPerson.trim()) {
          toast.error("Contact person is required");
          return false;
        }
        if (!stepOneData.email.trim()) {
          toast.error("Email is required");
          return false;
        }
        if (
          !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(stepOneData.email)
        ) {
          toast.error("Please enter a valid email address");
          return false;
        }
        return true;
      case 2:
        // Step 2 validation (form template selection)
        return true; // Template selection is optional
      case 3:
        // Step 3 validation
        if (!stepThreeData.saveAsDraft && stepThreeData.scheduleDateTime) {
          if (new Date(stepThreeData.scheduleDateTime) <= new Date()) {
            toast.error("Scheduled date must be in the future");
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Saving lead as draft...");

    try {
      const leadData: CreateLeadFormData = {
        ...stepOneData,
        useDefaultForm: stepTwoData.useDefaultForm,
        saveAsDraft: true,
        sendImmediately: false,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("user_id") || "", // Temporary auth
        },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Lead saved as draft successfully!", {
          id: toastId,
          description: "You can continue working on it later.",
        });
        router.push("/bd/dashboard");
      } else {
        toast.error("Failed to save draft", {
          id: toastId,
          description: result.error || "Please try again.",
        });
      }
    } catch {
      toast.error("Network error", {
        id: toastId,
        description: "Could not connect to server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    const action = stepThreeData.scheduleDateTime ? "Scheduling" : "Creating";
    const toastId = toast.loading(`${action} lead...`);

    try {
      const leadData: CreateLeadFormData = {
        ...stepOneData,
        useDefaultForm: stepTwoData.useDefaultForm,
        saveAsDraft: false,
        sendImmediately: stepThreeData.sendImmediately,
        scheduleDateTime: stepThreeData.scheduleDateTime,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("user_id") || "", // Temporary auth
        },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        let message: string;
        let description: string;

        if (stepThreeData.scheduleDateTime) {
          message = "Lead scheduled successfully!";
          description =
            "The qualifier will be sent at the scheduled time and status will be updated automatically.";
        } else {
          // Check if email was sent successfully
          if (result.emailSent === false) {
            message = "Lead created with email issues";
            description = `Lead saved successfully, but there was an issue sending the email: ${
              result.emailError || "Unknown email error"
            }. Status remains 'Preparing Qualifiers' - you can manually send the email later.`;
          } else {
            message = "Lead created and qualifier sent!";
            description =
              "The client will receive the qualification form shortly. Lead status updated to 'Qualifiers Sent'.";
          }
        }

        toast.success(message, {
          id: toastId,
          description,
        });
        router.push("/bd/dashboard");
      } else {
        toast.error("Failed to create lead", {
          id: toastId,
          description: result.error || "Please try again.",
        });
      }
    } catch {
      toast.error("Network error", {
        id: toastId,
        description: "Could not connect to server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepOneLeadInfo data={stepOneData} onChange={setStepOneData} />;
      case 2:
        return (
          <StepTwoFormAssignment
            data={stepTwoData}
            onChange={setStepTwoData}
            leadData={stepOneData}
          />
        );
      case 3:
        return (
          <StepThreeReviewSend
            stepOneData={stepOneData}
            stepTwoData={stepTwoData}
            stepThreeData={stepThreeData}
            onChange={setStepThreeData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/bd/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              Back to Dashboard
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Create New Lead
            </h1>
            <p className="text-lg text-muted-foreground">
              Add a new lead and send qualification forms to potential clients
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="mb-12">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-semibold">
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5"
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Save as Draft - available on all steps */}
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-muted-foreground border-muted-foreground/30"
            >
              Save as Draft
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-primary hover:bg-primary/90"
              >
                Next
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                {stepThreeData.scheduleDateTime ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-2.5 bg-primary hover:bg-primary/90"
                  >
                    Schedule Send
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-2.5 bg-primary hover:bg-primary/90"
                  >
                    Create & Send
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
