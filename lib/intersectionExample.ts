import {
  Line,
  splitLinesAtIntersections,
  splitLinesAtIntersectionsOptimized,
} from "./lineUtils";

/**
 * Example usage of line intersection detection and splitting
 * This demonstrates both the basic and optimized versions
 */

// Example: Create some test lines that intersect
export function createTestLines(): Line[] {
  return [
    { coordinates: [0, 0, 100, 100], id: "diagonal1" },
    { coordinates: [0, 100, 100, 0], id: "diagonal2" },
    { coordinates: [50, 0, 50, 100], id: "vertical" },
    { coordinates: [0, 50, 100, 50], id: "horizontal" },
  ];
}

/**
 * Process lines with intersection detection
 * Choose between basic and optimized versions based on dataset size
 */
export function processLinesWithIntersections(
  lines: Line[],
  useOptimized = false,
  progressCallback?: (progress: number, total: number) => void
) {
  console.log(`Processing ${lines.length} lines for intersections...`);
  console.log(`Using ${useOptimized ? "optimized" : "basic"} algorithm`);

  // Performance estimation
  const estimatedChecks = (lines.length * (lines.length - 1)) / 2;
  console.log(
    `Estimated intersection checks: ${estimatedChecks.toLocaleString()}`
  );

  if (estimatedChecks > 1000000) {
    console.warn(
      `⚠️  Large dataset detected! Consider using the optimized version.`
    );
  }

  const startTime = Date.now();

  const result = useOptimized
    ? splitLinesAtIntersectionsOptimized(lines, 100, progressCallback)
    : splitLinesAtIntersections(lines, progressCallback);

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.log("\n📊 Processing Results:");
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📏 Original lines: ${result.stats.originalLineCount}`);
  console.log(`📏 Final lines: ${result.stats.finalLineCount}`);
  console.log(`🔗 Intersections found: ${result.stats.intersectionCount}`);
  console.log(
    `📈 Line increase: ${(
      (result.stats.finalLineCount / result.stats.originalLineCount - 1) *
      100
    ).toFixed(1)}%`
  );

  if (result.stats.intersectionCount > 0) {
    console.log(
      `⚡ Avg. processing per intersection: ${(
        result.stats.processingTimeMs / result.stats.intersectionCount
      ).toFixed(2)}ms`
    );
  }

  return result;
}

/**
 * Example usage with your actual dataset
 */
export async function processActualDataset() {
  const { loadLineData } = await import("./lineUtils");
  const lines = loadLineData();

  console.log("🚀 Processing actual dataset...");

  // For datasets with 1000+ lines, use optimized version
  const useOptimized = lines.length > 1000;

  const result = processLinesWithIntersections(
    lines,
    useOptimized,
    (progress, total) => {
      if (progress % Math.ceil(total / 10) === 0) {
        console.log(`Progress: ${Math.round((progress / total) * 100)}%`);
      }
    }
  );

  return result;
}

// Example of running the test
if (typeof require !== "undefined" && require.main === module) {
  console.log("🧪 Running intersection test with sample data...");
  const testLines = createTestLines();
  processLinesWithIntersections(testLines);
}
