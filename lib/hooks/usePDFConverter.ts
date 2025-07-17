import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  convertPDFPageToImage,
  saveFloorPlanToStorage,
} from "@/lib/utils/pdf-converter";

interface UsePDFConverterReturn {
  isProcessing: boolean;
  isComplete: boolean;
  error: string;
  convertAndSave: (options: {
    pdfFile: { data: Uint8Array };
    pageNumber: number;
    leadId: string;
    companyName?: string;
    pdfUrl?: string;
    totalPages: number;
  }) => Promise<void>;
  reset: () => void;
}

export function usePDFConverter(): UsePDFConverterReturn {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const convertAndSave = useCallback(
    async ({
      pdfFile,
      pageNumber,
      leadId,
      companyName,
      pdfUrl,
      totalPages,
    }: {
      pdfFile: { data: Uint8Array };
      pageNumber: number;
      leadId: string;
      companyName?: string;
      pdfUrl?: string;
      totalPages: number;
    }) => {
      setIsProcessing(true);
      setError("");

      const toastId = toast.loading("Processing your floor plan...", {
        description: "Converting PDF page to image format for analysis.",
      });

      try {
        // Convert PDF page to image
        const result = await convertPDFPageToImage({
          pdfFile,
          pageNumber,
        });

        // Save to localStorage
        saveFloorPlanToStorage(result.base64Image, {
          leadId,
          companyName,
          pdfUrl,
          pageNumber,
          totalPages,
        });

        setIsComplete(true);

        toast.success("Floor plan processed successfully!", {
          id: toastId,
          description: `Page ${pageNumber} is ready for wall detection. Redirecting...`,
        });

        // Automatically redirect to mark page after a short delay
        setTimeout(() => {
          router.push("/estimator/mark");
        }, 1500);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to process page";
        setError(errorMessage);

        // Provide more specific error messages
        let description =
          "Could not convert the PDF page. Please try again or select a different page.";

        if (errorMessage.includes("timeout")) {
          description =
            "PDF processing timed out. The file may be too large or complex. Try a different page or a smaller PDF.";
        } else if (errorMessage.includes("canvas")) {
          description =
            "Canvas rendering failed. Your browser may not support this feature or the page may be too large.";
        } else if (errorMessage.includes("blob")) {
          description =
            "Image conversion failed. Please try again with a different page.";
        } else if (
          errorMessage.includes("Invalid PDF") ||
          errorMessage.includes("empty")
        ) {
          description =
            "PDF file could not be loaded properly. Please refresh the page and try again.";
        }

        toast.error("Processing failed", {
          id: toastId,
          description,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [router]
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setIsComplete(false);
    setError("");
  }, []);

  return {
    isProcessing,
    isComplete,
    error,
    convertAndSave,
    reset,
  };
}
