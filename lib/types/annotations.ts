// Annotation system types and interfaces

export interface Point {
  x: number; // Normalized coordinate (0-1)
  y: number; // Normalized coordinate (0-1)
  id: string;
}

export interface Rectangle {
  id: string;
  topLeft: Point;
  bottomRight: Point;
  label?: string;
  category?: string;
  color?: string;
  strokeWidth?: number;
}

export interface Polygon {
  id: string;
  points: Point[];
  label?: string;
  category?: string;
  color?: string;
  strokeWidth?: number;
  closed?: boolean;
}

export type Annotation = Rectangle | Polygon;

export interface AnnotationLayer {
  id: string;
  name: string;
  annotations: Annotation[];
  visible: boolean;
  locked: boolean;
}

export interface FloorPlanScale {
  pixelsPerUnit: number; // pixels per cm/meter
  unit: "cm" | "m" | "ft" | "in";
  referenceLength?: number; // real-world length for calibration
}

export interface FloorPlanProject {
  id: string;
  name: string;
  imageUrl: string;
  imageDimensions: {
    width: number;
    height: number;
  };
  scale?: FloorPlanScale;
  layers: AnnotationLayer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  containerDimensions: { width: number; height: number };
}

export enum DrawingMode {
  SELECT = "select",
  POINT = "point",
  RECTANGLE = "rectangle",
  POLYGON = "polygon",
  MEASURE = "measure",
}

export interface CoordinateTransform {
  screenToNormalized: (screenX: number, screenY: number) => Point;
  normalizedToScreen: (point: Point) => { x: number; y: number };
  normalizedToReal: (point: Point) => { x: number; y: number };
  realToNormalized: (realX: number, realY: number) => Point;
}
