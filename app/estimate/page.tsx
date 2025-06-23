"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  FileText,
  Save,
  Download,
} from "lucide-react";

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
  const [estimationData, setEstimationData] = useState<EstimationData | null>(
    null
  );
  const [elements, setElements] = useState<EstimationElement[]>([]);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");

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

  // Export functionality
  const exportEstimate = () => {
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

  // Loading state
  if (!estimationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No estimation data found.</p>
            <Button onClick={goBack} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={goBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calculator className="w-8 h-8" />
                Project Estimation
              </h1>
              <p className="text-muted-foreground">
                Add pricing and create detailed estimates
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportEstimate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={printEstimate} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Print Estimate
            </Button>
          </div>
        </div>

        {/* Project Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Test Panel */}
        {Debug && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-800">
                Quick Test & Debug
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setAllPrices(100)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Set All to $100
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAllPrices(50)}
                    variant="outline"
                  >
                    Set All to $50
                  </Button>
                  <Button size="sm" onClick={clearAllPrices} variant="outline">
                    Clear All
                  </Button>
                </div>
                <div className="text-sm space-y-1">
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
            </CardContent>
          </Card>
        )}

        {/* Building Elements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Building Elements ({elements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {elements.map((element) => {
                const elementTotal = calculateElementTotal(element);
                return (
                  <div
                    key={element.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: element.color }}
                        />
                        <div>
                          <h3 className="font-medium">{element.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getQuantityDisplay(element)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${elementTotal.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label
                        htmlFor={`price-${element.id}`}
                        className="min-w-fit"
                      >
                        Price {getUnitLabel(element.metricType, element)}:
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
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
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Estimate Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Estimate Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Total:</span>
                  <span className="text-3xl font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Cost per square meter for external walls */}
              {(() => {
                const externalWall = elements.find(
                  (el) => el.type === "external-wall"
                );
                if (externalWall && externalWall.totalArea > 0 && total > 0) {
                  const costPerSqMeter = total / externalWall.totalArea;
                  return (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-medium">
                          Cost per m² (External Wall):
                        </span>
                        <span className="font-bold text-blue-600">
                          ${costPerSqMeter.toFixed(2)}/m²
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Total cost (${total.toFixed(2)}) ÷ External wall area (
                        {externalWall.totalArea.toFixed(2)} m²)
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mt-6 pt-4 border-t bg-muted/30 rounded p-4">
                <h4 className="font-medium mb-2">Breakdown by Element:</h4>
                <div className="space-y-1 text-sm">
                  {elements
                    .filter((el) => el.price > 0)
                    .map((element) => (
                      <div key={element.id} className="flex justify-between">
                        <span>{element.name}:</span>
                        <span>
                          ${calculateElementTotal(element).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {elements.filter((el) => el.price > 0).length === 0 && (
                    <div className="text-muted-foreground italic">
                      No elements priced yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
