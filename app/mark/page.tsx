"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ReactSVGPanZoom,
  TOOL_NONE,
  Value,
  Tool,
  ViewerMouseEvent,
  POSITION_NONE,
  MODE_IDLE,
} from "react-svg-pan-zoom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Ruler,
  Pentagon,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Home,
  Square,
  Triangle,
  Layers,
  DoorOpen,
  ChevronDown,
  ChevronRight,
  Save,
  Minus,
  RotateCcw,
  Calculator,
} from "lucide-react";

type Point = { x: number; y: number };

type Line = {
  id: string;
  points: [Point, Point];
  length: number;
  elementId?: string;
};

type Polygon = {
  id: string;
  points: Point[];
  perimeter: number;
  area: number;
  isComplete: boolean;
  elementId?: string;
};

type DrawingMode = "line" | "polygon";

type ScaleMode = "1:100" | "1:50" | "1:200" | "custom";
type DimensionStandard = "A1" | "A2" | "A3" | "A4" | "custom";
type PaperOrientation = "horizontal" | "vertical";

type Layer = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  showMeasurements: boolean;
  lines: Line[];
  polygons: Polygon[];
  createdAt: number;
};

// Building Elements Types
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
type CustomMetricType = "2m" | "length" | "count";

type BuildingElement = {
  id: string;
  type: BuildingElementType;
  name: string;
  metricType: MetricType;
  lines: Line[];
  polygons: Polygon[];
  count: number;
  isExpanded: boolean;
  isSaved: boolean;
  customMetricType?: CustomMetricType;
  color: string;
};

// Building Element Configurations
const BUILDING_ELEMENT_CONFIGS: Record<
  BuildingElementType,
  {
    name: string;
    metricType: MetricType;
    icon: React.ReactNode;
    description: string;
  }
> = {
  "external-wall": {
    name: "External Wall",
    metricType: "length-area",
    icon: <Home className="w-4 h-4" />,
    description: "Length and area measurements",
  },
  "upper-gable": {
    name: "Upper Gable",
    metricType: "length",
    icon: <Triangle className="w-4 h-4" />,
    description: "Length in meters",
  },
  "internal-bearing-wall": {
    name: "Internal Bearing Wall",
    metricType: "length",
    icon: <Square className="w-4 h-4" />,
    description: "Length in meters",
  },
  "internal-party-wall": {
    name: "Internal Party Wall",
    metricType: "length",
    icon: <Square className="w-4 h-4" />,
    description: "Length in meters",
  },
  "floor-cassette": {
    name: "Floor Cassette",
    metricType: "area",
    icon: <Square className="w-4 h-4" />,
    description: "Area in square meters",
  },
  "roof-cassette": {
    name: "Roof Cassette",
    metricType: "area",
    icon: <Triangle className="w-4 h-4" />,
    description: "Area in square meters",
  },
  "ceiling-cassette": {
    name: "Ceiling Cassette",
    metricType: "area",
    icon: <Square className="w-4 h-4" />,
    description: "Area in square meters",
  },
  staircases: {
    name: "Staircases",
    metricType: "count",
    icon: <Layers className="w-4 h-4" />,
    description: "Number of units",
  },
  "windows-external-doors": {
    name: "Windows & External Doors",
    metricType: "count",
    icon: <DoorOpen className="w-4 h-4" />,
    description: "Number of units",
  },
  "internal-doors": {
    name: "Internal Doors",
    metricType: "count",
    icon: <DoorOpen className="w-4 h-4" />,
    description: "Number of units",
  },
  "custom-element": {
    name: "Custom Element",
    metricType: "length-area",
    icon: <Plus className="w-4 h-4" />,
    description: "Length and area measurements",
  },
};

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

const SCALE_VALUES: Record<ScaleMode, number> = {
  "1:100": 100,
  "1:50": 50,
  "1:200": 200,
  custom: 1,
};

const DIMENSION_SIZES: Record<
  DimensionStandard,
  {
    horizontal: { width: number; height: number };
    vertical: { width: number; height: number };
  }
> = {
  A1: {
    horizontal: { width: 841, height: 594 },
    vertical: { width: 594, height: 841 },
  },
  A2: {
    horizontal: { width: 594, height: 420 },
    vertical: { width: 420, height: 594 },
  },
  A3: {
    horizontal: { width: 420, height: 297 },
    vertical: { width: 297, height: 420 },
  },
  A4: {
    horizontal: { width: 297, height: 210 },
    vertical: { width: 210, height: 297 },
  },
  custom: {
    horizontal: { width: 1000, height: 1000 },
    vertical: { width: 1000, height: 1000 },
  },
};

export default function SVGDrawWithPanZoom() {
  const viewer = useRef<ReactSVGPanZoom>(null);
  const router = useRouter();
  const [tool, setTool] = useState<Tool>(TOOL_NONE);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("line");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("1:100");
  const [customScale, setCustomScale] = useState(1);
  const [dimensionStandard, setDimensionStandard] =
    useState<DimensionStandard>("A1");
  const [paperOrientation, setPaperOrientation] =
    useState<PaperOrientation>("horizontal");
  const [customDimensions, setCustomDimensions] = useState({
    width: 1000,
    height: 1000,
  });

  // Layer management
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayerId, setCurrentLayerId] = useState<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = useState(0);

  // Building Elements management
  const [buildingElements, setBuildingElements] = useState<BuildingElement[]>(
    []
  );
  const [currentElementId, setCurrentElementId] = useState<string | null>(null);
  const [expandedElementId, setExpandedElementId] = useState<string | null>(
    null
  );

  // Floor plan image from localStorage
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);

  // Current drawing state
  const [currentLineStart, setCurrentLineStart] = useState<Point | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);

  // Create initial value object with dynamic dimensions
  const [value, setValue] = useState<Value>({
    version: 2,
    mode: MODE_IDLE,
    focus: false,
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
    viewerWidth: dimensions.width,
    viewerHeight: dimensions.height,
    SVGWidth: getCurrentSVGDimensions().width,
    SVGHeight: getCurrentSVGDimensions().height,
    startX: null,
    startY: null,
    endX: null,
    endY: null,
    miniatureOpen: false,
  });

  // Initialize with first layer
  useEffect(() => {
    if (layers.length === 0) {
      createNewLayer();
    }
  }, [layers.length]);

  // Initialize building elements
  useEffect(() => {
    if (buildingElements.length === 0) {
      initializeBuildingElements();
    }
  }, [buildingElements.length]);

  // Load floor plan image from localStorage
  useEffect(() => {
    const storedImage = localStorage.getItem("floorplan_image");
    if (storedImage) {
      setFloorPlanImage(storedImage);
    } else {
      alert(
        "Error: Floor plan image not found in storage. Please upload a floor plan image first."
      );
    }
  }, []);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Update value when dimensions change
  useEffect(() => {
    const svgDims = getCurrentSVGDimensions();
    setValue((prev) => ({
      ...prev,
      viewerWidth: dimensions.width,
      viewerHeight: dimensions.height,
      SVGWidth: svgDims.width,
      SVGHeight: svgDims.height,
    }));
  }, [dimensions, dimensionStandard, paperOrientation, customDimensions]);

  function getCurrentSVGDimensions() {
    if (dimensionStandard === "custom") {
      return customDimensions;
    }
    return DIMENSION_SIZES[dimensionStandard][paperOrientation];
  }

  function getCurrentScale() {
    return scaleMode === "custom" ? customScale : SCALE_VALUES[scaleMode];
  }

  function getCurrentLayer(): Layer | null {
    return layers.find((layer) => layer.id === currentLayerId) || null;
  }

  function createNewLayer() {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      color: COLORS[nextColorIndex % COLORS.length],
      visible: true,
      showMeasurements: true,
      lines: [],
      polygons: [],
      createdAt: Date.now(),
    };

    setLayers((prev) => [...prev, newLayer]);
    setCurrentLayerId(newLayer.id);
    setNextColorIndex((prev) => prev + 1);

    // Clear current drawing state
    setCurrentLineStart(null);
    setCurrentPolygon([]);
  }

  function updateCurrentLayer(updates: Partial<Layer>) {
    if (!currentLayerId) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === currentLayerId ? { ...layer, ...updates } : layer
      )
    );
  }

  function deleteLayer(layerId: string) {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
    if (currentLayerId === layerId) {
      const remainingLayers = layers.filter((layer) => layer.id !== layerId);
      setCurrentLayerId(
        remainingLayers.length > 0 ? remainingLayers[0].id : null
      );
    }
  }

  function toggleLayerVisibility(layerId: string) {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }

  // Building Elements functions
  function initializeBuildingElements() {
    const elements: BuildingElement[] = Object.entries(
      BUILDING_ELEMENT_CONFIGS
    ).map(([type, config], index) => ({
      id: `element-${type}`,
      type: type as BuildingElementType,
      name: config.name,
      metricType: config.metricType,
      lines: [],
      polygons: [],
      count: 0,
      isExpanded: false,
      isSaved: false,
      color: COLORS[index % COLORS.length],
    }));
    setBuildingElements(elements);
    setCurrentElementId(elements[0]?.id || null);
  }

  function getCurrentElement(): BuildingElement | null {
    return (
      buildingElements.find((element) => element.id === currentElementId) ||
      null
    );
  }

  function updateCurrentElement(updates: Partial<BuildingElement>) {
    if (!currentElementId) return;

    setBuildingElements((prev) =>
      prev.map((element) =>
        element.id === currentElementId
          ? { ...element, ...updates, isSaved: false }
          : element
      )
    );
  }

  // Handle switching between elements with unsaved data reset
  function switchToElement(elementId: string) {
    // If switching to a different element, reset unsaved data from current element
    if (currentElementId && currentElementId !== elementId) {
      const currentElement = buildingElements.find(
        (el) => el.id === currentElementId
      );
      if (currentElement && !currentElement.isSaved) {
        // Reset the current element's unsaved data
        resetElement(currentElementId);
      }
    }

    // Cancel any current drawing
    cancelCurrentDrawing();

    // Switch to the new element
    setCurrentElementId(elementId);
  }

  function toggleElementExpansion(elementId: string) {
    setExpandedElementId((prev) => (prev === elementId ? null : elementId));
  }

  function saveElement(elementId: string) {
    setBuildingElements((prev) =>
      prev.map((element) =>
        element.id === elementId ? { ...element, isSaved: true } : element
      )
    );
  }

  function resetElement(elementId: string) {
    const element = buildingElements.find((el) => el.id === elementId);
    if (!element) return;

    // Get the IDs of lines and polygons to remove from the current layer
    const elementLineIds = element.lines.map((line) => line.id);
    const elementPolygonIds = element.polygons.map((polygon) => polygon.id);

    // Reset the building element
    setBuildingElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? {
              ...el,
              lines: [],
              polygons: [],
              count: 0,
              isSaved: false,
            }
          : el
      )
    );

    // Remove the element's lines and polygons from the current layer
    if (currentLayerId) {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === currentLayerId
            ? {
                ...layer,
                lines: layer.lines.filter(
                  (line) => !elementLineIds.includes(line.id)
                ),
                polygons: layer.polygons.filter(
                  (polygon) => !elementPolygonIds.includes(polygon.id)
                ),
              }
            : layer
        )
      );
    }
  }

  function inferLengthFromArea(elementId: string) {
    const element = buildingElements.find((el) => el.id === elementId);
    if (!element || element.polygons.length === 0) return;

    // Convert polygon perimeters to line segments
    const inferredLines: Line[] = element.polygons.map((polygon, index) => ({
      id: `inferred-line-${elementId}-${index}-${Date.now()}`,
      points: [polygon.points[0], polygon.points[0]], // Dummy points for perimeter-based lines
      length: polygon.perimeter, // Use the polygon's perimeter as the line length
    }));

    setBuildingElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? {
              ...el,
              lines: [...el.lines, ...inferredLines],
              isSaved: false,
            }
          : el
      )
    );
  }

  function addCountToElement(elementId: string, increment: number = 1) {
    setBuildingElements((prev) =>
      prev.map((element) =>
        element.id === elementId
          ? {
              ...element,
              count: Math.max(0, element.count + increment),
              isSaved: false,
            }
          : element
      )
    );
  }

  function getTotalElementLength(element: BuildingElement): number {
    return element.lines.reduce(
      (total, line) => total + convertToMeters(line.length),
      0
    );
  }

  function getTotalElementArea(element: BuildingElement): number {
    return element.polygons.reduce(
      (total, polygon) => total + convertAreaToSquareMeters(polygon.area),
      0
    );
  }

  // Calculate distance between two points
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy); // Return raw SVG units
  };

  // Calculate polygon perimeter
  const calculatePerimeter = (points: Point[]): number => {
    if (points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const nextIndex = (i + 1) % points.length;
      perimeter += calculateDistance(points[i], points[nextIndex]);
    }
    return perimeter;
  };

  // Calculate polygon area using shoelace formula
  const calculateArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2; // Return raw SVG area units
  };

  const handleClick = <T,>(event: ViewerMouseEvent<T>) => {
    if (!event.point || !currentLayerId) return;

    const point = { x: event.point.x, y: event.point.y };
    const currentElement = getCurrentElement();

    if (drawingMode === "line") {
      // Disable line drawing for external walls
      if (currentElement?.type === "external-wall") {
        return;
      }

      if (!currentLineStart) {
        setCurrentLineStart(point);
      } else {
        const newLine: Line = {
          id: `line-${Date.now()}`,
          points: [currentLineStart, point],
          length: calculateDistance(currentLineStart, point),
          elementId: currentElement?.id,
        };

        // Add to current layer
        updateCurrentLayer({
          lines: [...(getCurrentLayer()?.lines || []), newLine],
        });

        // Add to current building element if applicable
        if (
          currentElement &&
          (currentElement.metricType === "length" ||
            currentElement.metricType === "length-area")
        ) {
          updateCurrentElement({
            lines: [...currentElement.lines, newLine],
          });
        }

        setCurrentLineStart(null);
      }
    } else if (drawingMode === "polygon") {
      const newPolygonPoints = [...currentPolygon, point];

      if (currentPolygon.length >= 3) {
        const firstPoint = currentPolygon[0];
        const distance = calculateDistance(point, firstPoint);
        if (distance < 20) {
          const newPolygon: Polygon = {
            id: `polygon-${Date.now()}`,
            points: currentPolygon,
            perimeter: calculatePerimeter(currentPolygon),
            area: calculateArea(currentPolygon),
            isComplete: true,
            elementId: currentElement?.id,
          };

          // Add to current layer
          updateCurrentLayer({
            polygons: [...(getCurrentLayer()?.polygons || []), newPolygon],
          });

          // Add to current building element if applicable
          if (
            currentElement &&
            (currentElement.metricType === "area" ||
              currentElement.metricType === "length-area")
          ) {
            updateCurrentElement({
              polygons: [...currentElement.polygons, newPolygon],
            });

            // Auto infer length for external walls
            if (currentElement.type === "external-wall") {
              // Create inferred line from polygon perimeter
              const inferredLine: Line = {
                id: `inferred-line-${currentElement.id}-${Date.now()}`,
                points: [currentPolygon[0], currentPolygon[0]], // Dummy points for perimeter-based lines
                length: newPolygon.perimeter, // Use the polygon's perimeter as the line length
                elementId: currentElement.id,
              };

              updateCurrentElement({
                lines: [...currentElement.lines, inferredLine],
              });
            }
          }

          setCurrentPolygon([]);
          return;
        }
      }

      setCurrentPolygon(newPolygonPoints);
    }
  };

  // Cancel current drawing
  const cancelCurrentDrawing = () => {
    setCurrentLineStart(null);
    setCurrentPolygon([]);
  };

  // Calculate scaled radius based on current zoom level
  const getScaledRadius = () => {
    const baseRadius = 5;
    const currentZoom = value.a;
    return baseRadius / currentZoom;
  };

  // Calculate scaled stroke width
  const getScaledStrokeWidth = () => {
    const baseWidth = 2;
    const currentZoom = value.a;
    return baseWidth / currentZoom;
  };

  const currentLayer = getCurrentLayer();
  const svgDimensions = getCurrentSVGDimensions();

  // Unit conversion functions
  // Example calculations for verification:
  // A1 (841×594mm) at scale 1:100:
  //   - Full width: 841mm * 100 / 1000 = 84.1m
  //   - Full height: 594mm * 100 / 1000 = 59.4m
  //   - A line across full width should show ~84.1m
  function convertToMeters(pixels: number): number {
    const scale = getCurrentScale();

    // In our SVG system, each SVG unit represents 1mm on the paper
    // For example, if SVG width is 841, that represents 841mm (A1 width)
    const mmOnPaper = pixels; // Direct 1:1 mapping

    // Apply the drawing scale to get real-world dimensions
    // Scale 1:100 means 1mm on paper = 100mm in real world
    const realWorldMm = mmOnPaper * scale;

    // Convert to meters
    return realWorldMm / 1000;
  }

  function convertAreaToSquareMeters(pixelArea: number): number {
    const scale = getCurrentScale();

    // In our SVG system, each square SVG unit represents 1mm² on paper
    const mm2OnPaper = pixelArea; // Direct 1:1 mapping

    // Apply the drawing scale (squared for area)
    // Scale 1:100 means 1mm² on paper = (100)² mm² in real world
    const realWorldMm2 = mm2OnPaper * (scale * scale);

    // Convert to square meters
    return realWorldMm2 / 1000000;
  }

  function getTotalLineLength(lines: Line[]): number {
    return lines.reduce(
      (total, line) => total + convertToMeters(line.length),
      0
    );
  }

  function getTotalPolygonArea(polygons: Polygon[]): number {
    return polygons.reduce(
      (total, polygon) => total + convertAreaToSquareMeters(polygon.area),
      0
    );
  }

  // Create estimation function
  function createEstimation() {
    const estimationData = {
      elements: buildingElements.map((element) => ({
        id: element.id,
        type: element.type,
        name: element.name,
        metricType: element.metricType,
        totalLength: getTotalElementLength(element),
        totalArea: getTotalElementArea(element),
        count: element.count,
        color: element.color,
        price: 0, // Default price for estimate page
      })),
      scale: getCurrentScale(),
      dimensions: {
        ...getCurrentSVGDimensions(),
        standard: dimensionStandard,
        orientation: paperOrientation,
      },
      timestamp: Date.now(),
    };

    // Encode data and navigate to estimate page
    const encodedData = btoa(JSON.stringify(estimationData));
    router.push(`/estimate?data=${encodedData}`);
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Floating Dashboard */}
      <div className="absolute top-4 right-4 z-10 w-[450px] h-[96vh]">
        <Card className="shadow-lg h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              Drawing Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-4 overflow-hidden"
            style={{ height: "calc(100% - 80px)" }}
          >
            <Tabs defaultValue="tools" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="elements">Elements</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
              </TabsList>

              <TabsContent
                value="tools"
                className="space-y-4 overflow-y-auto"
                style={{ height: "calc(100% - 48px)" }}
              >
                {/* Drawing Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Drawing Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={drawingMode === "line" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDrawingMode("line");
                        cancelCurrentDrawing();
                      }}
                      className="flex-1"
                    >
                      <Ruler className="w-4 h-4 mr-1" />
                      Line
                    </Button>
                    <Button
                      variant={
                        drawingMode === "polygon" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setDrawingMode("polygon");
                        cancelCurrentDrawing();
                      }}
                      className="flex-1"
                    >
                      <Pentagon className="w-4 h-4 mr-1" />
                      Polygon
                    </Button>
                  </div>
                </div>

                {/* Scale */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Scale</Label>
                  <Select
                    value={scaleMode}
                    onValueChange={(value) => setScaleMode(value as ScaleMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:100">1:100</SelectItem>
                      <SelectItem value="1:50">1:50</SelectItem>
                      <SelectItem value="1:200">1:200</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {scaleMode === "custom" && (
                    <Input
                      type="number"
                      value={customScale}
                      onChange={(e) =>
                        setCustomScale(Number(e.target.value) || 1)
                      }
                      placeholder="Custom scale (1:x)"
                      className="text-sm"
                    />
                  )}
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dimensions</Label>
                  <Select
                    value={dimensionStandard}
                    onValueChange={(value) =>
                      setDimensionStandard(value as DimensionStandard)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Orientation selector - only show for standard paper sizes */}
                  {dimensionStandard !== "custom" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Orientation</Label>
                      <Select
                        value={paperOrientation}
                        onValueChange={(value) =>
                          setPaperOrientation(value as PaperOrientation)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="horizontal">
                            Horizontal (Landscape) -{" "}
                            {
                              DIMENSION_SIZES[dimensionStandard].horizontal
                                .width
                            }
                            ×
                            {
                              DIMENSION_SIZES[dimensionStandard].horizontal
                                .height
                            }
                            mm
                          </SelectItem>
                          <SelectItem value="vertical">
                            Vertical (Portrait) -{" "}
                            {DIMENSION_SIZES[dimensionStandard].vertical.width}×
                            {DIMENSION_SIZES[dimensionStandard].vertical.height}
                            mm
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {dimensionStandard === "custom" && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={customDimensions.width}
                        onChange={(e) =>
                          setCustomDimensions((prev) => ({
                            ...prev,
                            width: Number(e.target.value) || 1000,
                          }))
                        }
                        placeholder="Width (mm)"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        value={customDimensions.height}
                        onChange={(e) =>
                          setCustomDimensions((prev) => ({
                            ...prev,
                            height: Number(e.target.value) || 1000,
                          }))
                        }
                        placeholder="Height (mm)"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={cancelCurrentDrawing}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Cancel Current Drawing
                </Button>
              </TabsContent>

              <TabsContent
                value="elements"
                className="space-y-4 overflow-y-auto"
                style={{ height: "calc(100% - 48px)" }}
              >
                {/* Building Elements Configuration */}
                <div className="space-y-3">
                  {buildingElements.map((element) => {
                    const config = BUILDING_ELEMENT_CONFIGS[element.type];
                    const isExpanded = expandedElementId === element.id;
                    const isCurrent = currentElementId === element.id;

                    return (
                      <div
                        key={element.id}
                        className={`border rounded-lg transition-all duration-200 ${
                          isCurrent
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        {/* Element Header */}
                        <div
                          className="p-3 cursor-pointer flex items-center justify-between hover:bg-muted/50"
                          onClick={() => {
                            switchToElement(element.id);
                            toggleElementExpansion(element.id);
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: element.color }}
                            />
                            <div className="flex items-center gap-2">
                              {config.icon}
                              <span className="text-sm font-medium">
                                {element.name}
                              </span>
                            </div>
                            {!element.isSaved &&
                              element.lines.length +
                                element.polygons.length +
                                element.count >
                                0 && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Display current measurements */}
                            <div className="text-xs text-muted-foreground">
                              {element.metricType === "count" &&
                                element.count > 0 && (
                                  <span>{element.count}</span>
                                )}
                              {element.metricType === "length" &&
                                element.lines.length > 0 && (
                                  <span>
                                    {getTotalElementLength(element).toFixed(1)}m
                                  </span>
                                )}
                              {element.metricType === "area" &&
                                element.polygons.length > 0 && (
                                  <span>
                                    {getTotalElementArea(element).toFixed(1)}
                                    m²
                                  </span>
                                )}
                              {element.metricType === "length-area" && (
                                <span>
                                  {element.lines.length > 0 &&
                                    `${getTotalElementLength(element).toFixed(
                                      1
                                    )}m`}
                                  {element.lines.length > 0 &&
                                    element.polygons.length > 0 &&
                                    " • "}
                                  {element.polygons.length > 0 &&
                                    `${getTotalElementArea(element).toFixed(
                                      1
                                    )}m²`}
                                </span>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {/* Element Content */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t bg-muted/20">
                            <div className="pt-3 space-y-3">
                              <p className="text-xs text-muted-foreground">
                                {config.description}
                              </p>

                              {/* Count-based elements */}
                              {element.metricType === "count" && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Count</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        addCountToElement(element.id, -1)
                                      }
                                      disabled={element.count <= 0}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={element.count}
                                      onChange={(e) => {
                                        const count = Math.max(
                                          0,
                                          parseInt(e.target.value) || 0
                                        );
                                        updateCurrentElement({ count });
                                      }}
                                      className="text-center text-sm"
                                      min="0"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        addCountToElement(element.id, 1)
                                      }
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Length-based elements */}
                              {(element.metricType === "length" ||
                                element.metricType === "length-area") && (
                                <div className="space-y-2">
                                  <Label className="text-sm">
                                    Length Measurements
                                    {element.type === "external-wall" && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        (Auto-inferred from area)
                                      </span>
                                    )}
                                  </Label>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span>Lines drawn:</span>
                                      <span>{element.lines.length}</span>
                                    </div>
                                    {element.lines.length > 0 && (
                                      <div className="flex justify-between font-medium">
                                        <span>Total length:</span>
                                        <span>
                                          {getTotalElementLength(
                                            element
                                          ).toFixed(2)}
                                          m
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Hide line drawing button for external walls */}
                                  {element.type !== "external-wall" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setDrawingMode("line");
                                        switchToElement(element.id);
                                      }}
                                      className="w-full"
                                    >
                                      <Ruler className="w-3 h-3 mr-1" />
                                      Draw Lines
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* Area-based elements */}
                              {(element.metricType === "area" ||
                                element.metricType === "length-area") && (
                                <div className="space-y-2">
                                  <Label className="text-sm">
                                    Area Measurements
                                    {element.metricType === "length-area" &&
                                      element.type !== "external-wall" && (
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            inferLengthFromArea(element.id)
                                          }
                                          disabled={
                                            element.polygons.length === 0
                                          }
                                          className="h-5 px-2 text-xs ml-auto"
                                        >
                                          Infer Length
                                        </Button>
                                      )}
                                  </Label>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span>Polygons drawn:</span>
                                      <span>{element.polygons.length}</span>
                                    </div>
                                    {element.polygons.length > 0 && (
                                      <div className="flex justify-between font-medium">
                                        <span>Total area:</span>
                                        <div className="flex items-center gap-2">
                                          <span>
                                            {getTotalElementArea(
                                              element
                                            ).toFixed(2)}
                                            m²
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setDrawingMode("polygon");
                                      switchToElement(element.id);
                                    }}
                                    className="w-full"
                                  >
                                    <Pentagon className="w-3 h-3 mr-1" />
                                    {element.type === "external-wall"
                                      ? "Draw Walls (Auto-infers length)"
                                      : "Draw Polygons"}
                                  </Button>
                                </div>
                              )}

                              {/* Save and Reset buttons */}
                              <div className="flex gap-2">
                                {/* Reset button - 30% width */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resetElement(element.id)}
                                  disabled={
                                    element.lines.length === 0 &&
                                    element.polygons.length === 0 &&
                                    element.count === 0
                                  }
                                  className="flex-[0.3]"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>

                                {/* Save button - 70% width */}
                                <Button
                                  size="sm"
                                  onClick={() => saveElement(element.id)}
                                  disabled={element.isSaved}
                                  className="flex-[0.7]"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  {element.isSaved ? "Saved" : "Save Element"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={createEstimation}
                  className="w-full h-auto py-3 px-4 flex items-center justify-start gap-3"
                >
                  <Calculator className="w-5 h-5 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      Create Estimation
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Add Price and Finish Estimate
                    </span>
                  </div>
                </Button>
              </TabsContent>

              <TabsContent
                value="layers"
                className="space-y-4 overflow-y-auto"
                style={{ height: "calc(100% - 48px)" }}
              >
                {/* Current Layer Info */}
                {currentLayer && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Layer</span>
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: currentLayer.color }}
                      />
                    </div>
                    <Input
                      value={currentLayer.name}
                      onChange={(e) =>
                        updateCurrentLayer({ name: e.target.value })
                      }
                      className="text-sm mb-2"
                    />

                    {/* Current Layer Measurements */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lines:</span>
                        <span>{currentLayer.lines.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Polygons:</span>
                        <span>{currentLayer.polygons.length}</span>
                      </div>

                      {/* Total lengths in meters */}
                      {currentLayer.lines.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-600">Total Length:</span>
                          <span className="text-blue-600 font-medium">
                            {getTotalLineLength(currentLayer.lines).toFixed(2)}m
                          </span>
                        </div>
                      )}

                      {/* Total area in square meters */}
                      {currentLayer.polygons.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-600">Total Area:</span>
                          <span className="text-green-600 font-medium">
                            {getTotalPolygonArea(currentLayer.polygons).toFixed(
                              2
                            )}
                            m²
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detailed measurements */}
                    {(currentLayer.lines.length > 0 ||
                      currentLayer.polygons.length > 0) && (
                      <div className="mt-3 pt-2 border-t">
                        <div className="text-xs font-medium mb-2">
                          Measurements
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {/* Lines */}
                          {currentLayer.lines.map((line, index) => (
                            <div
                              key={line.id}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-blue-600">
                                Line {index + 1}:
                              </span>
                              <span>
                                {convertToMeters(line.length).toFixed(2)}m
                              </span>
                            </div>
                          ))}

                          {/* Polygons */}
                          {currentLayer.polygons.map((polygon, index) => (
                            <div key={polygon.id} className="text-xs">
                              <div className="flex justify-between">
                                <span className="text-green-600">
                                  Polygon {index + 1}:
                                </span>
                              </div>
                              <div className="flex justify-between ml-2">
                                <span className="text-muted-foreground">
                                  Perimeter:
                                </span>
                                <span>
                                  {convertToMeters(polygon.perimeter).toFixed(
                                    2
                                  )}
                                  m
                                </span>
                              </div>
                              <div className="flex justify-between ml-2">
                                <span className="text-muted-foreground">
                                  Area:
                                </span>
                                <span>
                                  {convertAreaToSquareMeters(
                                    polygon.area
                                  ).toFixed(2)}
                                  m²
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={createNewLayer} className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Layer
                </Button>

                <Separator />

                {/* Layer List */}
                <div className="space-y-3">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`group relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md ${
                        currentLayerId === layer.id
                          ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                          : "bg-card hover:bg-muted/30 border-border"
                      }`}
                      onClick={() => setCurrentLayerId(layer.id)}
                    >
                      {/* Layer Header */}
                      <div className="p-3 cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                              style={{ backgroundColor: layer.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">
                                {layer.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {layer.lines.length} lines •{" "}
                                {layer.polygons.length} polygons
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerVisibility(layer.id);
                              }}
                              className="h-7 w-7 p-0 hover:bg-background"
                            >
                              {layer.visible ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLayer(layer.id);
                              }}
                              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Measurements Display */}
                        {(layer.lines.length > 0 ||
                          layer.polygons.length > 0) && (
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/50">
                            {layer.lines.length > 0 && (
                              <div className="text-center">
                                <div
                                  className="text-lg font-semibold"
                                  style={{ color: layer.color }}
                                >
                                  {getTotalLineLength(layer.lines).toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                  meters
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  total length
                                </div>
                              </div>
                            )}

                            {layer.polygons.length > 0 && (
                              <div className="text-center">
                                <div
                                  className="text-lg font-semibold"
                                  style={{ color: layer.color }}
                                >
                                  {getTotalPolygonArea(layer.polygons).toFixed(
                                    1
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                  m²
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  total area
                                </div>
                              </div>
                            )}

                            {/* Single column when only one type exists */}
                            {layer.lines.length > 0 &&
                              layer.polygons.length === 0 && <div></div>}
                            {layer.polygons.length > 0 &&
                              layer.lines.length === 0 && <div></div>}
                          </div>
                        )}

                        {/* Empty State */}
                        {layer.lines.length === 0 &&
                          layer.polygons.length === 0 && (
                            <div className="mt-3 pt-2 border-t border-border/50">
                              <div className="text-center text-xs text-muted-foreground py-1">
                                No measurements yet
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Active Layer Indicator */}
                      {currentLayerId === layer.id && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                          style={{ backgroundColor: layer.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ReactSVGPanZoom
        width={dimensions.width}
        height={dimensions.height}
        ref={viewer}
        tool={tool}
        onChangeTool={setTool}
        value={value}
        onChangeValue={setValue}
        onClick={handleClick}
        detectAutoPan={false}
        toolbarProps={{
          position: "left",
        }}
        miniatureProps={{
          position: POSITION_NONE,
          background: "white",
          width: 100,
          height: 100,
        }}
        background="white"
      >
        <svg width={svgDimensions.width} height={svgDimensions.height}>
          {/* Background image */}
          {floorPlanImage && (
            <image
              href={floorPlanImage}
              x="0"
              y="0"
              width={svgDimensions.width}
              height={svgDimensions.height}
            />
          )}

          {/* Render all layers */}
          {layers.map((layer) => {
            if (!layer.visible) return null;

            return (
              <g key={layer.id}>
                {/* Layer Lines */}
                {layer.lines.map((line) => {
                  // Get the element color if line belongs to an element
                  const element = line.elementId
                    ? buildingElements.find((el) => el.id === line.elementId)
                    : null;
                  const lineColor = element?.color || layer.color;

                  return (
                    <g key={line.id}>
                      <line
                        x1={line.points[0].x}
                        y1={line.points[0].y}
                        x2={line.points[1].x}
                        y2={line.points[1].y}
                        stroke={lineColor}
                        strokeWidth={getScaledStrokeWidth()}
                      />
                      <circle
                        cx={line.points[0].x}
                        cy={line.points[0].y}
                        r={getScaledRadius()}
                        fill={lineColor}
                      />
                      <circle
                        cx={line.points[1].x}
                        cy={line.points[1].y}
                        r={getScaledRadius()}
                        fill={lineColor}
                      />
                    </g>
                  );
                })}

                {/* Layer Polygons */}
                {layer.polygons.map((polygon) => {
                  // Get the element color if polygon belongs to an element
                  const element = polygon.elementId
                    ? buildingElements.find((el) => el.id === polygon.elementId)
                    : null;
                  const polygonColor = element?.color || layer.color;

                  return (
                    <g key={polygon.id}>
                      <polygon
                        points={polygon.points
                          .map((p) => `${p.x},${p.y}`)
                          .join(" ")}
                        fill={polygonColor}
                        fillOpacity={0.2}
                        stroke={polygonColor}
                        strokeWidth={getScaledStrokeWidth()}
                      />
                      {polygon.points.map((point, i) => (
                        <circle
                          key={i}
                          cx={point.x}
                          cy={point.y}
                          r={getScaledRadius()}
                          fill={polygonColor}
                        />
                      ))}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Current drawing state (only for current layer) */}
          {currentLayer && (
            <g>
              {/* Current line being drawn */}
              {currentLineStart && (
                <circle
                  cx={currentLineStart.x}
                  cy={currentLineStart.y}
                  r={getScaledRadius()}
                  fill={getCurrentElement()?.color || currentLayer.color}
                  opacity={0.7}
                />
              )}

              {/* Current polygon being drawn */}
              {currentPolygon.length > 0 && (
                <g>
                  {currentPolygon.length > 1 && (
                    <polyline
                      points={currentPolygon
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke={getCurrentElement()?.color || currentLayer.color}
                      strokeWidth={getScaledStrokeWidth()}
                      opacity={0.7}
                    />
                  )}
                  {currentPolygon.map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r={getScaledRadius()}
                      fill={getCurrentElement()?.color || currentLayer.color}
                      opacity={0.7}
                    />
                  ))}
                  {currentPolygon.length >= 3 && (
                    <circle
                      cx={currentPolygon[0].x}
                      cy={currentPolygon[0].y}
                      r={getScaledRadius() * 1.5}
                      fill="none"
                      stroke={getCurrentElement()?.color || currentLayer.color}
                      strokeWidth={getScaledStrokeWidth()}
                      opacity={0.7}
                    />
                  )}
                </g>
              )}
            </g>
          )}
        </svg>
      </ReactSVGPanZoom>
    </div>
  );
}
