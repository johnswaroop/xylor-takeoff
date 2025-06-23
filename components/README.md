# ImageAnnotator Component

A React component for annotating images with coordinate points that supports zoom, pan, and maintains aspect ratio. Now with enhanced marking capabilities!

## Features

- ✅ **Zoom & Pan**: Built-in zoom and pan functionality using `react-zoom-pan-pinch`
- ✅ **Aspect Ratio Preservation**: Coordinates are normalized (0-1) and maintain position regardless of image scaling
- ✅ **Multiple Point Types**: Support for points, markers, pins, and crosses
- ✅ **Customizable Colors**: Choose from multiple color options for points
- ✅ **Variable Sizes**: Adjustable point sizes
- ✅ **Point Labels**: Add custom labels to points
- ✅ **Marking Mode Toggle**: Enable/disable point marking
- ✅ **Mouse Preview**: See point preview while hovering
- ✅ **Interactive Points**: Click to add points, click points to delete them
- ✅ **Hover Effects**: Visual feedback when hovering over points
- ✅ **Coordinate Display**: Optional coordinate display on points
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **TypeScript Support**: Fully typed with TypeScript interfaces

## Usage

```tsx
import { ImageAnnotator } from "@/components/ImageAnnotator";

interface Coordinate {
  id: string;
  x: number; // Normalized coordinate (0-1)
  y: number; // Normalized coordinate (0-1)
  color?: string;
  label?: string;
  type?: "point" | "marker" | "pin" | "cross";
  size?: number;
}

function MyComponent() {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [markingMode, setMarkingMode] = useState(true);

  const handleSetCoordinate = (coordinate: Coordinate) => {
    setCoordinates((prev) => [...prev, coordinate]);
  };

  const handleDeleteCoordinate = (id: string) => {
    setCoordinates((prev) => prev.filter((coord) => coord.id !== id));
  };

  return (
    <ImageAnnotator
      imageUrl="/path/to/your/image.jpg"
      coordinates={coordinates}
      setCoordinate={handleSetCoordinate}
      deleteCoordinate={handleDeleteCoordinate}
      markingMode={markingMode}
      defaultPointColor="#ef4444"
      defaultPointType="point"
      defaultPointSize={3}
      showCoordinates={false}
      onPointHover={(coord) => console.log("Hovered:", coord)}
      className="w-full h-96"
    />
  );
}
```

## Props

| Prop                 | Type                                       | Description                             | Default     |
| -------------------- | ------------------------------------------ | --------------------------------------- | ----------- |
| `imageUrl`           | `string`                                   | URL or path to the image to annotate    | -           |
| `coordinates`        | `Coordinate[]`                             | Array of coordinate objects             | -           |
| `setCoordinate`      | `(coordinate: Coordinate) => void`         | Callback when a new coordinate is added | -           |
| `deleteCoordinate`   | `(id: string) => void`                     | Callback when a coordinate is deleted   | -           |
| `className?`         | `string`                                   | Optional CSS classes for the container  | `''`        |
| `markingMode?`       | `boolean`                                  | Enable/disable point marking            | `true`      |
| `defaultPointColor?` | `string`                                   | Default color for new points            | `'#ef4444'` |
| `defaultPointType?`  | `'point' \| 'marker' \| 'pin' \| 'cross'`  | Default type for new points             | `'point'`   |
| `defaultPointSize?`  | `number`                                   | Default size for new points (1-8)       | `3`         |
| `showCoordinates?`   | `boolean`                                  | Show coordinates on point labels        | `false`     |
| `onPointHover?`      | `(coordinate: Coordinate \| null) => void` | Callback when hovering over points      | -           |

## Coordinate Format

Coordinates are normalized to a 0-1 range based on the image dimensions:

```typescript
interface Coordinate {
  id: string; // Unique identifier
  x: number; // X position (0 = left edge, 1 = right edge)
  y: number; // Y position (0 = top edge, 1 = bottom edge)
  color?: string; // Color for the point (hex format)
  label?: string; // Custom label for the point
  type?: "point" | "marker" | "pin" | "cross"; // Visual type
  size?: number; // Size multiplier (1-8)
}
```

## Point Types

- **Point** (`'point'`): Simple circular point
- **Marker** (`'marker'`): Location marker style (like Google Maps)
- **Pin** (`'pin'`): Diamond-shaped pin with center dot
- **Cross** (`'cross'`): Cross/plus symbol

## Controls

- **Click on image**: Add a new coordinate point (when marking mode is enabled)
- **Click on point**: Delete the coordinate point
- **Hover over point**: Show point information and visual feedback
- **Mouse wheel**: Zoom in/out
- **Drag**: Pan around the image
- **Double-click**: Reset zoom

## Color Options

The component supports any hex color value. Common presets include:

- Red: `#ef4444`
- Blue: `#3b82f6`
- Green: `#10b981`
- Orange: `#f59e0b`
- Purple: `#8b5cf6`
- Cyan: `#06b6d4`

## Dependencies

- `react-zoom-pan-pinch`: For zoom and pan functionality
- `tailwindcss`: For styling (optional, can be customized)

## Example Data Export

The enhanced coordinates can be easily exported as JSON:

```json
[
  {
    "id": "coord-1234567890-abc123",
    "x": 0.25,
    "y": 0.75,
    "color": "#ef4444",
    "label": "Point 1",
    "type": "marker",
    "size": 4
  },
  {
    "id": "coord-1234567891-def456",
    "x": 0.8,
    "y": 0.3,
    "color": "#10b981",
    "label": "Point 2",
    "type": "pin",
    "size": 3
  }
]
```

## Advanced Features

### Marking Mode

Toggle between marking and view-only modes:

```tsx
const [markingMode, setMarkingMode] = useState(true);
// When false, prevents new points from being added
```

### Point Hover Callbacks

Get notified when users hover over points:

```tsx
const handlePointHover = (coordinate: Coordinate | null) => {
  if (coordinate) {
    console.log(`Hovering over: ${coordinate.label}`);
  }
};
```

### Dynamic Point Styling

Each point can have its own color, size, and type:

```tsx
const customPoint: Coordinate = {
  id: "custom-1",
  x: 0.5,
  y: 0.5,
  color: "#8b5cf6",
  label: "Important Location",
  type: "marker",
  size: 6,
};
```

This normalized format ensures coordinates remain accurate regardless of how the image is displayed or scaled.
