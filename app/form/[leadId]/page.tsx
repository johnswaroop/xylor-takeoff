"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
// Alert component is not available, we'll use div instead
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { DEFAULT_QUALIFIER_FORM, QualifierQuestion } from "@/lib/types/lead";

interface FormResponse {
  [key: string]: string | File | null;
}

interface LeadInfo {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  projectType: string;
}

export default function QualifierFormPage() {
  const params = useParams();
  const leadId = params.leadId as string;

  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);
  const [responses, setResponses] = useState<FormResponse>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    fetchLeadInfo();
  }, [leadId]);

  const fetchLeadInfo = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/qualifier`);
      if (!response.ok) throw new Error("Failed to fetch lead information");
      const data = await response.json();
      setLeadInfo(data.lead);
    } catch {
      setError("Failed to load form. Please check your link and try again.");
    }
  };

  const calculateProgress = () => {
    const requiredQuestions = DEFAULT_QUALIFIER_FORM.questions.filter(
      (q) => q.required
    );
    const answeredRequired = requiredQuestions.filter((q) => responses[q.id]);
    return (answeredRequired.length / requiredQuestions.length) * 100;
  };

  const handleInputChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    if (!file) return;

    setUploading(questionId);
    try {
      // Generate presigned URL
      const response = await fetch(
        `/api/generate-presigned-s3-url?filename=${encodeURIComponent(
          file.name
        )}&filetype=${encodeURIComponent(file.type)}`
      );

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { url } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      // Store the S3 URL (remove query parameters for clean URL)
      const fileUrl = url.split("?")[0];
      setUploadedFiles((prev) => ({
        ...prev,
        [questionId]: fileUrl,
      }));

      setResponses((prev) => ({
        ...prev,
        [questionId]: fileUrl,
      }));
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const validateForm = () => {
    const requiredQuestions = DEFAULT_QUALIFIER_FORM.questions.filter(
      (q) => q.required
    );
    const missingRequired = requiredQuestions.filter((q) => !responses[q.id]);
    return missingRequired.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/qualifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form");
      }

      setSubmitted(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to submit form"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: QualifierQuestion) => {
    const value = responses[question.id] || "";

    switch (question.type) {
      case "text":
        return (
          <Input
            id={question.id}
            value={value as string}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={question.id}
            value={value as string}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            rows={4}
          />
        );

      case "select":
        return (
          <select
            id={question.id}
            value={value as string}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            required={question.required}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${question.id}-${option}`}
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor={`${question.id}-${option}`}
                  className="text-sm font-medium text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (error && !leadInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Form
              </h2>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Thank You!
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Your qualification form has been submitted successfully. Our
                team will review your information and get back to you soon.
              </p>
              {leadInfo && (
                <div className="text-xs text-gray-500">
                  Reference: {leadInfo.companyName} - {leadInfo.contactPerson}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!leadInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Project Qualification Form
            </CardTitle>
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                <strong>{leadInfo.companyName}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Contact: {leadInfo.contactPerson} • Project:{" "}
                {leadInfo.projectType}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(calculateProgress())}% complete</span>
              </div>
              <Progress value={calculateProgress()} className="w-full" />
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {DEFAULT_QUALIFIER_FORM.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label
                    htmlFor={question.id}
                    className="text-base font-medium"
                  >
                    {question.label}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>

                  {question.id === "plans-available" && (
                    <div className="space-y-4">
                      {renderQuestion(question)}

                      {/* File upload for plans */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Upload architectural plans (optional)
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.dwg,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload("plan-upload", file);
                            }}
                            disabled={uploading === "plan-upload"}
                            className="hidden"
                            id="plan-upload"
                          />
                          <label
                            htmlFor="plan-upload"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                          >
                            {uploading === "plan-upload" ? (
                              <>Uploading...</>
                            ) : uploadedFiles["plan-upload"] ? (
                              <>✓ File Uploaded</>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                              </>
                            )}
                          </label>
                          {uploadedFiles["plan-upload"] && (
                            <p className="text-xs text-green-600 mt-2">
                              File uploaded successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {question.id !== "plans-available" &&
                    renderQuestion(question)}
                </div>
              ))}

              {error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || calculateProgress() < 100}
                >
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>Submit Qualification Form</>
                  )}
                </Button>

                {calculateProgress() < 100 && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please complete all required fields to submit
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
