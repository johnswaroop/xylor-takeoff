import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { extractS3Key } from "@/lib/utils";
import { pdfjs } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface UsePDFReturn {
  pdfFile: { data: Uint8Array } | null;
  numPages: number;
  loading: boolean;
  error: string;
  loadPDF: (pdfUrl: string) => Promise<void>;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: () => void;
}

export function usePDF(): UsePDFReturn {
  const [pdfFile, setPdfFile] = useState<{ data: Uint8Array } | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Backup storage for PDF data to prevent loss
  const pdfDataRef = useRef<Uint8Array | null>(null);

  const loadPDF = useCallback(async (pdfUrl: string) => {
    setLoading(true);
    setError("");
    setPdfFile(null);

    console.log("Loading PDF from URL:", pdfUrl);

    try {
      // Extract S3 key using the proper utility function
      const s3Key = extractS3Key(pdfUrl);

      if (!s3Key) {
        throw new Error(`Invalid S3 URL format: ${pdfUrl}`);
      }

      console.log("Extracted S3 key:", s3Key);

      // Add timeout for presigned URL generation
      const presignedController = new AbortController();
      const presignedTimeout = setTimeout(
        () => presignedController.abort(),
        10000
      ); // 10 second timeout

      // Get a pre-signed download URL
      console.log("Generating presigned URL...");
      const presignedResponse = await fetch(
        `/api/generate-presigned-s3-url?operation=download&key=${encodeURIComponent(
          s3Key
        )}`,
        { signal: presignedController.signal }
      );

      clearTimeout(presignedTimeout);

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        console.error(
          "Presigned URL generation failed:",
          presignedResponse.status,
          errorText
        );
        throw new Error(
          `Failed to generate download URL: ${presignedResponse.status} ${errorText}`
        );
      }

      const presignedData = await presignedResponse.json();
      const downloadUrl = presignedData.url;

      console.log("Got presigned URL, downloading PDF...");

      // Add timeout for PDF download
      const downloadController = new AbortController();
      const downloadTimeout = setTimeout(
        () => downloadController.abort(),
        30000
      ); // 30 second timeout

      // Fetch PDF data using the pre-signed URL
      const pdfResponse = await fetch(downloadUrl, {
        signal: downloadController.signal,
      });

      clearTimeout(downloadTimeout);

      if (!pdfResponse.ok) {
        console.error(
          "PDF download failed:",
          pdfResponse.status,
          pdfResponse.statusText
        );
        throw new Error(
          `Failed to load PDF from storage: ${pdfResponse.status} ${pdfResponse.statusText}`
        );
      }

      console.log("PDF response received, converting to array buffer...");
      const pdfBuffer = await pdfResponse.arrayBuffer();
      console.log("PDF downloaded, size:", pdfBuffer.byteLength, "bytes");

      if (pdfBuffer.byteLength === 0) {
        throw new Error("Downloaded PDF file is empty");
      }

      const pdfData = new Uint8Array(pdfBuffer);

      // Store in both state and ref for backup
      pdfDataRef.current = pdfData;
      setPdfFile({ data: pdfData });

      console.log("PDF data set, now parsing to get page count...");
      console.log("PDF data before parsing:", {
        dataLength: pdfData.length,
        dataType: pdfData.constructor.name,
      });

      // Parse PDF to get page count
      try {
        const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
        const pageCount = pdf.numPages;
        setNumPages(pageCount);
        console.log("PDF parsed successfully, pages:", pageCount);

        // Verify data is still intact after parsing
        console.log("PDF data after parsing:", {
          dataLength: pdfData.length,
          dataType: pdfData.constructor.name,
          refDataLength: pdfDataRef.current?.length || 0,
        });

        // Re-confirm the pdfFile state has the data
        console.log("Re-setting pdfFile to ensure data persistence...");
        const finalPdfFile = { data: pdfDataRef.current || pdfData };
        setPdfFile(finalPdfFile);

        toast.success("PDF loaded successfully!", {
          description: `PDF is ready for processing. ${pageCount} page${
            pageCount > 1 ? "s" : ""
          } found.`,
        });
      } catch (parseError) {
        console.error("Error parsing PDF for page count:", parseError);
        // Set a default of 1 page if parsing fails
        setNumPages(1);
        toast.success("PDF loaded successfully!", {
          description: "PDF is ready for processing (assuming 1 page).",
        });
      }
    } catch (err) {
      console.error("PDF loading error:", err);

      let errorMessage: string;
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "PDF download timed out. Please try again.";
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = "Failed to load PDF";
      }

      setError(errorMessage);
      toast.error("Failed to load PDF", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setError("");
      toast.success("PDF processed successfully!", {
        description: `Document has ${numPages} page${
          numPages > 1 ? "s" : ""
        }. Select the page you want to analyze.`,
      });
    },
    []
  );

  const onDocumentLoadError = useCallback(() => {
    const errorMsg = "Could not process PDF file";
    setError(errorMsg);
    toast.error("Failed to process PDF", {
      description:
        "The PDF file could not be processed. Please contact support.",
    });
  }, []);

  return {
    pdfFile:
      pdfFile || (pdfDataRef.current ? { data: pdfDataRef.current } : null),
    numPages,
    loading,
    error,
    loadPDF,
    onDocumentLoadSuccess,
    onDocumentLoadError,
  };
}
