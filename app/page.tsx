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

type Point = { x: number; y: number };

export default function SVGDrawWithPanZoom() {
  const viewer = useRef<ReactSVGPanZoom>(null);
  const [tool, setTool] = useState<Tool>(TOOL_NONE);
  const [points, setPoints] = useState<Point[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
    SVGWidth: 1000,
    SVGHeight: 1000,
    startX: null,
    startY: null,
    endX: null,
    endY: null,
    miniatureOpen: false,
  });

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Add event listener for window resize
    window.addEventListener("resize", updateDimensions);

    // Cleanup
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Update value when dimensions change
  useEffect(() => {
    setValue((prev) => ({
      ...prev,
      viewerWidth: dimensions.width,
      viewerHeight: dimensions.height,
    }));
  }, [dimensions]);

  const handleClick = <T,>(event: ViewerMouseEvent<T>) => {
    // The point is available in the event object
    if (
      event.point &&
      typeof event.point.x === "number" &&
      typeof event.point.y === "number"
    ) {
      setPoints((prev) => [...prev, event.point]);
    }
  };

  // Calculate scaled radius based on current zoom level
  const getScaledRadius = () => {
    const baseRadius = 5; // Base radius when zoom = 1
    const currentZoom = value.a; // The 'a' property represents the scale factor
    return baseRadius / currentZoom;
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
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
        miniatureProps={{
          position: POSITION_NONE,
          background: "white",
          width: 100,
          height: 100,
        }}
        background="white"
      >
        <svg width={1000} height={1000}>
          {/* Background image (replace with your own) */}
          <image href="/a1.jpg" x="0" y="0" width="1000" height="1000" />

          {/* Draw placed points with scaled radius */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={getScaledRadius()}
              fill="red"
            />
          ))}
        </svg>
      </ReactSVGPanZoom>
    </div>
  );
}
