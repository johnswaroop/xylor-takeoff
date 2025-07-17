// Lead Status Enum - Complete workflow stages
export enum LeadStatus {
  // Phase 1: Lead Initiation
  ADD_LEAD = "ADD_LEAD",
  ATTACH_QUALIFIERS = "ATTACH_QUALIFIERS",

  // Phase 2: Client Qualification
  SEND_QUALIFIERS = "SEND_QUALIFIERS",
  AWAITING_QUALIFIER_RESPONSE = "AWAITING_QUALIFIER_RESPONSE",
  RESPONSE_RECEIVED = "RESPONSE_RECEIVED",

  // Phase 3: Qualification Review
  REVIEW_QUALIFIER_RESPONSE = "REVIEW_QUALIFIER_RESPONSE",

  // Phase 4: Estimation Process
  SENT_FOR_ESTIMATES = "SENT_FOR_ESTIMATES",
  ESTIMATION_IN_PROGRESS = "ESTIMATION_IN_PROGRESS",
  ESTIMATES_READY = "ESTIMATES_READY",

  // Phase 5: Client Estimate Review
  SHARED_WITH_CLIENT = "SHARED_WITH_CLIENT",
  AWAITING_ESTIMATE_DECISION = "AWAITING_ESTIMATE_DECISION",

  // Phase 6: Final Decision
  ESTIMATE_APPROVED = "ESTIMATE_APPROVED",
  ESTIMATE_REJECTED = "ESTIMATE_REJECTED",
  COMPLETED = "COMPLETED",
}

// Status transitions mapping
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.ADD_LEAD]: [LeadStatus.ATTACH_QUALIFIERS],
  [LeadStatus.ATTACH_QUALIFIERS]: [LeadStatus.SEND_QUALIFIERS],
  [LeadStatus.SEND_QUALIFIERS]: [LeadStatus.AWAITING_QUALIFIER_RESPONSE],
  [LeadStatus.AWAITING_QUALIFIER_RESPONSE]: [LeadStatus.RESPONSE_RECEIVED],
  [LeadStatus.RESPONSE_RECEIVED]: [LeadStatus.REVIEW_QUALIFIER_RESPONSE],
  [LeadStatus.REVIEW_QUALIFIER_RESPONSE]: [
    LeadStatus.SENT_FOR_ESTIMATES,
    LeadStatus.SEND_QUALIFIERS, // Can go back to request more info
    LeadStatus.COMPLETED, // Can be rejected/closed
  ],
  [LeadStatus.SENT_FOR_ESTIMATES]: [LeadStatus.ESTIMATION_IN_PROGRESS],
  [LeadStatus.ESTIMATION_IN_PROGRESS]: [
    LeadStatus.ESTIMATES_READY,
    LeadStatus.ESTIMATION_IN_PROGRESS, // Can stay in progress
  ],
  [LeadStatus.ESTIMATES_READY]: [
    LeadStatus.SHARED_WITH_CLIENT,
    LeadStatus.ESTIMATION_IN_PROGRESS, // BD can send back for revision
  ],
  [LeadStatus.SHARED_WITH_CLIENT]: [LeadStatus.AWAITING_ESTIMATE_DECISION],
  [LeadStatus.AWAITING_ESTIMATE_DECISION]: [
    LeadStatus.ESTIMATE_APPROVED,
    LeadStatus.ESTIMATE_REJECTED,
  ],
  [LeadStatus.ESTIMATE_APPROVED]: [LeadStatus.COMPLETED],
  [LeadStatus.ESTIMATE_REJECTED]: [LeadStatus.COMPLETED],
  [LeadStatus.COMPLETED]: [], // Terminal state
};

// Helper function to check if status transition is valid
export function isValidStatusTransition(
  from: LeadStatus,
  to: LeadStatus
): boolean {
  return LEAD_STATUS_TRANSITIONS[from]?.includes(to) || false;
}

// Status display labels
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.ADD_LEAD]: "New Lead",
  [LeadStatus.ATTACH_QUALIFIERS]: "Preparing Qualifiers",
  [LeadStatus.SEND_QUALIFIERS]: "Qualifiers Sent",
  [LeadStatus.AWAITING_QUALIFIER_RESPONSE]: "Awaiting Response",
  [LeadStatus.RESPONSE_RECEIVED]: "Response Received",
  [LeadStatus.REVIEW_QUALIFIER_RESPONSE]: "Reviewing Response",
  [LeadStatus.SENT_FOR_ESTIMATES]: "Sent for Estimation",
  [LeadStatus.ESTIMATION_IN_PROGRESS]: "Estimation in Progress",
  [LeadStatus.ESTIMATES_READY]: "Estimates Ready",
  [LeadStatus.SHARED_WITH_CLIENT]: "Shared with Client",
  [LeadStatus.AWAITING_ESTIMATE_DECISION]: "Awaiting Decision",
  [LeadStatus.ESTIMATE_APPROVED]: "Estimate Approved",
  [LeadStatus.ESTIMATE_REJECTED]: "Estimate Rejected",
  [LeadStatus.COMPLETED]: "Completed",
};
