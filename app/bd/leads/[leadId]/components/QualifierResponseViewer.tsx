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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Badge variant="default" className="bg-green-100 text-green-800">
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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Qualification Form Response
          </DialogTitle>
          <DialogDescription>
            Response from {lead.contactPerson} at {lead.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Form Responses */}
          <div className="w-1/2 border-r">
            <div className="h-full px-6 overflow-y-auto">
              <div className="space-y-6 pb-6">
                {/* Submission Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Response Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">
                          Total Responses:
                        </span>
                        <p className="text-lg font-bold text-blue-600">
                          {responses.length}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Status:
                        </span>
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 ml-2"
                        >
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Responses */}
                <div className="space-y-4">
                  {responses.map((field) => {
                    const IconComponent = field.icon;

                    return (
                      <Card
                        key={field.id}
                        className="hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-1">
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
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">
                                    Floor plan PDF uploaded
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setShowPdfViewer(!showPdfViewer)
                                      }
                                      className="flex items-center gap-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                      {showPdfViewer ? "Hide" : "View"} PDF
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleDownloadPdf}
                                      className="flex items-center gap-1"
                                    >
                                      <Download className="h-3 w-3" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-gray-700 break-words">
                                    {formatValue(field)}
                                  </p>
                                  {field.type === "textarea" &&
                                    field.value &&
                                    String(field.value).length > 100 && (
                                      <p className="text-xs text-gray-500">
                                        {String(field.value).length} characters
                                      </p>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Empty State */}
                {responses.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">
                        No Response Data
                      </h3>
                      <p className="text-gray-500">
                        This lead hasn&apos;t submitted a qualification form
                        yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - PDF Viewer */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Floor Plan PDF
                </h3>
                {pdfFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePdfPageChange("prev")}
                      disabled={currentPdfPage <= 1}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      {currentPdfPage} / {numPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePdfPageChange("next")}
                      disabled={currentPdfPage >= numPages}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePdfZoom("out")}
                      disabled={pdfScale <= 0.5}
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <span className="text-sm text-gray-600 px-1">
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
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {!pdfResponse?.value ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">
                        No PDF Available
                      </h3>
                      <p className="text-gray-500">
                        No floor plan was uploaded with this response.
                      </p>
                    </div>
                  </div>
                ) : pdfLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                      <p className="text-gray-600">Loading PDF...</p>
                    </div>
                  </div>
                ) : pdfError ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">
                        PDF Load Error
                      </h3>
                      <p className="text-gray-500 mb-3">{pdfError}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadPDF(pdfResponse.value as string)}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : pdfFile && showPdfViewer ? (
                  <div className="flex justify-center">
                    <Document
                      file={pdfFile}
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      }
                      error={
                        <div className="text-center p-8">
                          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                          <p className="text-gray-600">Failed to load PDF</p>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPdfPage}
                        scale={pdfScale}
                        rotate={pdfRotation}
                        loading={
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        }
                        error={
                          <div className="text-center p-4">
                            <p className="text-gray-600">Failed to load page</p>
                          </div>
                        }
                      />
                    </Document>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">
                        PDF Available
                      </h3>
                      <p className="text-gray-500 mb-3">
                        Click &quot;View PDF&quot; to display the floor plan.
                      </p>
                      <Button
                        onClick={() => setShowPdfViewer(true)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
