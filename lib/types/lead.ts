import { LeadStatus } from "./lead-status";
import { ProjectType } from "./project-types";

// ===== FORM DATA INTERFACES =====

// Step 1: Lead Information Form Data
export interface LeadFormStepOne {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  projectType: ProjectType;
  initialNotes?: string;
}

// Step 2: Form Assignment Data
export interface LeadFormStepTwo {
  useDefaultForm: boolean;
  emailTemplate?: string;
}

// Step 3: Review & Send Data
export interface LeadFormStepThree {
  saveAsDraft: boolean;
  sendImmediately: boolean;
  scheduleDateTime?: Date;
  emailSubject?: string;
  emailMessage?: string;
}

// Complete Create Lead Form Data
export interface CreateLeadFormData extends LeadFormStepOne {
  useDefaultForm?: boolean;
  saveAsDraft?: boolean;
  sendImmediately?: boolean;
  scheduleDateTime?: Date;
  emailSubject?: string;
  emailMessage?: string;
  assignedEstimatorId?: string;
}

// ===== CORE INTERFACES =====

// Qualifier Form Response Data
export interface QualifierFormData {
  [fieldId: string]: string | string[] | boolean | number | File | null;
}

// Lead Document Structure
export interface Lead {
  _id?: string;

  // Basic Information (Step 1)
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  projectType: ProjectType;
  initialNotes?: string;

  // Assignment & Management
  createdBy: string; // User ID of BD who created
  assignedEstimator?: string; // User ID of assigned estimator
  status: LeadStatus;
  isDraft: boolean;

  // Form & Communication (Step 2)
  hasQualifierForm: boolean;
  qualifierFormData?: QualifierFormData; // Client's responses to qualifier form

  // Timeline & Activity
  createdAt: Date;
  updatedAt: Date;
  statusHistory: StatusChange[];
  communications: Communication[];
  notes: Note[];

  // Estimation Data
  estimationData?: EstimationResult;
  finalEstimate?: Estimate;
}

// Status Change History
export interface StatusChange {
  _id?: string;
  fromStatus?: LeadStatus;
  toStatus: LeadStatus;
  changedBy: string; // User ID
  changedAt: Date;
  reason?: string;
  notes?: string;
}

// Communication Record
export interface Communication {
  _id?: string;
  type: CommunicationType;
  direction: "INBOUND" | "OUTBOUND";
  subject?: string;
  content: string;
  sentBy?: string; // User ID for outbound
  sentAt: Date;
  attachments?: string[];
  emailData?: EmailData;
  callData?: CallData;
}

export enum CommunicationType {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  SMS = "SMS",
  MEETING = "MEETING",
  NOTE = "NOTE",
}

// Email-specific data
export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  messageId?: string;
  threadId?: string;
}

// Call-specific data
export interface CallData {
  duration?: number; // in minutes
  outcome?: string;
  nextAction?: string;
  transcript?: string;
}

// Internal Notes
export interface Note {
  _id?: string;
  content: string;
  createdBy: string; // User ID
  createdAt: Date;
  isPrivate: boolean; // Only visible to BD team
  tags?: string[];
}

// ===== DEFAULT QUALIFIER FORM =====

export interface DefaultQualifierForm {
  name: string;
  description: string;
  questions: QualifierQuestion[];
}

export interface QualifierQuestion {
  id: string;
  label: string;
  type: "text" | "select" | "textarea" | "radio";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

// ===== ESTIMATION INTERFACES =====

export interface EstimationResult {
  _id?: string;
  leadId: string;
  estimatorId: string;
  costBreakdown: CostBreakdown;
  timeline: ProjectTimeline;
  confidence: ConfidenceLevel;
  notes: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  status: EstimationStatus;
}

export enum EstimationStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW_REQUIRED = "REVIEW_REQUIRED",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface CostBreakdown {
  materials: number;
  labor: number;
  equipment: number;
  overhead: number;
  profit: number;
  total: number;
  breakdown?: CostItem[];
}

export interface CostItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ProjectTimeline {
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  totalDuration: number; // in days
  phases?: ProjectPhase[];
}

export interface ProjectPhase {
  name: string;
  duration: number; // in days
  dependencies?: string[]; // Phase names
  description?: string;
}

export enum ConfidenceLevel {
  LOW = "LOW", // 60-70%
  MEDIUM = "MEDIUM", // 70-85%
  HIGH = "HIGH", // 85-95%
  VERY_HIGH = "VERY_HIGH", // 95%+
}

export interface Estimate {
  _id?: string;
  leadId: string;
  estimationResultId: string;
  finalAmount: number;
  currency: string;
  validUntil: Date;
  terms?: string;
  presentedAt?: Date;
  clientResponse?: ClientEstimateResponse;
}

export interface ClientEstimateResponse {
  decision: "APPROVED" | "REJECTED";
  responseDate: Date;
  feedback?: string;
  requestedChanges?: string;
}

// ===== API RESPONSE INTERFACES =====

export interface LeadResponse {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  projectType: ProjectType;
  initialNotes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedEstimator?: {
    _id: string;
    name: string;
    email: string;
  };
  status: LeadStatus;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: StatusChange[];
  communications?: Communication[];
  notes?: Note[];
}

export interface LeadApiResponse {
  success: boolean;
  message?: string;
  lead?: LeadResponse;
  leads?: LeadResponse[];
  error?: string;
  details?: string[];
  emailSent?: boolean;
  emailError?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== FILTER & SEARCH INTERFACES =====

export interface LeadFilters {
  status?: LeadStatus[];
  projectType?: ProjectType[];
  createdBy?: string[];
  assignedEstimator?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string; // Search in company name, contact person, email
  isDraft?: boolean;
}

export interface LeadSortOptions {
  field: "createdAt" | "updatedAt" | "companyName" | "status";
  direction: "asc" | "desc";
}

// ===== DASHBOARD INTERFACES =====

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byProjectType: Record<ProjectType, number>;
  conversionRate: number;
  averageTimeToClose: number; // in days
  totalValue: number;
  monthlyGrowth: number; // percentage
}

// ===== DEFAULT QUALIFIER FORM =====

export const DEFAULT_QUALIFIER_FORM: DefaultQualifierForm = {
  name: "Standard Construction Qualifier",
  description: "Standard qualification form for construction projects",
  questions: [
    {
      id: "project-description",
      label: "Project Description",
      type: "textarea",
      required: true,
      placeholder: "Please describe your construction project in detail",
    },
    {
      id: "project-budget",
      label: "Project Budget Range",
      type: "select",
      required: true,
      options: [
        "Under $50,000",
        "$50,000 - $100,000",
        "$100,000 - $250,000",
        "$250,000 - $500,000",
        "$500,000 - $1,000,000",
        "Over $1,000,000",
      ],
    },
    {
      id: "funding-secured",
      label: "Is project funding secured?",
      type: "radio",
      required: true,
      options: [
        "Yes, funding is secured",
        "Pre-approved by bank/lender",
        "Application in progress",
        "Not yet secured",
      ],
    },
    {
      id: "council-approval",
      label: "Council license/permit approval status",
      type: "radio",
      required: true,
      options: [
        "Approved",
        "Application submitted",
        "Planning to apply",
        "Not required",
      ],
    },
    {
      id: "plans-available",
      label: "Are architectural plans available?",
      type: "radio",
      required: true,
      options: [
        "Yes, plans are ready",
        "Draft plans available",
        "Plans being developed",
        "No plans yet",
      ],
    },
    {
      id: "timeline",
      label: "Preferred Project Timeline",
      type: "select",
      required: true,
      options: [
        "As soon as possible",
        "1-3 months",
        "3-6 months",
        "6-12 months",
        "Over 12 months",
        "Flexible",
      ],
    },
    {
      id: "additional-info",
      label: "Additional Information",
      type: "textarea",
      required: false,
      placeholder: "Any additional details, special requirements, or questions",
    },
  ],
};
