"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  FileText,
  Save,
  Download,
  FileDown,
} from "lucide-react";
// Removed PDF dependencies - using HTML export instead

type BuildingElementType =
  | "external-wall"
  | "upper-gable"
  | "internal-bearing-wall"
  | "internal-party-wall"
  | "floor-cassette"
  | "roof-cassette"
  | "ceiling-cassette"
  | "staircases"
  | "windows-external-doors"
  | "internal-doors"
  | "custom-element";

type MetricType = "length" | "area" | "count" | "length-area";

type EstimationElement = {
  id: string;
  type: BuildingElementType;
  name: string;
  metricType: MetricType;
  totalLength: number;
  totalArea: number;
  count: number;
  color: string;
  price: number;
};

type EstimationData = {
  elements: EstimationElement[];
  scale: number;
  dimensions: {
    width: number;
    height: number;
    standard?: string;
    orientation?: string;
  };
  timestamp: number;
};

const Debug = false;

function EstimateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [estimationData, setEstimationData] = useState<EstimationData | null>(
    null
  );
  const [elements, setElements] = useState<EstimationElement[]>([]);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Parse data from URL on component mount
  useEffect(() => {
    const encodedData = searchParams.get("data");
    if (encodedData) {
      try {
        const decodedData = JSON.parse(atob(encodedData)) as EstimationData;
        setEstimationData(decodedData);

        // Initialize elements with zero prices
        const elementsWithPricing = decodedData.elements.map((element) => ({
          ...element,
          price: 0,
        }));
        setElements(elementsWithPricing);
      } catch (error) {
        console.error("Failed to parse estimation data:", error);
      }
    }
  }, [searchParams]);

  // Calculate element total based on metric type
  const calculateElementTotal = (element: EstimationElement): number => {
    if (!element.price || element.price <= 0) return 0;

    // Special handling for external walls - always use length
    if (element.type === "external-wall") {
      return element.totalLength * element.price;
    }

    switch (element.metricType) {
      case "length":
        return element.totalLength * element.price;
      case "area":
        return element.totalArea * element.price;
      case "count":
        return element.count * element.price;
      case "length-area":
        // For length-area, use whichever quantity is available (non-zero)
        if (element.totalLength > 0) {
          return element.totalLength * element.price;
        } else if (element.totalArea > 0) {
          return element.totalArea * element.price;
        } else {
          return 0;
        }
      default:
        return element.price;
    }
  };

  // Calculate all totals
  const subtotal = elements.reduce((sum, element) => {
    return sum + calculateElementTotal(element);
  }, 0);

  const total = subtotal;

  // Update element price
  const updateElementPrice = (elementId: string, newPrice: number) => {
    setElements((prevElements) =>
      prevElements.map((element) =>
        element.id === elementId
          ? { ...element, price: Math.max(0, newPrice) }
          : element
      )
    );
  };

  // Get unit label based on metric type
  const getUnitLabel = (
    metricType: MetricType,
    element?: EstimationElement
  ): string => {
    // Special handling for external walls - always show per meter
    if (element?.type === "external-wall") {
      return "per meter";
    }

    switch (metricType) {
      case "length":
        return "per meter";
      case "area":
        return "per m²";
      case "count":
        return "per unit";
      case "length-area":
        if (element) {
          if (element.totalLength > 0 && element.totalArea > 0) {
            return "per m/m²";
          } else if (element.totalLength > 0) {
            return "per meter";
          } else if (element.totalArea > 0) {
            return "per m²";
          }
        }
        return "per m/m²";
      default:
        return "per unit";
    }
  };

  // Get quantity display string
  const getQuantityDisplay = (element: EstimationElement): string => {
    // Special handling for external walls - always show length
    if (element.type === "external-wall") {
      return `${element.totalLength.toFixed(2)} m`;
    }

    switch (element.metricType) {
      case "length":
        return `${element.totalLength.toFixed(2)} m`;
      case "area":
        return `${element.totalArea.toFixed(2)} m²`;
      case "count":
        return `${element.count} units`;
      case "length-area":
        const lengthPart =
          element.totalLength > 0 ? `${element.totalLength.toFixed(2)} m` : "";
        const areaPart =
          element.totalArea > 0 ? `${element.totalArea.toFixed(2)} m²` : "";

        if (lengthPart && areaPart) {
          return `${lengthPart} + ${areaPart}`;
        } else if (lengthPart) {
          return lengthPart;
        } else if (areaPart) {
          return areaPart;
        } else {
          return "0 m / 0 m²";
        }
      default:
        return "N/A";
    }
  };

  // Navigation
  const goBack = () => {
    router.back();
  };

  // Generate HTML export functionality
  const generateHTML = (): string => {
    if (!printRef.current) return "";

    // Get the HTML content
    const content = printRef.current.innerHTML;

    // Create a complete HTML document
    const htmlDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Estimate - ${projectName || "Untitled Project"}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.5;
        }
        
        /* Print styles */
        @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none !important; }
            page-break-inside: avoid;
        }
        
        /* Ensure all content is visible */
        * {
            box-sizing: border-box;
        }
        
        /* Override any complex colors for better compatibility */
        [style*="oklch"] {
            background-color: #ffffff !important;
            color: #000000 !important;
        }
    </style>
</head>
<body>
    <h1>Project Estimate</h1>
    <p>Generated on: ${new Date().toLocaleDateString()}</p>
    <hr>
    ${content}
</body>
</html>`;

    return htmlDocument;
  };

  // Save to database
  const saveToDatabase = async (
    estimateData: {
      projectName: string;
      clientName: string;
      elements: EstimationElement[];
      subtotal: number;
      total: number;
      scale?: number;
      dimensions?: {
        width: number;
        height: number;
        standard?: string;
        orientation?: string;
      };
      timestamp?: number;
      generatedAt: string;
    },
    htmlContent?: string
  ) => {
    const leadId = searchParams.get("leadId");
    if (!leadId) {
      console.error("No lead ID found");
      return false;
    }

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          estimateData,
          htmlContent,
          projectName,
          clientName,
          elements,
          subtotal,
          total,
          scale: estimationData?.scale,
          dimensions: estimationData?.dimensions,
          timestamp: estimationData?.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save estimate");
      }

      return true;
    } catch (error) {
      console.error("Error saving to database:", error);
      return false;
    }
  };

  // Export functionality
  const exportEstimate = async () => {
    setIsExporting(true);

    const estimateData = {
      projectName,
      clientName,
      elements,
      subtotal,
      total,
      scale: estimationData?.scale,
      dimensions: estimationData?.dimensions,
      timestamp: estimationData?.timestamp,
      generatedAt: new Date().toISOString(),
    };

    // Generate HTML
    const htmlContent = generateHTML();

    // Save to database
    const saved = await saveToDatabase(estimateData, htmlContent || undefined);

    if (saved) {
      alert("Estimate saved to database successfully!");
    }

    // Download JSON
    const dataStr = JSON.stringify(estimateData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `estimate_${projectName || "project"}_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    setIsExporting(false);
  };

  // Download HTML functionality
  const downloadHTML = async () => {
    setIsExporting(true);
    const htmlContent = generateHTML();

    if (htmlContent) {
      const dataUri =
        "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute(
        "download",
        `estimate_${projectName || "project"}_${
          new Date().toISOString().split("T")[0]
        }.html`
      );
      linkElement.click();
    }

    setIsExporting(false);
  };

  // Print functionality
  const printEstimate = () => {
    window.print();
  };

  // Quick test functions
  const setAllPrices = (price: number) => {
    setElements((prev) => prev.map((element) => ({ ...element, price })));
  };

  const clearAllPrices = () => {
    setElements((prev) => prev.map((element) => ({ ...element, price: 0 })));
  };

  // Inline styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    container: {
      maxWidth: "1152px",
      margin: "0 auto",
      padding: "2rem 1rem",
    },
    headerContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "2rem",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    headerTitle: {
      fontSize: "1.875rem",
      fontWeight: "700",
      color: "#1a1a1a",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      margin: 0,
    },
    headerSubtitle: {
      color: "#6b7280",
      fontSize: "1rem",
      margin: 0,
    },
    buttonGroup: {
      display: "flex",
      gap: "0.5rem",
    },
    button: {
      backgroundColor: "#f9fafb",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      color: "#374151",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      textDecoration: "none",
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      marginBottom: "2rem",
    },
    cardHeader: {
      padding: "1.5rem",
      borderBottom: "1px solid #e5e7eb",
    },
    cardTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "#1a1a1a",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    cardContent: {
      padding: "1.5rem",
    },
    gridTwoColumns: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
    },
    inputGroup: {
      marginBottom: "1rem",
    },
    label: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "0.25rem",
    },
    input: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "0.875rem",
      backgroundColor: "#ffffff",
    },
    debugCard: {
      backgroundColor: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      marginBottom: "2rem",
    },
    debugTitle: {
      fontSize: "0.875rem",
      color: "#1e40af",
      margin: 0,
    },
    debugContent: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.75rem",
    },
    debugButtonGroup: {
      display: "flex",
      gap: "0.5rem",
    },
    debugButton: {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "0.375rem 0.75rem",
      fontSize: "0.875rem",
      cursor: "pointer",
    },
    debugButtonOutline: {
      backgroundColor: "transparent",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      padding: "0.375rem 0.75rem",
      fontSize: "0.875rem",
      cursor: "pointer",
    },
    debugInfo: {
      fontSize: "0.875rem",
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.25rem",
    },
    elementsContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1rem",
    },
    elementCard: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "1rem",
      transition: "box-shadow 0.15s ease-in-out",
    },
    elementHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "0.75rem",
    },
    elementInfo: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    colorIndicator: {
      width: "1rem",
      height: "1rem",
      borderRadius: "2px",
      border: "1px solid #d1d5db",
    },
    elementName: {
      fontSize: "1rem",
      fontWeight: "500",
      color: "#1a1a1a",
      margin: 0,
    },
    elementQuantity: {
      fontSize: "0.875rem",
      color: "#6b7280",
      margin: 0,
    },
    elementTotal: {
      textAlign: "right" as const,
    },
    elementTotalAmount: {
      fontSize: "1.125rem",
      fontWeight: "700",
      color: "#1a1a1a",
      margin: 0,
    },
    elementTotalLabel: {
      fontSize: "0.875rem",
      color: "#6b7280",
      margin: 0,
    },
    priceInputContainer: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    priceLabel: {
      minWidth: "fit-content",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#374151",
    },
    priceInputGroup: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    dollarSign: {
      fontSize: "0.875rem",
      color: "#6b7280",
    },
    priceInput: {
      width: "8rem",
      padding: "0.5rem 0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "0.875rem",
      backgroundColor: "#ffffff",
    },
    summaryContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1rem",
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#1a1a1a",
    },
    totalAmount: {
      fontSize: "1.875rem",
      fontWeight: "700",
      color: "#1f2937",
    },
    costPerMeter: {
      paddingTop: "1rem",
      borderTop: "1px solid #e5e7eb",
    },
    costPerMeterRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "1.125rem",
    },
    costPerMeterLabel: {
      fontWeight: "500",
      color: "#1a1a1a",
    },
    costPerMeterAmount: {
      fontWeight: "700",
      color: "#2563eb",
    },
    costPerMeterNote: {
      fontSize: "0.875rem",
      color: "#6b7280",
      marginTop: "0.25rem",
    },
    breakdownContainer: {
      marginTop: "1.5rem",
      paddingTop: "1rem",
      borderTop: "1px solid #e5e7eb",
      backgroundColor: "rgba(249, 250, 251, 0.3)",
      borderRadius: "6px",
      padding: "1rem",
    },
    breakdownTitle: {
      fontWeight: "500",
      marginBottom: "0.5rem",
      fontSize: "1rem",
      color: "#1a1a1a",
    },
    breakdownList: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.25rem",
      fontSize: "0.875rem",
    },
    breakdownItem: {
      display: "flex",
      justifyContent: "space-between",
    },
    noElementsText: {
      color: "#6b7280",
      fontStyle: "italic",
    },
    loadingContainer: {
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingCard: {
      width: "24rem",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    loadingContent: {
      padding: "1.5rem",
      textAlign: "center" as const,
    },
    loadingText: {
      color: "#6b7280",
      marginBottom: "1rem",
    },
  };

  // Loading state
  if (!estimationData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingContent}>
            <p style={styles.loadingText}>No estimation data found.</p>
            <button onClick={goBack} style={styles.button}>
              <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container} ref={printRef}>
        {/* Header */}
        <div style={styles.headerContainer}>
          <div style={styles.headerLeft}>
            <button onClick={goBack} style={styles.button}>
              <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
              Back
            </button>
            <div>
              <h1 style={styles.headerTitle}>
                <Calculator style={{ width: "2rem", height: "2rem" }} />
                Project Estimation
              </h1>
              <p style={styles.headerSubtitle}>
                Add pricing and create detailed estimates
              </p>
            </div>
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={exportEstimate}
              style={{
                ...styles.button,
                ...(isExporting ? styles.buttonDisabled : {}),
              }}
              disabled={isExporting}
            >
              <Download style={{ width: "1rem", height: "1rem" }} />
              {isExporting ? "Exporting..." : "Export & Save"}
            </button>
            <button
              onClick={downloadHTML}
              style={{
                ...styles.button,
                ...(isExporting ? styles.buttonDisabled : {}),
              }}
              disabled={isExporting}
            >
              <FileDown style={{ width: "1rem", height: "1rem" }} />
              Download HTML
            </button>
            <button onClick={printEstimate} style={styles.button}>
              <Save style={{ width: "1rem", height: "1rem" }} />
              Print Estimate
            </button>
          </div>
        </div>

        {/* Project Information */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <FileText style={{ width: "1.25rem", height: "1.25rem" }} />
              Project Information
            </h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.gridTwoColumns}>
              <div style={styles.inputGroup}>
                <label htmlFor="projectName" style={styles.label}>
                  Project Name
                </label>
                <input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="clientName" style={styles.label}>
                  Client Name
                </label>
                <input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Test Panel */}
        {Debug && (
          <div style={styles.debugCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.debugTitle}>Quick Test & Debug</h2>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.debugContent}>
                <div style={styles.debugButtonGroup}>
                  <button
                    onClick={() => setAllPrices(100)}
                    style={styles.debugButton}
                  >
                    Set All to $100
                  </button>
                  <button
                    onClick={() => setAllPrices(50)}
                    style={styles.debugButtonOutline}
                  >
                    Set All to $50
                  </button>
                  <button
                    onClick={clearAllPrices}
                    style={styles.debugButtonOutline}
                  >
                    Clear All
                  </button>
                </div>
                <div style={styles.debugInfo}>
                  <div>Elements: {elements.length}</div>
                  <div>
                    Elements with prices:{" "}
                    {elements.filter((el) => el.price > 0).length}
                  </div>
                  <div>
                    Current Subtotal: <strong>${subtotal.toFixed(2)}</strong>
                  </div>
                  <div>
                    Current Total: <strong>${total.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Building Elements */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <DollarSign style={{ width: "1.25rem", height: "1.25rem" }} />
              Building Elements ({elements.length})
            </h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.elementsContainer}>
              {elements.map((element) => {
                const elementTotal = calculateElementTotal(element);
                return (
                  <div key={element.id} style={styles.elementCard}>
                    <div style={styles.elementHeader}>
                      <div style={styles.elementInfo}>
                        <div
                          style={{
                            ...styles.colorIndicator,
                            backgroundColor: element.color,
                          }}
                        />
                        <div>
                          <h3 style={styles.elementName}>{element.name}</h3>
                          <p style={styles.elementQuantity}>
                            {getQuantityDisplay(element)}
                          </p>
                        </div>
                      </div>
                      <div style={styles.elementTotal}>
                        <div style={styles.elementTotalAmount}>
                          ${elementTotal.toFixed(2)}
                        </div>
                        <div style={styles.elementTotalLabel}>Total</div>
                      </div>
                    </div>

                    <div style={styles.priceInputContainer}>
                      <label
                        htmlFor={`price-${element.id}`}
                        style={styles.priceLabel}
                      >
                        Price {getUnitLabel(element.metricType, element)}:
                      </label>
                      <div style={styles.priceInputGroup}>
                        <span style={styles.dollarSign}>$</span>
                        <input
                          id={`price-${element.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={element.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            updateElementPrice(element.id, newPrice);
                          }}
                          placeholder="0.00"
                          style={styles.priceInput}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Estimate Summary */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Estimate Summary</h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.summaryContainer}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total:</span>
                <span style={styles.totalAmount}>${total.toFixed(2)}</span>
              </div>

              {/* Cost per square meter for external walls */}
              {(() => {
                const externalWall = elements.find(
                  (el) => el.type === "external-wall"
                );
                if (externalWall && externalWall.totalArea > 0 && total > 0) {
                  const costPerSqMeter = total / externalWall.totalArea;
                  return (
                    <div style={styles.costPerMeter}>
                      <div style={styles.costPerMeterRow}>
                        <span style={styles.costPerMeterLabel}>
                          Cost per m²
                        </span>
                        <span style={styles.costPerMeterAmount}>
                          ${costPerSqMeter.toFixed(2)}/m²
                        </span>
                      </div>
                      <div style={styles.costPerMeterNote}>
                        Total cost (${total.toFixed(2)}) ÷ External wall area (
                        {externalWall.totalArea.toFixed(2)} m²)
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div style={styles.breakdownContainer}>
                <h4 style={styles.breakdownTitle}>Breakdown by Element:</h4>
                <div style={styles.breakdownList}>
                  {elements
                    .filter((el) => el.price > 0)
                    .map((element) => (
                      <div key={element.id} style={styles.breakdownItem}>
                        <span>{element.name}:</span>
                        <span>
                          ${calculateElementTotal(element).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {elements.filter((el) => el.price > 0).length === 0 && (
                    <div style={styles.noElementsText}>
                      No elements priced yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EstimatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EstimateContent />
    </Suspense>
  );
}
