// Construction Project Types
export enum ProjectType {
  // Residential Construction
  RESIDENTIAL_NEW_BUILD = "RESIDENTIAL_NEW_BUILD",
  RESIDENTIAL_RENOVATION = "RESIDENTIAL_RENOVATION",
  RESIDENTIAL_EXTENSION = "RESIDENTIAL_EXTENSION",
  RESIDENTIAL_KITCHEN_BATHROOM = "RESIDENTIAL_KITCHEN_BATHROOM",

  // Commercial Construction
  COMMERCIAL_NEW_BUILD = "COMMERCIAL_NEW_BUILD",
  COMMERCIAL_RENOVATION = "COMMERCIAL_RENOVATION",
  COMMERCIAL_FITOUT = "COMMERCIAL_FITOUT",
  OFFICE_SPACE = "OFFICE_SPACE",
  RETAIL_SPACE = "RETAIL_SPACE",

  // Industrial Construction
  INDUSTRIAL_WAREHOUSE = "INDUSTRIAL_WAREHOUSE",
  INDUSTRIAL_FACTORY = "INDUSTRIAL_FACTORY",
  INDUSTRIAL_RENOVATION = "INDUSTRIAL_RENOVATION",

  // Infrastructure
  CIVIL_INFRASTRUCTURE = "CIVIL_INFRASTRUCTURE",
  ROAD_CONSTRUCTION = "ROAD_CONSTRUCTION",
  UTILITIES = "UTILITIES",

  // Specialty Construction
  ROOFING = "ROOFING",
  ELECTRICAL_WORK = "ELECTRICAL_WORK",
  PLUMBING = "PLUMBING",
  HVAC = "HVAC",
  LANDSCAPING = "LANDSCAPING",
  DEMOLITION = "DEMOLITION",

  // Other
  OTHER = "OTHER",
}

// Project type display labels
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  // Residential
  [ProjectType.RESIDENTIAL_NEW_BUILD]: "Residential New Build",
  [ProjectType.RESIDENTIAL_RENOVATION]: "Residential Renovation",
  [ProjectType.RESIDENTIAL_EXTENSION]: "Residential Extension",
  [ProjectType.RESIDENTIAL_KITCHEN_BATHROOM]: "Kitchen & Bathroom Renovation",

  // Commercial
  [ProjectType.COMMERCIAL_NEW_BUILD]: "Commercial New Build",
  [ProjectType.COMMERCIAL_RENOVATION]: "Commercial Renovation",
  [ProjectType.COMMERCIAL_FITOUT]: "Commercial Fitout",
  [ProjectType.OFFICE_SPACE]: "Office Space",
  [ProjectType.RETAIL_SPACE]: "Retail Space",

  // Industrial
  [ProjectType.INDUSTRIAL_WAREHOUSE]: "Industrial Warehouse",
  [ProjectType.INDUSTRIAL_FACTORY]: "Industrial Factory",
  [ProjectType.INDUSTRIAL_RENOVATION]: "Industrial Renovation",

  // Infrastructure
  [ProjectType.CIVIL_INFRASTRUCTURE]: "Civil Infrastructure",
  [ProjectType.ROAD_CONSTRUCTION]: "Road Construction",
  [ProjectType.UTILITIES]: "Utilities",

  // Specialty
  [ProjectType.ROOFING]: "Roofing",
  [ProjectType.ELECTRICAL_WORK]: "Electrical Work",
  [ProjectType.PLUMBING]: "Plumbing",
  [ProjectType.HVAC]: "HVAC",
  [ProjectType.LANDSCAPING]: "Landscaping",
  [ProjectType.DEMOLITION]: "Demolition",

  // Other
  [ProjectType.OTHER]: "Other",
};

// Project type categories for UI grouping
export const PROJECT_TYPE_CATEGORIES = {
  RESIDENTIAL: [
    ProjectType.RESIDENTIAL_NEW_BUILD,
    ProjectType.RESIDENTIAL_RENOVATION,
    ProjectType.RESIDENTIAL_EXTENSION,
    ProjectType.RESIDENTIAL_KITCHEN_BATHROOM,
  ],
  COMMERCIAL: [
    ProjectType.COMMERCIAL_NEW_BUILD,
    ProjectType.COMMERCIAL_RENOVATION,
    ProjectType.COMMERCIAL_FITOUT,
    ProjectType.OFFICE_SPACE,
    ProjectType.RETAIL_SPACE,
  ],
  INDUSTRIAL: [
    ProjectType.INDUSTRIAL_WAREHOUSE,
    ProjectType.INDUSTRIAL_FACTORY,
    ProjectType.INDUSTRIAL_RENOVATION,
  ],
  INFRASTRUCTURE: [
    ProjectType.CIVIL_INFRASTRUCTURE,
    ProjectType.ROAD_CONSTRUCTION,
    ProjectType.UTILITIES,
  ],
  SPECIALTY: [
    ProjectType.ROOFING,
    ProjectType.ELECTRICAL_WORK,
    ProjectType.PLUMBING,
    ProjectType.HVAC,
    ProjectType.LANDSCAPING,
    ProjectType.DEMOLITION,
  ],
  OTHER: [ProjectType.OTHER],
};

// Helper function to get category for a project type
export function getProjectTypeCategory(projectType: ProjectType): string {
  for (const [category, types] of Object.entries(PROJECT_TYPE_CATEGORIES)) {
    if (types.includes(projectType)) {
      return category;
    }
  }
  return "OTHER";
}
