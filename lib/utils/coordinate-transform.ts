import { Point, ScreenPoint, CoordinateTransform } from "../types/floor-plan";

export function createCoordinateTransform(
  imageWidth: number,
  imageHeight: number,
  svgWidth: number,
  svgHeight: number
): CoordinateTransform {
  // Convert normalized image coordinates (0-1) to SVG screen coordinates
  const imageToSVG = (point: Point): ScreenPoint => {
    return {
      x: point.x * svgWidth,
      y: point.y * svgHeight,
    };
  };

  // Convert SVG screen coordinates to normalized image coordinates (0-1)
  const svgToImage = (point: ScreenPoint): Point => {
    return {
      x: Math.max(0, Math.min(1, point.x / svgWidth)),
      y: Math.max(0, Math.min(1, point.y / svgHeight)),
    };
  };

  // Calculate distance between two normalized points
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = (p2.x - p1.x) * imageWidth;
    const dy = (p2.y - p1.y) * imageHeight;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate area of a polygon using the shoelace formula
  const calculateArea = (points: Point[]): number => {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      // Convert to pixel coordinates for accurate area calculation
      const xi = points[i].x * imageWidth;
      const yi = points[i].y * imageHeight;
      const xj = points[j].x * imageWidth;
      const yj = points[j].y * imageHeight;

      area += xi * yj - xj * yi;
    }
    return Math.abs(area) / 2;
  };

  return {
    imageToSVG,
    svgToImage,
    calculateDistance,
    calculateArea,
  };
}

// Utility function to calculate real-world measurements
export function calculateRealWorldDistance(
  p1: Point,
  p2: Point,
  pixelsPerUnit: number,
  imageWidth: number,
  imageHeight: number
): number {
  const dx = (p2.x - p1.x) * imageWidth;
  const dy = (p2.y - p1.y) * imageHeight;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  return pixelDistance / pixelsPerUnit;
}

export function calculateRealWorldArea(
  points: Point[],
  pixelsPerUnit: number,
  imageWidth: number,
  imageHeight: number
): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const xi = points[i].x * imageWidth;
    const yi = points[i].y * imageHeight;
    const xj = points[j].x * imageWidth;
    const yj = points[j].y * imageHeight;

    area += xi * yj - xj * yi;
  }

  const pixelArea = Math.abs(area) / 2;
  const unitArea = pixelArea / (pixelsPerUnit * pixelsPerUnit);
  return unitArea;
}
