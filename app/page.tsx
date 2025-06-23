"use client";

import React, { useRef, useState, useEffect } from "react";
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
} from "lucide-react";

type Point = { x: number; y: number };

type Line = {
  id: string;
  points: [Point, Point];
  length: number;
};

type Polygon = {
  id: string;
  points: Point[];
  perimeter: number;
  area: number;
  isComplete: boolean;
};

type DrawingMode = "line" | "polygon";

type ScaleMode = "1:100" | "1:50" | "1:200" | "custom";
type DimensionStandard = "A1" | "A2" | "A3" | "A4" | "custom";

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
  { width: number; height: number }
> = {
  A1: { width: 841, height: 594 },
  A2: { width: 594, height: 420 },
  A3: { width: 420, height: 297 },
  A4: { width: 297, height: 210 },
  custom: { width: 1000, height: 1000 },
};

export default function SVGDrawWithPanZoom() {
  const viewer = useRef<ReactSVGPanZoom>(null);
  const [tool, setTool] = useState<Tool>(TOOL_NONE);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("line");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("1:100");
  const [customScale, setCustomScale] = useState(1);
  const [dimensionStandard, setDimensionStandard] =
    useState<DimensionStandard>("A1");
  const [customDimensions, setCustomDimensions] = useState({
    width: 1000,
    height: 1000,
  });

  // Layer management
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayerId, setCurrentLayerId] = useState<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = useState(0);

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
    setValue((prev) => ({
      ...prev,
      viewerWidth: dimensions.width,
      viewerHeight: dimensions.height,
      SVGWidth: getCurrentSVGDimensions().width,
      SVGHeight: getCurrentSVGDimensions().height,
    }));
  }, [dimensions, dimensionStandard, customDimensions]);

  function getCurrentSVGDimensions() {
    return dimensionStandard === "custom"
      ? customDimensions
      : DIMENSION_SIZES[dimensionStandard];
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

    if (drawingMode === "line") {
      if (!currentLineStart) {
        setCurrentLineStart(point);
      } else {
        const newLine: Line = {
          id: `line-${Date.now()}`,
          points: [currentLineStart, point],
          length: calculateDistance(currentLineStart, point),
        };

        updateCurrentLayer({
          lines: [...(getCurrentLayer()?.lines || []), newLine],
        });
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
          };

          updateCurrentLayer({
            polygons: [...(getCurrentLayer()?.polygons || []), newPolygon],
          });
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

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Floating Dashboard */}
      <div className="absolute top-4 right-4 z-10 w-80">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              Drawing Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
              </TabsList>

              <TabsContent value="tools" className="space-y-4">
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
                      <SelectItem value="A1">A1 (841×594mm)</SelectItem>
                      <SelectItem value="A2">A2 (594×420mm)</SelectItem>
                      <SelectItem value="A3">A3 (420×297mm)</SelectItem>
                      <SelectItem value="A4">A4 (297×210mm)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
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

              <TabsContent value="layers" className="space-y-4">
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
                <div className="space-y-3 max-h-64 overflow-y-auto">
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
          <image
            href="/a1.jpg"
            x="0"
            y="0"
            width={svgDimensions.width}
            height={svgDimensions.height}
          />

          {/* Render all layers */}
          {layers.map((layer) => {
            if (!layer.visible) return null;

            return (
              <g key={layer.id}>
                {/* Layer Lines */}
                {layer.lines.map((line) => (
                  <g key={line.id}>
                    <line
                      x1={line.points[0].x}
                      y1={line.points[0].y}
                      x2={line.points[1].x}
                      y2={line.points[1].y}
                      stroke={layer.color}
                      strokeWidth={getScaledStrokeWidth()}
                    />
                    <circle
                      cx={line.points[0].x}
                      cy={line.points[0].y}
                      r={getScaledRadius()}
                      fill={layer.color}
                    />
                    <circle
                      cx={line.points[1].x}
                      cy={line.points[1].y}
                      r={getScaledRadius()}
                      fill={layer.color}
                    />
                  </g>
                ))}

                {/* Layer Polygons */}
                {layer.polygons.map((polygon) => (
                  <g key={polygon.id}>
                    <polygon
                      points={polygon.points
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill={layer.color}
                      fillOpacity={0.2}
                      stroke={layer.color}
                      strokeWidth={getScaledStrokeWidth()}
                    />
                    {polygon.points.map((point, i) => (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r={getScaledRadius()}
                        fill={layer.color}
                      />
                    ))}
                  </g>
                ))}
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
                  fill={currentLayer.color}
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
                      stroke={currentLayer.color}
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
                      fill={currentLayer.color}
                      opacity={0.7}
                    />
                  ))}
                  {currentPolygon.length >= 3 && (
                    <circle
                      cx={currentPolygon[0].x}
                      cy={currentPolygon[0].y}
                      r={getScaledRadius() * 1.5}
                      fill="none"
                      stroke={currentLayer.color}
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
