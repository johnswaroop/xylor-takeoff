"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  ArrowRight,
  Check,
  Building,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import UserRegistrationForm from "@/components/UserRegistrationForm";
import { toast } from "sonner";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface Lead {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  createdAt: string;
  qualifierFormData?: {
    [key: string]: string | string[] | boolean | number | null | undefined;
  };
  status?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.leadid as string;

  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadLoading, setLeadLoading] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is already registered
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const storedUserInfo = localStorage.getItem("user_info");

    if (storedUserId && storedUserInfo) {
      setIsUserRegistered(true);
      const userInfo = JSON.parse(storedUserInfo);
      toast.success(`Welcome back, ${userInfo.name}!`, {
        description: "You can now upload your floor plans.",
      });
    }
  }, []);

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) return;

      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setLeadLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/leads/${leadId}`, {
          headers: {
            "x-user-id": userId,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch lead data");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch lead");
        }

        setLead(data.lead);
      } catch (error) {
        console.error("Error fetching lead:", error);
        toast.error("Failed to load lead details", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLeadLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  // Extract S3 key from PDF URL
  const extractS3Key = useCallback((s3Url: string): string | null => {
    try {
      const url = new URL(s3Url);

      // Format 1 & 2: bucket.s3.[region.]amazonaws.com/key
      if (
        url.hostname.includes(".s3.") &&
        url.hostname.includes(".amazonaws.com")
      ) {
        return decodeURIComponent(url.pathname.substring(1)); // Remove leading slash
      }

      // Format 3 & 4: s3.[region.]amazonaws.com/bucket/key
      if (
        url.hostname.includes("s3.") &&
        url.hostname.includes(".amazonaws.com")
      ) {
        const pathParts = url.pathname
          .split("/")
          .filter((part) => part.length > 0);
        if (pathParts.length >= 2) {
          return decodeURIComponent(pathParts.slice(1).join("/"));
        }
      }

      // Format 5: Direct S3 key
      if (
        !url.hostname.includes("amazonaws.com") &&
        s3Url.startsWith("xylo-leads/")
      ) {
        return s3Url;
      }

      return null;
    } catch (error) {
      console.error("Error extracting S3 key:", error);
      return null;
    }
  }, []);

  // Generate presigned download URL
  const generateDownloadUrl = useCallback(
    async (s3Key: string): Promise<string> => {
      const response = await fetch(
        `/api/generate-presigned-s3-url?operation=download&key=${encodeURIComponent(
          s3Key
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate download URL");
      }

      const data = await response.json();
      return data.url;
    },
    []
  );

  // Download lead PDF
  const downloadLeadPdf = useCallback(async () => {
    const pdfUrl = lead?.qualifierFormData?.["plan-upload"];

    if (!pdfUrl || typeof pdfUrl !== "string") {
      toast.error("No PDF available", {
        description: "This lead doesn't have a floor plan uploaded.",
      });
      return;
    }

    const toastId = toast.loading("Opening PDF...", {
      description: "Generating secure access link.",
    });

    try {
      const s3Key = extractS3Key(pdfUrl);

      if (!s3Key) {
        throw new Error("Invalid PDF URL format");
      }

      const downloadUrl = await generateDownloadUrl(s3Key);

      // Open PDF in new tab
      window.open(downloadUrl, "_blank");

      toast.success("PDF opened!", {
        id: toastId,
        description: "Your floor plan PDF is opening in a new tab.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }, [lead, extractS3Key, generateDownloadUrl]);

  const handleRegistrationComplete = useCallback(() => {
    setIsUserRegistered(true);
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile && selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError("");
        setSelectedPage(1);
        setIsComplete(false);
        toast.success("PDF uploaded successfully!", {
          description: `${selectedFile.name} is ready for processing.`,
        });
      } else {
        const errorMsg = "Please select a valid PDF file";
        setError(errorMsg);
        setFile(null);
        toast.error("Invalid file type", {
          description: "Please select a PDF file to continue.",
        });
      }
    },
    []
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setSelectedPage(1);
      toast.success("PDF loaded successfully!", {
        description: `Document has ${numPages} page${
          numPages > 1 ? "s" : ""
        }. Select the page you want to analyze.`,
      });
    },
    []
  );

  const onDocumentLoadError = useCallback(() => {
    const errorMsg = "Could not load PDF file";
    setError(errorMsg);
    toast.error("Failed to load PDF", {
      description:
        "The PDF file could not be processed. Please try a different file.",
    });
  }, []);

  const savePageForNextStep = useCallback(async () => {
    if (!file || selectedPage < 1 || selectedPage > numPages) {
      const errorMsg = "Please select a valid page";
      setError(errorMsg);
      toast.error("Invalid page selection", {
        description: "Please select a valid page number.",
      });
      return;
    }

    setIsProcessing(true);
    setError("");

    const toastId = toast.loading("Processing your floor plan...", {
      description: "Converting PDF page to image format for analysis.",
    });

    try {
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(selectedPage);

          // Create canvas for rendering
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Could not create canvas");
          }

          // High quality rendering
          const scale = 2;
          const viewport = page.getViewport({ scale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Convert to blob and save
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64String = reader.result as string;

                  // Save for next step
                  localStorage.setItem("floorplan_image", base64String);
                  localStorage.setItem(
                    "floorplan_metadata",
                    JSON.stringify({
                      filename: file.name,
                      pageNumber: selectedPage,
                      totalPages: numPages,
                      timestamp: Date.now(),
                    })
                  );

                  setIsComplete(true);
                  setIsProcessing(false);

                  toast.success("Floor plan processed successfully!", {
                    id: toastId,
                    description: `Page ${selectedPage} from ${file.name} is ready for wall detection. Redirecting...`,
                  });

                  // Store leadId for later use in estimation
                  localStorage.setItem("current_lead_id", leadId);

                  // Automatically redirect to mark page after a short delay
                  setTimeout(() => {
                    router.push(`/estimator/mark?leadId=${leadId}`);
                  }, 1500);
                };
                reader.readAsDataURL(blob);
              }
            },
            "image/png",
            0.9
          );
        } catch {
          const errorMsg = "Failed to process page";
          setError(errorMsg);
          setIsProcessing(false);
          toast.error("Processing failed", {
            id: toastId,
            description:
              "Could not convert the PDF page. Please try again or select a different page.",
          });
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch {
      const errorMsg = "Failed to process page";
      setError(errorMsg);
      setIsProcessing(false);
      toast.error("Processing failed", {
        id: toastId,
        description:
          "An error occurred while processing your file. Please try again.",
      });
    }
  }, [file, selectedPage, numPages, router]);

  const startOver = useCallback(() => {
    setFile(null);
    setNumPages(0);
    setSelectedPage(1);
    setIsComplete(false);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Starting over", {
      description: "You can now select a new PDF file to upload.",
    });
  }, []);

  const goToMarkPage = useCallback(() => {
    toast.info("Navigating to marking page...");
    router.push(`/estimator/mark?leadId=${leadId}`);
  }, [router, leadId]);

  // Step 0: User Registration (if not already registered)
  if (!isUserRegistered) {
    return (
      <UserRegistrationForm
        onRegistrationComplete={handleRegistrationComplete}
      />
    );
  }

  // Lead Details Section (shown on all steps)
  const LeadDetailsSection = () => {
    if (leadLoading) {
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Loading Lead Details...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!lead) {
      return (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Lead Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Could not load lead details. Please check the lead ID and try
              again.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Lead Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* First row - Company, Contact Person, Created */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Company
                </div>
                <p className="font-medium">{lead.companyName}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Contact Person
                </div>
                <p className="font-medium">{lead.contactPerson}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created
                </div>
                <p className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Second row - Email (full width) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="font-medium break-all">{lead.email}</p>
            </div>
          </div>

          {lead.qualifierFormData?.["plan-upload"] &&
            typeof lead.qualifierFormData["plan-upload"] === "string" && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Floor Plan PDF
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Original floor plan uploaded with this lead
                    </p>
                  </div>
                  <Button
                    onClick={downloadLeadPdf}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Open PDF
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  // Step 1: Upload
  if (!file) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <LeadDetailsSection />

        <div className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Upload Floor Plan</h1>
            <p className="text-muted-foreground">
              Upload your PDF floor plan to get started with wall detection
              analysis
            </p>
          </div>

          {/* Instructions Card */}
          <Card className="text-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Upload Requirements & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-blue-700">
                  📄 File Format
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>PDF files only</strong> - We currently support PDF
                    format exclusively
                  </li>
                  <li>
                    • Ensure your floor plan is saved as a high-quality PDF
                    document
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-700">
                  📐 Page Size & Standards
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Standard paper sizes recommended:</strong> A1, A2,
                    A3, A4, or architectural formats
                  </li>
                  <li>
                    • Avoid custom or non-standard page dimensions when possible
                  </li>
                  <li>• Ensure the floor plan fills most of the page area</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-purple-700">
                  ⚙️ Scale & Configuration
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Set proper scale and dimensions</strong> in your
                    CAD/design software before exporting
                  </li>
                  <li>
                    • Include a scale reference (e.g., &quot;1:100&quot;,
                    &quot;1/4&quot; = 1&apos;-0&quot;) if possible
                  </li>
                  <li>• Ensure consistent units throughout your drawing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8">
            <div className="space-y-4">
              <Label
                htmlFor="pdf-upload"
                className="cursor-pointer w-full flex"
              >
                <div className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

                  <span className="text-lg font-medium">Choose PDF File</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select your floor plan PDF document
                  </p>

                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
              </Label>
              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Disclaimer:</strong> Since Xylor is a beta product
                  under initial public use, we would like to let you know that
                  the values may not be 100% accurate, and a variance of ~10%
                  may be observed. Please do not use Xylor to create commercial
                  estimations (yet), however feel free to test and share your
                  initial experience with us.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: View and Select Page
  if (file && !isComplete) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <LeadDetailsSection />
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Select Page</h1>
            <p className="text-muted-foreground">
              Choose the page you want to work with
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Viewer */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {file.name}
                  </span>
                  {numPages > 0 && (
                    <Badge variant="secondary">
                      Page {selectedPage} of {numPages}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    className="flex justify-center"
                  >
                    <Page
                      pageNumber={selectedPage}
                      width={Math.min(500, window.innerWidth - 100)}
                      className="shadow-sm"
                    />
                  </Document>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Page Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {numPages > 1 && (
                  <div className="space-y-2">
                    <Label>Choose Page</Label>
                    <Select
                      value={selectedPage.toString()}
                      onValueChange={(value) =>
                        setSelectedPage(parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: numPages }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Page {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={savePageForNextStep}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={startOver}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Choose Different File
                  </Button>
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Disclaimer:</strong> Since Xylor is a beta product
                    under initial public use, values may not be 100% accurate
                    with ~10% variance. Please do not use for commercial
                    estimations yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success (with auto-redirect)
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <LeadDetailsSection />
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <Check className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Ready for Next Step</h1>
          <p className="text-muted-foreground">
            Your floor plan page has been saved and is ready for processing
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Redirecting to marking page...
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-left">
              <p className="font-medium">Selected:</p>
              <p className="text-muted-foreground">
                {file.name} - Page {selectedPage} of {numPages}
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={goToMarkPage} className="w-full">
                Go to Marking Page Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button onClick={startOver} variant="outline" className="w-full">
                Upload Another Floor Plan
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
