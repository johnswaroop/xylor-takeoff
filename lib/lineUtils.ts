import lineData from "./line.json";

export interface Line {
  coordinates: [number, number, number, number]; // [x1, y1, x2, y2]
  id?: string; // Optional ID for tracking line segments
}

export interface IntersectionPoint {
  x: number;
  y: number;
  line1Index: number;
  line2Index: number;
}

// Transform the line.json format to the format expected by LineOverlay component
export function transformLineData(rawLineData: number[][][]): Line[] {
  return rawLineData.map((lineGroup, index) => ({
    coordinates: lineGroup[0] as [number, number, number, number],
    id: `original-${index}`,
  }));
}

// Load and transform line data from JSON
export function loadLineData(): Line[] {
  try {
    return transformLineData(lineData);
  } catch (error) {
    console.error("Error loading line data:", error);
    return [];
  }
}

/**
 * Calculate the intersection point between two line segments
 * Uses parametric line equations to find intersection
 */
export function getLineIntersection(
  line1: Line,
  line2: Line
): IntersectionPoint | null {
  const [x1, y1, x2, y2] = line1.coordinates;
  const [x3, y3, x4, y4] = line2.coordinates;

  // Calculate denominators for parametric equations
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Lines are parallel (or coincident)
  if (Math.abs(denom) < 1e-10) {
    return null;
  }

  // Calculate parameters t and u
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // Check if intersection occurs within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
      line1Index: -1, // Will be set by caller
      line2Index: -1, // Will be set by caller
    };
  }

  return null;
}

/**
 * Split a line at a given point
 * Returns two new line segments
 */
export function splitLineAtPoint(
  line: Line,
  point: { x: number; y: number },
  tolerance = 1e-6
): Line[] {
  const [x1, y1, x2, y2] = line.coordinates;

  // Check if point is at the start or end of the line (within tolerance)
  const distToStart = Math.sqrt((point.x - x1) ** 2 + (point.y - y1) ** 2);
  const distToEnd = Math.sqrt((point.x - x2) ** 2 + (point.y - y2) ** 2);

  if (distToStart < tolerance || distToEnd < tolerance) {
    // Point is at line endpoint, return original line
    return [line];
  }

  // Create two new line segments
  const segment1: Line = {
    coordinates: [x1, y1, point.x, point.y],
    id: `${line.id || "line"}-seg1`,
  };

  const segment2: Line = {
    coordinates: [point.x, point.y, x2, y2],
    id: `${line.id || "line"}-seg2`,
  };

  return [segment1, segment2];
}

/**
 * Find all intersections between lines in a collection
 * Returns array of intersection points with line indices
 */
export function findAllIntersections(lines: Line[]): IntersectionPoint[] {
  const intersections: IntersectionPoint[] = [];

  // Check every pair of lines (O(n²) complexity)
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const intersection = getLineIntersection(lines[i], lines[j]);
      if (intersection) {
        intersection.line1Index = i;
        intersection.line2Index = j;
        intersections.push(intersection);
      }
    }
  }

  return intersections;
}

/**
 * Split all lines at their intersection points
 * This is a computationally expensive operation O(n²) for intersection detection
 * plus additional complexity for line splitting and management
 *
 * Performance characteristics:
 * - Time Complexity: O(n²) where n is the number of lines
 * - Space Complexity: O(m) where m is the number of resulting line segments
 * - For 1000 lines: ~500,000 intersection checks
 * - For 5000 lines (like your dataset): ~12.5 million intersection checks
 *
 * Optimization strategies included:
 * - Early termination for parallel lines
 * - Tolerance-based endpoint checking
 * - Efficient geometric calculations
 * - Batch processing of splits to avoid redundant work
 */
export function splitLinesAtIntersections(
  lines: Line[],
  progressCallback?: (progress: number, total: number) => void
): {
  lines: Line[];
  intersections: IntersectionPoint[];
  stats: {
    originalLineCount: number;
    finalLineCount: number;
    intersectionCount: number;
    processingTimeMs: number;
  };
} {
  const startTime = performance.now();
  console.log(`Starting intersection detection for ${lines.length} lines...`);

  // Find all intersections
  progressCallback?.(0, lines.length);
  const intersections = findAllIntersections(lines);

  console.log(`Found ${intersections.length} intersections`);

  if (intersections.length === 0) {
    const endTime = performance.now();
    return {
      lines: [...lines], // Return copy of original lines
      intersections: [],
      stats: {
        originalLineCount: lines.length,
        finalLineCount: lines.length,
        intersectionCount: 0,
        processingTimeMs: endTime - startTime,
      },
    };
  }

  // Group intersections by line index for efficient processing
  const intersectionsByLine = new Map<number, IntersectionPoint[]>();

  intersections.forEach((intersection) => {
    // Add to both lines involved in the intersection
    if (!intersectionsByLine.has(intersection.line1Index)) {
      intersectionsByLine.set(intersection.line1Index, []);
    }
    if (!intersectionsByLine.has(intersection.line2Index)) {
      intersectionsByLine.set(intersection.line2Index, []);
    }

    intersectionsByLine.get(intersection.line1Index)!.push(intersection);
    intersectionsByLine.get(intersection.line2Index)!.push(intersection);
  });

  // Process each line that has intersections
  const resultLines: Line[] = [];

  for (let i = 0; i < lines.length; i++) {
    progressCallback?.(i, lines.length);

    const lineIntersections = intersectionsByLine.get(i);

    if (!lineIntersections || lineIntersections.length === 0) {
      // No intersections for this line, keep original
      resultLines.push({ ...lines[i] });
      continue;
    }

    // Sort intersection points along the line by distance from start point
    const [x1, y1] = lines[i].coordinates;
    const sortedIntersections = lineIntersections
      .map((intersection) => ({
        ...intersection,
        distanceFromStart: Math.sqrt(
          (intersection.x - x1) ** 2 + (intersection.y - y1) ** 2
        ),
      }))
      .sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    // Split the line at all intersection points
    let currentLine = lines[i];
    const segments: Line[] = [];

    for (const intersection of sortedIntersections) {
      const splitResult = splitLineAtPoint(currentLine, intersection);

      if (splitResult.length === 2) {
        // Line was split successfully
        segments.push(splitResult[0]);
        currentLine = splitResult[1]; // Continue with the second segment
      }
      // If splitResult.length === 1, the intersection was at an endpoint
    }

    // Add the final segment
    segments.push(currentLine);

    // Filter out very short segments (potential floating point artifacts)
    const validSegments = segments.filter((segment) => {
      const [x1, y1, x2, y2] = segment.coordinates;
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      return length > 1e-6; // Minimum segment length threshold
    });

    resultLines.push(...validSegments);
  }

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  console.log(`Intersection processing complete:`);
  console.log(`- Original lines: ${lines.length}`);
  console.log(`- Final lines: ${resultLines.length}`);
  console.log(`- Intersections found: ${intersections.length}`);
  console.log(`- Processing time: ${processingTime.toFixed(2)}ms`);

  progressCallback?.(lines.length, lines.length);

  return {
    lines: resultLines,
    intersections,
    stats: {
      originalLineCount: lines.length,
      finalLineCount: resultLines.length,
      intersectionCount: intersections.length,
      processingTimeMs: processingTime,
    },
  };
}

/**
 * Optimized version for large datasets using spatial indexing
 * Divides the space into a grid to reduce the number of intersection checks
 */
export function splitLinesAtIntersectionsOptimized(
  lines: Line[],
  gridSize = 100, // Grid cell size for spatial indexing
  progressCallback?: (progress: number, total: number) => void
): ReturnType<typeof splitLinesAtIntersections> {
  const startTime = performance.now();
  console.log(
    `Starting optimized intersection detection for ${lines.length} lines with grid size ${gridSize}...`
  );

  // Calculate bounding box of all lines
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  lines.forEach((line) => {
    const [x1, y1, x2, y2] = line.coordinates;
    minX = Math.min(minX, x1, x2);
    minY = Math.min(minY, y1, y2);
    maxX = Math.max(maxX, x1, x2);
    maxY = Math.max(maxY, y1, y2);
  });

  // Create spatial grid
  const cols = Math.ceil((maxX - minX) / gridSize);
  const rows = Math.ceil((maxY - minY) / gridSize);
  const grid: number[][][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => [])
    );

  // Assign lines to grid cells
  lines.forEach((line, index) => {
    const [x1, y1, x2, y2] = line.coordinates;
    const startCol = Math.floor((Math.min(x1, x2) - minX) / gridSize);
    const endCol = Math.floor((Math.max(x1, x2) - minX) / gridSize);
    const startRow = Math.floor((Math.min(y1, y2) - minY) / gridSize);
    const endRow = Math.floor((Math.max(y1, y2) - minY) / gridSize);

    // Add line to all cells it spans
    for (
      let row = Math.max(0, startRow);
      row <= Math.min(rows - 1, endRow);
      row++
    ) {
      for (
        let col = Math.max(0, startCol);
        col <= Math.min(cols - 1, endCol);
        col++
      ) {
        grid[row][col].push(index);
      }
    }
  });

  // Find intersections within each grid cell
  const intersections: IntersectionPoint[] = [];
  const checkedPairs = new Set<string>();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellLines = grid[row][col];

      // Check all pairs within this cell
      for (let i = 0; i < cellLines.length; i++) {
        for (let j = i + 1; j < cellLines.length; j++) {
          const line1Index = cellLines[i];
          const line2Index = cellLines[j];
          const pairKey = `${Math.min(line1Index, line2Index)}-${Math.max(
            line1Index,
            line2Index
          )}`;

          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);

          const intersection = getLineIntersection(
            lines[line1Index],
            lines[line2Index]
          );
          if (intersection) {
            intersection.line1Index = line1Index;
            intersection.line2Index = line2Index;
            intersections.push(intersection);
          }
        }
      }
    }

    progressCallback?.(row, rows);
  }

  console.log(
    `Spatial grid optimization reduced checks from ${
      (lines.length * (lines.length - 1)) / 2
    } to ${checkedPairs.size}`
  );
  console.log(`Found ${intersections.length} intersections`);

  // Use the same splitting logic as the basic version
  if (intersections.length === 0) {
    const endTime = performance.now();
    return {
      lines: [...lines],
      intersections: [],
      stats: {
        originalLineCount: lines.length,
        finalLineCount: lines.length,
        intersectionCount: 0,
        processingTimeMs: endTime - startTime,
      },
    };
  }

  // Continue with the same splitting logic...
  const intersectionsByLine = new Map<number, IntersectionPoint[]>();

  intersections.forEach((intersection) => {
    if (!intersectionsByLine.has(intersection.line1Index)) {
      intersectionsByLine.set(intersection.line1Index, []);
    }
    if (!intersectionsByLine.has(intersection.line2Index)) {
      intersectionsByLine.set(intersection.line2Index, []);
    }

    intersectionsByLine.get(intersection.line1Index)!.push(intersection);
    intersectionsByLine.get(intersection.line2Index)!.push(intersection);
  });

  const resultLines: Line[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineIntersections = intersectionsByLine.get(i);

    if (!lineIntersections || lineIntersections.length === 0) {
      resultLines.push({ ...lines[i] });
      continue;
    }

    const [x1, y1] = lines[i].coordinates;
    const sortedIntersections = lineIntersections
      .map((intersection) => ({
        ...intersection,
        distanceFromStart: Math.sqrt(
          (intersection.x - x1) ** 2 + (intersection.y - y1) ** 2
        ),
      }))
      .sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    let currentLine = lines[i];
    const segments: Line[] = [];

    for (const intersection of sortedIntersections) {
      const splitResult = splitLineAtPoint(currentLine, intersection);

      if (splitResult.length === 2) {
        segments.push(splitResult[0]);
        currentLine = splitResult[1];
      }
    }

    segments.push(currentLine);

    const validSegments = segments.filter((segment) => {
      const [x1, y1, x2, y2] = segment.coordinates;
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      return length > 1e-6;
    });

    resultLines.push(...validSegments);
  }

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  console.log(`Optimized intersection processing complete:`);
  console.log(`- Original lines: ${lines.length}`);
  console.log(`- Final lines: ${resultLines.length}`);
  console.log(`- Intersections found: ${intersections.length}`);
  console.log(`- Processing time: ${processingTime.toFixed(2)}ms`);

  return {
    lines: resultLines,
    intersections,
    stats: {
      originalLineCount: lines.length,
      finalLineCount: resultLines.length,
      intersectionCount: intersections.length,
      processingTimeMs: processingTime,
    },
  };
}
