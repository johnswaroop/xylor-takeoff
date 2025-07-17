import { LeadStatus } from "./lead-status";
import { ProjectType } from "./project-types";

// Dashboard Stats Interfaces
export interface DashboardStats {
  activeLeads: number;
  conversionRate: number; // percentage
  revenuePipeline: number; // total estimated value
  monthlyTargets: number; // target number for current month
}

export interface LeadsByStatus {
  [key: string]: number; // LeadStatus as key, count as value
}

export interface LeadsByProjectType {
  [key: string]: number; // ProjectType as key, count as value
}

// Recent Activity Feed Interfaces
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // API returns date strings
  leadId?: string;
  leadCompanyName?: string;
  userId?: string;
  userName?: string;
}

export enum ActivityType {
  STATUS_CHANGE = "STATUS_CHANGE",
  COMMUNICATION_SENT = "COMMUNICATION_SENT",
  COMMUNICATION_RECEIVED = "COMMUNICATION_RECEIVED",
  FORM_SUBMITTED = "FORM_SUBMITTED",
  LEAD_CREATED = "LEAD_CREATED",
  ESTIMATOR_ASSIGNED = "ESTIMATOR_ASSIGNED",
  NOTE_ADDED = "NOTE_ADDED",
}

// Dashboard Leads Overview Table
export interface DashboardLead {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  status: LeadStatus;
  statusLabel: string;
  projectType: ProjectType;
  projectTypeLabel: string;
  lastContactDate: string | null; // API returns date strings
  assignedEstimator: {
    _id: string;
    name: string;
  } | null;
  createdAt: string; // API returns date strings
  updatedAt: string; // API returns date strings
  ageInDays: number;
}

// Quick Actions Interface
export interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: string;
  variant: "primary" | "secondary" | "outline";
}

// API Response Interfaces
export interface DashboardStatsResponse {
  success: boolean;
  stats?: DashboardStats;
  leadsByStatus?: LeadsByStatus;
  leadsByProjectType?: LeadsByProjectType;
  error?: string;
}

export interface DashboardActivityResponse {
  success: boolean;
  activities?: ActivityItem[];
  error?: string;
}

export interface DashboardLeadsResponse {
  success: boolean;
  leads?: DashboardLead[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Dashboard State Interface
export interface DashboardData {
  stats: DashboardStats | null;
  leadsByStatus: LeadsByStatus | null;
  leadsByProjectType: LeadsByProjectType | null;
  recentActivity: ActivityItem[];
  leadsOverview: DashboardLead[];
  isLoading: boolean;
  error: string | null;
}

// ===== ESTIMATOR DASHBOARD INTERFACES =====

// Estimator Dashboard Stats
export interface EstimatorDashboardStats {
  totalAssigned: number;
  pendingEstimation: number;
  inProgress: number;
  completed: number;
}

// Estimator Lead Interface (simplified for estimator view)
export interface EstimatorLead {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  projectType: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  ageInDays: number;
}

// Estimator Dashboard API Response
export interface EstimatorDashboardResponse {
  success: boolean;
  stats?: EstimatorDashboardStats;
  leads?: EstimatorLead[];
  error?: string;
}

// Estimator Dashboard State
export interface EstimatorDashboardData {
  stats: EstimatorDashboardStats | null;
  leads: EstimatorLead[];
  isLoading: boolean;
  error: string | null;
}
