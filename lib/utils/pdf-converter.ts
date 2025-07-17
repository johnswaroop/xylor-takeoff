import { pdfjs } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface ConvertPDFPageOptions {
  pdfFile: { data: Uint8Array };
  pageNumber: number;
  maxDimension?: number;
  scale?: number;
  quality?: number;
}

interface ConvertPDFPageResult {
  base64Image: string;
  width: number;
  height: number;
}

/**
 * Converts a PDF page to a base64 image
 */
export async function convertPDFPageToImage({
  pdfFile,
  pageNumber,
  maxDimension = 4096,
  scale = 1.5,
  quality = 0.9,
}: ConvertPDFPageOptions): Promise<ConvertPDFPageResult> {
  console.log("Converting PDF page to image:", {
    hasData: !!pdfFile?.data,
    dataType: pdfFile?.data?.constructor?.name,
    dataLength: pdfFile?.data?.length,
    pageNumber,
  });

  if (!pdfFile || !pdfFile.data) {
    console.error("PDF file or data is missing");
    throw new Error("PDF file data is missing");
  }

  if (!(pdfFile.data instanceof Uint8Array)) {
    console.error("PDF data is not a Uint8Array, got:", typeof pdfFile.data);
    throw new Error(
      `Invalid PDF file data - Expected Uint8Array, got: ${typeof pdfFile.data}`
    );
  }

  if (pdfFile.data.length === 0) {
    console.error("PDF data is empty - the Uint8Array has length 0");
    throw new Error("PDF file is empty - The uploaded file contains no data");
  }

  console.log("PDF data validation passed, proceeding with conversion...");

  // Load the PDF document
  const pdf = await pdfjs.getDocument({ data: pdfFile.data }).promise;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }

  // Get the specified page
  const page = await pdf.getPage(pageNumber);

  // Create canvas for rendering
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Cannot create canvas context");
  }

  // Calculate viewport with appropriate scale
  let viewport = page.getViewport({ scale });

  // Adjust scale if dimensions are too large
  if (viewport.width > maxDimension || viewport.height > maxDimension) {
    const adjustedScale = Math.min(
      scale,
      maxDimension / Math.max(viewport.width, viewport.height)
    );
    viewport = page.getViewport({ scale: adjustedScale });
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render the page to canvas with timeout
  const renderTask = page.render({
    canvasContext: context,
    viewport,
  });

  // Add timeout protection
  await Promise.race([
    renderTask.promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("PDF rendering timeout")), 30000)
    ),
  ]);

  // Convert canvas to base64 image
  return new Promise<ConvertPDFPageResult>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          if (!base64String?.startsWith("data:")) {
            reject(new Error("Invalid base64 data generated"));
            return;
          }

          resolve({
            base64Image: base64String,
            width: canvas.width,
            height: canvas.height,
          });
        };

        reader.onerror = () => {
          reject(new Error("Failed to read blob as data URL"));
        };

        reader.readAsDataURL(blob);
      },
      "image/png",
      quality
    );
  });
}

/**
 * Saves floor plan data to localStorage
 */
export function saveFloorPlanToStorage(
  base64Image: string,
  metadata: {
    leadId: string;
    companyName?: string;
    pdfUrl?: string;
    pageNumber: number;
    totalPages: number;
  }
): void {
  localStorage.setItem("floorplan_image", base64Image);
  localStorage.setItem(
    "floorplan_metadata",
    JSON.stringify({
      ...metadata,
      timestamp: Date.now(),
    })
  );
}
