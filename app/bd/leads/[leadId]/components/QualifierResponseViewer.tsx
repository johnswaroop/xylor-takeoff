"use client";

import { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Building,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Lead } from "@/lib/types/lead";
import { usePDF } from "@/lib/hooks/usePDF";
import { toast } from "sonner";

interface QualifierResponseViewerProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ResponseField {
  id: string;
  label: string;
  value: string | string[] | boolean | number | null;
  type: "text" | "select" | "textarea" | "radio" | "file" | "date";
  icon: React.ComponentType<{ className?: string }>;
}

export function QualifierResponseViewer({
  lead,
  open,
  onOpenChange,
}: QualifierResponseViewerProps) {
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfRotation, setPdfRotation] = useState(0);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const {
    pdfFile,
    numPages,
    loading: pdfLoading,
    error: pdfError,
    loadPDF,
  } = usePDF();

  // Parse and organize qualifier form responses
  const parseResponses = (): ResponseField[] => {
    if (!lead.qualifierFormData) return [];

    const responses: ResponseField[] = [];
    const formData = lead.qualifierFormData;

    // Map known form fields with proper labels and icons
    const fieldMappings = [
      {
        id: "project-description",
        label: "Project Description",
        type: "textarea" as const,
        icon: Building,
      },
      {
        id: "project-budget",
        label: "Project Budget Range",
        type: "select" as const,
        icon: DollarSign,
      },
      {
        id: "funding-secured",
        label: "Project Funding Status",
        type: "radio" as const,
        icon: CheckCircle,
      },
      {
        id: "council-approval",
        label: "Council Approval Status",
        type: "radio" as const,
        icon: FileText,
      },
      {
        id: "plans-available",
        label: "Architectural Plans Status",
        type: "radio" as const,
        icon: Building,
      },
      {
        id: "timeline",
        label: "Preferred Timeline",
        type: "select" as const,
        icon: Calendar,
      },
      {
        id: "additional-info",
        label: "Additional Information",
        type: "textarea" as const,
        icon: Info,
      },
      {
        id: "plan-upload",
        label: "Floor Plan PDF",
        type: "file" as const,
        icon: FileText,
      },
    ];

    // Add submission metadata
    if (formData.submittedAt) {
      responses.push({
        id: "submittedAt",
        label: "Submitted Date",
        value: new Date(formData.submittedAt as string).toLocaleString(),
        type: "date",
        icon: Clock,
      });
    }

    // Process known fields
    fieldMappings.forEach((mapping) => {
      const value = formData[mapping.id];
      if (value !== undefined && value !== null) {
        // Convert File objects to strings for display
        const displayValue = value instanceof File ? value.name : value;
        responses.push({
          ...mapping,
          value: displayValue,
        });
      }
    });

    // Process any additional unknown fields
    Object.entries(formData).forEach(([key, value]) => {
      if (
        !fieldMappings.find((m) => m.id === key) &&
        key !== "submittedAt" &&
        key !== "submittedFrom" &&
        value !== undefined &&
        value !== null
      ) {
        // Convert File objects to strings for display
        const displayValue = value instanceof File ? value.name : value;
        responses.push({
          id: key,
          label: key
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: displayValue,
          type: "text",
          icon: Info,
        });
      }
    });

    return responses;
  };

  const responses = parseResponses();
  const pdfResponse = responses.find((r) => r.id === "plan-upload");

  // Load PDF when dialog opens and PDF URL is available
  useEffect(() => {
    if (open && pdfResponse?.value && typeof pdfResponse.value === "string") {
      loadPDF(pdfResponse.value);
    }
  }, [open, pdfResponse?.value, loadPDF]);

  const formatValue = (field: ResponseField): string => {
    if (field.value === null || field.value === undefined)
      return "Not provided";

    if (Array.isArray(field.value)) {
      return field.value.join(", ");
    }

    if (typeof field.value === "boolean") {
      return field.value ? "Yes" : "No";
    }

    if (field.type === "file" && typeof field.value === "string") {
      return "PDF uploaded";
    }

    return String(field.value);
  };

  const getStatusBadge = (
    value: string | string[] | boolean | number | null
  ) => {
    const strValue = String(value).toLowerCase();

    if (
      strValue.includes("yes") ||
      strValue.includes("secured") ||
      strValue.includes("approved") ||
      strValue.includes("ready")
    ) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 border-green-200"
        >
          ✓ Positive
        </Badge>
      );
    }

    if (
      strValue.includes("no") ||
      strValue.includes("not") ||
      strValue.includes("rejected")
    ) {
      return <Badge variant="destructive">✗ Negative</Badge>;
    }

    if (
      strValue.includes("progress") ||
      strValue.includes("pending") ||
      strValue.includes("application")
    ) {
      return <Badge variant="secondary">⏳ In Progress</Badge>;
    }

    return null;
  };

  const handleDownloadPdf = async () => {
    if (!pdfResponse?.value || typeof pdfResponse.value !== "string") {
      toast.error("No PDF available for download");
      return;
    }

    try {
      // Generate presigned download URL
      const s3Key = pdfResponse.value.includes("xylo-leads/")
        ? pdfResponse.value.split("xylo-leads/")[1] || pdfResponse.value
        : pdfResponse.value;

      const response = await fetch(
        `/api/generate-presigned-s3-url?operation=download&key=${encodeURIComponent(
          `xylo-leads/${s3Key}`
        )}`
      );

      if (!response.ok) throw new Error("Failed to generate download URL");

      const data = await response.json();

      // Trigger download
      const downloadLink = document.createElement("a");
      downloadLink.href = data.url;
      downloadLink.download = `${lead.companyName}_floor_plan.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success("PDF download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handlePdfPageChange = (direction: "prev" | "next") => {
    if (direction === "prev" && currentPdfPage > 1) {
      setCurrentPdfPage(currentPdfPage - 1);
    } else if (direction === "next" && currentPdfPage < numPages) {
      setCurrentPdfPage(currentPdfPage + 1);
    }
  };

  const handlePdfZoom = (direction: "in" | "out") => {
    if (direction === "in" && pdfScale < 3.0) {
      setPdfScale(pdfScale + 0.2);
    } else if (direction === "out" && pdfScale > 0.5) {
      setPdfScale(pdfScale - 0.2);
    }
  };

  const handlePdfRotate = () => {
    setPdfRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            Qualification Form Response
          </DialogTitle>
          <DialogDescription>
            Response from{" "}
            <span className="font-medium">{lead.contactPerson}</span> at{" "}
            <span className="font-medium">{lead.companyName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Full Width Simplified Layout */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Simple Summary */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {responses.length} responses completed
                </span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                ✓ Completed
              </Badge>
            </div>

            {/* Simplified Form Responses */}
            <div className="space-y-3">
              {responses.map((field) => {
                const IconComponent = field.icon;

                return (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-blue-50 text-blue-600 mt-0.5">
                        <IconComponent className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {field.label}
                          </h4>
                          {getStatusBadge(field.value)}
                        </div>

                        {field.type === "file" && field.value ? (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border-dashed border">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-sm text-gray-700">
                                Floor plan PDF uploaded
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowPdfViewer(!showPdfViewer)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {showPdfViewer ? "Hide" : "View"}
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={handleDownloadPdf}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded p-3 border">
                            <p className="text-gray-900 text-sm leading-relaxed">
                              {formatValue(field)}
                            </p>
                            {field.type === "textarea" &&
                              field.value &&
                              String(field.value).length > 100 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {String(field.value).length} characters
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simplified PDF Viewer */}
            {pdfResponse?.value && showPdfViewer && (
              <div className="border rounded-lg">
                <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Floor Plan PDF
                  </h3>
                  {pdfFile && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePdfPageChange("prev")}
                        disabled={currentPdfPage <= 1}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600 px-2">
                        {currentPdfPage}/{numPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePdfPageChange("next")}
                        disabled={currentPdfPage >= numPages}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      <Separator orientation="vertical" className="h-5 mx-1" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePdfZoom("out")}
                        disabled={pdfScale <= 0.5}
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600 px-1">
                        {Math.round(pdfScale * 100)}%
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePdfZoom("in")}
                        disabled={pdfScale >= 3.0}
                      >
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePdfRotate}
                      >
                        <RotateCw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-center min-h-[300px]">
                    {pdfLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Loading PDF...
                          </p>
                        </div>
                      </div>
                    ) : pdfError ? (
                      <div className="flex items-center justify-center text-center">
                        <div>
                          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                          <h3 className="font-medium text-gray-900 mb-1">
                            PDF Load Error
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {pdfError}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadPDF(pdfResponse.value as string)}
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    ) : pdfFile ? (
                      <Document
                        file={pdfFile}
                        loading={
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        }
                        error={
                          <div className="text-center p-4">
                            <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-1" />
                            <p className="text-sm text-gray-600">
                              Failed to load PDF
                            </p>
                          </div>
                        }
                      >
                        <Page
                          pageNumber={currentPdfPage}
                          scale={pdfScale}
                          rotate={pdfRotation}
                          loading={
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            </div>
                          }
                          error={
                            <div className="text-center p-4">
                              <p className="text-sm text-gray-600">
                                Failed to load page
                              </p>
                            </div>
                          }
                        />
                      </Document>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Simple Empty State */}
            {responses.length === 0 && (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">
                  No Response Data Available
                </h3>
                <p className="text-sm text-gray-500">
                  This lead hasn&apos;t submitted a qualification form response
                  yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
