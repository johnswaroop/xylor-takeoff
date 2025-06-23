# Building Takeoff Configurator - Requirements Document

## Overview

The configurator is a sidebar-based interface that allows users to select and configure various building elements for takeoff measurements. Each element has specific metrics that need to be captured based on the building component type.

## User Interface Requirements

### Sidebar Configuration

- **Location**: Sidebar panel (expandable/collapsible)
- **Interaction Model**: Click to expand individual sections
- **Save Functionality**: Save button for each configured element
- **Navigation**: Clear visual hierarchy for easy element selection

## Building Elements Configuration

### 1. External Wall

- **Metrics Required**:
  - Length
  - Area
- **Input Type**: Length measurement + automatic area calculation
- **Measurement Unit**: Meters

### 2. Upper Gable

- **Metrics Required**: Length in meters
- **Input Type**: Line/polygon measurement
- **Measurement Unit**: Meters

### 3. Internal Bearing Wall

- **Metrics Required**: Length in meters
- **Input Type**: Line/polygon measurement
- **Measurement Unit**: Meters

### 4. Internal Party Wall

- **Metrics Required**: Length in meters
- **Input Type**: Line/polygon measurement
- **Measurement Unit**: Meters

### 5. Floor Cassette

- **Metrics Required**: Area
- **Input Type**: Polygon measurement
- **Measurement Unit**: Square meters

### 6. Roof Cassette

- **Metrics Required**: Area
- **Input Type**: Polygon measurement
- **Measurement Unit**: Square meters

### 7. Ceiling Cassette

- **Metrics Required**: Area
- **Input Type**: Polygon measurement
- **Measurement Unit**: Square meters

### 8. Staircases

- **Metrics Required**: Count
- **Input Type**: Numerical counter
- **Measurement Unit**: Number of units

### 9. Windows & External Doors

- **Metrics Required**: Count
- **Input Type**: Numerical counter
- **Measurement Unit**: Number of units

### 10. Internal Doors

- **Metrics Required**: Count
- **Input Type**: Numerical counter
- **Measurement Unit**: Number of units

### 11. Custom Element

- **Metrics Required**: User-defined metric
- **Input Options**:
  - 2m (fixed measurement)
  - Length in meters (variable measurement)
  - Count (numerical)
- **Input Type**: Configurable based on user selection
- **Measurement Unit**: Varies (meters, count, or fixed)

## Functional Requirements

### Sidebar Behavior

1. **Collapsed State**: Show element names only
2. **Expanded State**: Display relevant input fields and measurement options
3. **Single Expansion**: Only one element expanded at a time (accordion-style) OR multiple expansions allowed
4. **Persistent State**: Remember user's expansion preferences during session

### Input Validation

- **Length Measurements**: Positive numbers only, decimal precision up to 2 places
- **Area Calculations**: Automatic validation for polygon completeness
- **Count Fields**: Positive integers only
- **Custom Elements**: Dynamic validation based on selected metric type

### Save Functionality

- **Individual Save**: Each element can be saved independently
- **Visual Feedback**: Clear indication of saved vs. unsaved states
- **Data Persistence**: Save configuration for future sessions
