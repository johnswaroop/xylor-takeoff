import {
  Point,
  ViewportState,
  FloorPlanScale,
  CoordinateTransform,
} from "../types/annotations";

/**
 * Creates coordinate transformation utilities for a floor plan
 */
export function createCoordinateTransform(
  imageDimensions: { width: number; height: number },
  containerDimensions: { width: number; height: number },
  viewport: ViewportState,
  scale?: FloorPlanScale
): CoordinateTransform {
  // Calculate the actual display dimensions of the image
  const aspectRatio = imageDimensions.width / imageDimensions.height;
  const containerAspectRatio =
    containerDimensions.width / containerDimensions.height;

  let displayWidth: number;
  let displayHeight: number;

  if (aspectRatio > containerAspectRatio) {
    // Image is wider than container
    displayWidth = containerDimensions.width;
    displayHeight = containerDimensions.width / aspectRatio;
  } else {
    // Image is taller than container
    displayWidth = containerDimensions.height * aspectRatio;
    displayHeight = containerDimensions.height;
  }

  // Apply zoom
  displayWidth *= viewport.zoom;
  displayHeight *= viewport.zoom;

  // Calculate offset for centering
  const offsetX =
    (containerDimensions.width - displayWidth) / 2 + viewport.pan.x;
  const offsetY =
    (containerDimensions.height - displayHeight) / 2 + viewport.pan.y;

  return {
    screenToNormalized: (screenX: number, screenY: number): Point => {
      const relativeX = (screenX - offsetX) / displayWidth;
      const relativeY = (screenY - offsetY) / displayHeight;

      return {
        x: Math.max(0, Math.min(1, relativeX)),
        y: Math.max(0, Math.min(1, relativeY)),
        id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    },

    normalizedToScreen: (point: Point): { x: number; y: number } => {
      return {
        x: point.x * displayWidth + offsetX,
        y: point.y * displayHeight + offsetY,
      };
    },

    normalizedToReal: (point: Point): { x: number; y: number } => {
      if (!scale) {
        return {
          x: point.x * imageDimensions.width,
          y: point.y * imageDimensions.height,
        };
      }

      const pixelX = point.x * imageDimensions.width;
      const pixelY = point.y * imageDimensions.height;

      return {
        x: pixelX / scale.pixelsPerUnit,
        y: pixelY / scale.pixelsPerUnit,
      };
    },

    realToNormalized: (realX: number, realY: number): Point => {
      if (!scale) {
        return {
          x: realX / imageDimensions.width,
          y: realY / imageDimensions.height,
          id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      const pixelX = realX * scale.pixelsPerUnit;
      const pixelY = realY * scale.pixelsPerUnit;

      return {
        x: pixelX / imageDimensions.width,
        y: pixelY / imageDimensions.height,
        id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    },
  };
}

/**
 * Calculate the real-world distance between two normalized points
 */
export function calculateDistance(
  point1: Point,
  point2: Point,
  imageDimensions: { width: number; height: number },
  scale?: FloorPlanScale
): number {
  const dx = Math.abs(point2.x - point1.x) * imageDimensions.width;
  const dy = Math.abs(point2.y - point1.y) * imageDimensions.height;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);

  if (!scale) {
    return pixelDistance;
  }

  return pixelDistance / scale.pixelsPerUnit;
}

/**
 * Calculate the real-world area of a rectangle
 */
export function calculateRectangleArea(
  topLeft: Point,
  bottomRight: Point,
  imageDimensions: { width: number; height: number },
  scale?: FloorPlanScale
): number {
  const width = Math.abs(bottomRight.x - topLeft.x) * imageDimensions.width;
  const height = Math.abs(bottomRight.y - topLeft.y) * imageDimensions.height;
  const pixelArea = width * height;

  if (!scale) {
    return pixelArea;
  }

  const realWidth = width / scale.pixelsPerUnit;
  const realHeight = height / scale.pixelsPerUnit;
  return realWidth * realHeight;
}

/**
 * Calculate the real-world area of a polygon using the shoelace formula
 */
export function calculatePolygonArea(
  points: Point[],
  imageDimensions: { width: number; height: number },
  scale?: FloorPlanScale
): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  area = Math.abs(area) / 2;

  // Convert to pixel area
  const pixelArea = area * imageDimensions.width * imageDimensions.height;

  if (!scale) {
    return pixelArea;
  }

  return pixelArea / (scale.pixelsPerUnit * scale.pixelsPerUnit);
}
