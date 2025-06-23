"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface Point {
  x: number;
  y: number;
  id: string;
}

interface Shape {
  id: string;
  type: "line" | "polygon";
  points: Point[];
  perimeter?: number;
  area?: number;
}

interface ImageAnnotationToolProps {
  imageSrc: string;
  pixelsPerUnit?: number;
  unit?: string;
}

export default function ImageAnnotationTool({
  imageSrc,
  pixelsPerUnit = 1,
  unit = "pixels",
}: ImageAnnotationToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Point[]>([]);
  const [mode, setMode] = useState<"point" | "line" | "polygon">("point");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [actualImageDimensions, setActualImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle keyboard events for spacebar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Handle image load to get actual dimensions and set up SVG
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate display dimensions while maintaining aspect ratio
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const imageAspectRatio = naturalWidth / naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
      } else {
        // Image is taller than container
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
      }

      setActualImageDimensions({ width: naturalWidth, height: naturalHeight });
      setSvgDimensions({ width: displayWidth, height: displayHeight });
    }
  }, []);

  // Convert screen coordinates to SVG coordinates
  const screenToSVGCoords = useCallback((screenX: number, screenY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = screenX - svgRect.left;
    const y = screenY - svgRect.top;

    return { x, y };
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (p1: Point, p2: Point) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);

      // Convert SVG pixels to image pixels, then to real units
      const scaleRatio = actualImageDimensions.width / svgDimensions.width;
      const imagePixelDistance = pixelDistance * scaleRatio;
      return imagePixelDistance / pixelsPerUnit;
    },
    [pixelsPerUnit, actualImageDimensions, svgDimensions]
  );

  // Calculate perimeter of a shape
  const calculatePerimeter = useCallback(
    (shapePoints: Point[]) => {
      if (shapePoints.length < 2) return 0;

      let perimeter = 0;
      for (let i = 0; i < shapePoints.length - 1; i++) {
        perimeter += calculateDistance(shapePoints[i], shapePoints[i + 1]);
      }

      if (shapePoints.length > 2) {
        perimeter += calculateDistance(
          shapePoints[shapePoints.length - 1],
          shapePoints[0]
        );
      }

      return perimeter;
    },
    [calculateDistance]
  );

  // Calculate area of a polygon using shoelace formula
  const calculateArea = useCallback(
    (shapePoints: Point[]) => {
      if (shapePoints.length < 3) return 0;

      let area = 0;
      for (let i = 0; i < shapePoints.length; i++) {
        const j = (i + 1) % shapePoints.length;
        area += shapePoints[i].x * shapePoints[j].y;
        area -= shapePoints[j].x * shapePoints[i].y;
      }
      area = Math.abs(area) / 2;

      // Convert SVG pixels to image pixels, then to real units
      const scaleRatio = actualImageDimensions.width / svgDimensions.width;
      const imagePixelArea = area * scaleRatio * scaleRatio;
      return imagePixelArea / (pixelsPerUnit * pixelsPerUnit);
    },
    [pixelsPerUnit, actualImageDimensions, svgDimensions]
  );

  // Handle SVG click
  const handleSVGClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning || isSpacePressed) return;

      const coords = screenToSVGCoords(e.clientX, e.clientY);
      const newPoint: Point = {
        x: coords.x,
        y: coords.y,
        id: `point-${Date.now()}-${Math.random()}`,
      };

      if (mode === "point") {
        setPoints((prev) => [...prev, newPoint]);
      } else if (mode === "line") {
        const newCurrentShape = [...currentShape, newPoint];
        setCurrentShape(newCurrentShape);

        if (newCurrentShape.length === 2) {
          const shape: Shape = {
            id: `line-${Date.now()}`,
            type: "line",
            points: newCurrentShape,
            perimeter: calculatePerimeter(newCurrentShape),
          };
          setShapes((prev) => [...prev, shape]);
          setCurrentShape([]);
        }
      } else if (mode === "polygon") {
        setCurrentShape((prev) => [...prev, newPoint]);
      }
    },
    [
      mode,
      currentShape,
      screenToSVGCoords,
      calculatePerimeter,
      isPanning,
      isSpacePressed,
    ]
  );

  // Complete polygon
  const completePolygon = useCallback(() => {
    if (currentShape.length >= 3) {
      const shape: Shape = {
        id: `polygon-${Date.now()}`,
        type: "polygon",
        points: currentShape,
        perimeter: calculatePerimeter(currentShape),
        area: calculateArea(currentShape),
      };
      setShapes((prev) => [...prev, shape]);
      setCurrentShape([]);
    }
  }, [currentShape, calculatePerimeter, calculateArea]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        e.preventDefault();
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isSpacePressed]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && isSpacePressed) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPoint, isSpacePressed]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(5, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.1, prev / 1.2));
  }, []);

  const setZoomLevel = useCallback((newScale: number) => {
    setScale(Math.max(0.1, Math.min(5, newScale)));
  }, []);

  // Clear all annotations
  const clearAll = useCallback(() => {
    setPoints([]);
    setShapes([]);
    setCurrentShape([]);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex gap-4 p-4 bg-gray-100 flex-wrap items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("point")}
            className={`px-4 py-2 rounded ${
              mode === "point" ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            Point
          </button>
          <button
            onClick={() => setMode("line")}
            className={`px-4 py-2 rounded ${
              mode === "line" ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setMode("polygon")}
            className={`px-4 py-2 rounded ${
              mode === "polygon" ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            Polygon
          </button>
        </div>

        {mode === "polygon" && currentShape.length >= 3 && (
          <button
            onClick={completePolygon}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Complete Polygon
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={resetView}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Reset View
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Clear All
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            -
          </button>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={scale}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            +
          </button>
          <span className="text-sm text-gray-600 min-w-[60px]">
            {(scale * 100).toFixed(0)}%
          </span>
        </div>

        <div className="text-sm text-gray-600">
          Points: {points.length} | Shapes: {shapes.length}
          <br />
          Hold SPACE to pan
        </div>
      </div>

      {/* Main container */}
      <div className="flex-1 flex h-full">
        {/* Image and SVG overlay */}
        <div
          ref={containerRef}
          className={`flex-1 relative overflow-hidden flex items-center justify-center ${
            isSpacePressed ? "cursor-grab" : "cursor-crosshair"
          } ${isPanning ? "cursor-grabbing" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            style={{
              transform: `scale(${scale}) translate(${pan.x / scale}px, ${
                pan.y / scale
              }px)`,
              transformOrigin: "0 0",
            }}
          >
            <div className="relative">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Annotation target"
                className="block"
                style={{
                  width: svgDimensions.width || "auto",
                  height: svgDimensions.height || "auto",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />

              <svg
                ref={svgRef}
                className="absolute top-0 left-0"
                width={svgDimensions.width}
                height={svgDimensions.height}
                onClick={handleSVGClick}
                style={{
                  pointerEvents: isPanning || isSpacePressed ? "none" : "all",
                }}
              >
                {/* Render individual points */}
                {points.map((point) => (
                  <circle
                    key={point.id}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill="red"
                    stroke="white"
                    strokeWidth={1}
                  />
                ))}

                {/* Render completed shapes */}
                {shapes.map((shape) => (
                  <g key={shape.id}>
                    {shape.type === "line" && shape.points.length === 2 && (
                      <line
                        x1={shape.points[0].x}
                        y1={shape.points[0].y}
                        x2={shape.points[1].x}
                        y2={shape.points[1].y}
                        stroke="blue"
                        strokeWidth={2}
                      />
                    )}

                    {shape.type === "polygon" && (
                      <polygon
                        points={shape.points
                          .map((p) => `${p.x},${p.y}`)
                          .join(" ")}
                        fill="rgba(0, 0, 255, 0.2)"
                        stroke="blue"
                        strokeWidth={2}
                      />
                    )}

                    {/* Render shape points */}
                    {shape.points.map((point) => (
                      <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        r={3}
                        fill="blue"
                        stroke="white"
                        strokeWidth={1}
                      />
                    ))}
                  </g>
                ))}

                {/* Render current shape being drawn */}
                {currentShape.length > 0 && (
                  <g>
                    {currentShape.map((point) => (
                      <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        r={3}
                        fill="orange"
                        stroke="white"
                        strokeWidth={1}
                      />
                    ))}

                    {mode === "line" && currentShape.length === 1 && (
                      <circle
                        cx={currentShape[0].x}
                        cy={currentShape[0].y}
                        r={6}
                        fill="none"
                        stroke="orange"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    )}

                    {mode === "polygon" && currentShape.length > 1 && (
                      <polyline
                        points={currentShape
                          .map((p) => `${p.x},${p.y}`)
                          .join(" ")}
                        fill="none"
                        stroke="orange"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    )}
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Measurements panel */}
        <div className="w-80 bg-gray-50 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Measurements</h3>

          {actualImageDimensions.width > 0 && (
            <div className="mb-4 p-3 bg-white rounded">
              <h4 className="font-medium mb-2">Image Info</h4>
              <p className="text-sm text-gray-600">
                Dimensions: {actualImageDimensions.width} ×{" "}
                {actualImageDimensions.height} px
              </p>
              <p className="text-sm text-gray-600">
                Display: {svgDimensions.width.toFixed(0)} ×{" "}
                {svgDimensions.height.toFixed(0)} px
              </p>
              <p className="text-sm text-gray-600">
                Scale: {pixelsPerUnit} px/{unit}
              </p>
            </div>
          )}

          {shapes.map((shape) => (
            <div key={shape.id} className="mb-4 p-3 bg-white rounded">
              <h4 className="font-medium mb-2 capitalize">{shape.type}</h4>
              {shape.perimeter && (
                <p className="text-sm text-gray-600">
                  Perimeter: {shape.perimeter.toFixed(2)} {unit}
                </p>
              )}
              {shape.area && (
                <p className="text-sm text-gray-600">
                  Area: {shape.area.toFixed(2)} {unit}²
                </p>
              )}
              <p className="text-sm text-gray-600">
                Points: {shape.points.length}
              </p>
            </div>
          ))}

          {currentShape.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded">
              <h4 className="font-medium mb-2">Current {mode}</h4>
              <p className="text-sm text-gray-600">
                Points: {currentShape.length}
                {mode === "polygon" && currentShape.length >= 3 && (
                  <span className="text-green-600 ml-2">Ready to complete</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
