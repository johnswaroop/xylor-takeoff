// Floor Plan Annotation Types
export interface Point {
  x: number; // Relative coordinate (0-1)
  y: number; // Relative coordinate (0-1)
}

export interface ScreenPoint {
  x: number; // Screen/SVG coordinate in pixels
  y: number; // Screen/SVG coordinate in pixels
}

export interface FloorPlanAnnotation {
  id: string;
  type: "point" | "rectangle" | "polygon";
  label?: string;
  color?: string;
  strokeWidth?: number;
  category?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PointAnnotation extends FloorPlanAnnotation {
  type: "point";
  position: Point;
  size?: number;
}

export interface RectangleAnnotation extends FloorPlanAnnotation {
  type: "rectangle";
  topLeft: Point;
  bottomRight: Point;
  area?: number; // Real-world area if scale is defined
}

export interface PolygonAnnotation extends FloorPlanAnnotation {
  type: "polygon";
  points: Point[];
  closed: boolean;
  area?: number; // Real-world area if scale is defined
}

export type Annotation =
  | PointAnnotation
  | RectangleAnnotation
  | PolygonAnnotation;

export interface FloorPlanScale {
  pixelsPerUnit: number; // e.g., 100 pixels = 1 meter
  unit: "mm" | "cm" | "m" | "in" | "ft";
  calibrationLine?: {
    start: Point;
    end: Point;
    realWorldLength: number;
  };
}

export interface FloorPlanState {
  imageUrl: string;
  imageDimensions: { width: number; height: number };
  annotations: Annotation[];
  scale?: FloorPlanScale;
  selectedAnnotationId?: string;
  drawingMode: DrawingMode;
  isDrawing: boolean;
  currentPoints: Point[];
}

export enum DrawingMode {
  SELECT = "select",
  POINT = "point",
  RECTANGLE = "rectangle",
  POLYGON = "polygon",
  CALIBRATE = "calibrate",
}

export interface CoordinateTransform {
  imageToSVG: (point: Point) => ScreenPoint;
  svgToImage: (point: ScreenPoint) => Point;
  calculateDistance: (p1: Point, p2: Point) => number;
  calculateArea: (points: Point[]) => number;
}

export interface FloorPlanAnnotatorProps {
  imageUrl: string;
  initialAnnotations?: Annotation[];
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  onScaleChange?: (scale: FloorPlanScale) => void;
  className?: string;
  enablePanZoom?: boolean;
  maxZoom?: number;
  minZoom?: number;
}
