import mongoose from "mongoose";
import { LeadStatus } from "@/lib/types/lead-status";
import { ProjectType } from "@/lib/types/project-types";
import { CommunicationType, Communication } from "@/lib/types/lead";

// Status Change Schema
const statusChangeSchema = new mongoose.Schema({
  fromStatus: {
    type: String,
    enum: Object.values(LeadStatus),
    required: false,
  },
  toStatus: {
    type: String,
    enum: Object.values(LeadStatus),
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  reason: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

// Communication Schema
const communicationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(CommunicationType),
    required: true,
  },
  direction: {
    type: String,
    enum: ["INBOUND", "OUTBOUND"],
    required: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Not required for inbound communications
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  attachments: [
    {
      type: String,
      trim: true,
    },
  ],
  // Email-specific data
  emailData: {
    to: [String],
    cc: [String],
    bcc: [String],
    replyTo: String,
    messageId: String,
    threadId: String,
  },
  // Call-specific data
  callData: {
    duration: Number, // in minutes
    outcome: String,
    nextAction: String,
    transcript: String,
  },
});

// Note Schema
const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
});

// Note: costBreakdownSchema and projectTimelineSchema removed - using Mixed type for flexibility

// Note: estimationResultSchema removed - using Mixed type for flexibility

// Client Estimate Response Schema
const clientEstimateResponseSchema = new mongoose.Schema({
  decision: {
    type: String,
    enum: ["APPROVED", "REJECTED"],
    required: true,
  },
  responseDate: {
    type: Date,
    default: Date.now,
  },
  feedback: {
    type: String,
    trim: true,
  },
  requestedChanges: {
    type: String,
    trim: true,
  },
});

// Estimate Schema
const estimateSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
  },
  estimationResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EstimationResult",
    required: true,
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "USD",
    trim: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  terms: {
    type: String,
    trim: true,
  },
  presentedAt: Date,
  clientResponse: clientEstimateResponseSchema,
});

// Main Lead Schema
const leadSchema = new mongoose.Schema({
  // Basic Information (Step 1)
  companyName: {
    type: String,
    required: [true, "Company name is required"],
    trim: true,
    maxlength: [200, "Company name cannot exceed 200 characters"],
  },
  contactPerson: {
    type: String,
    required: [true, "Contact person is required"],
    trim: true,
    maxlength: [100, "Contact person name cannot exceed 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, "Address cannot exceed 500 characters"],
  },
  projectType: {
    type: String,
    enum: Object.values(ProjectType),
    required: [true, "Project type is required"],
  },
  initialNotes: {
    type: String,
    trim: true,
    maxlength: [2000, "Initial notes cannot exceed 2000 characters"],
  },

  // Assignment & Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator is required"],
  },
  assignedEstimator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  status: {
    type: String,
    enum: Object.values(LeadStatus),
    default: LeadStatus.ADD_LEAD,
    required: true,
  },
  isDraft: {
    type: Boolean,
    default: false,
  },

  // Form & Communication (Step 2)
  hasQualifierForm: {
    type: Boolean,
    default: true,
  },
  qualifierFormData: {
    type: mongoose.Schema.Types.Mixed, // Flexible structure for form responses
    default: {},
  },

  // Timeline & Activity
  statusHistory: [statusChangeSchema],
  communications: [communicationSchema],
  notes: [noteSchema],

  // Estimation Data
  estimationData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  finalEstimate: estimateSchema,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
leadSchema.index({ createdBy: 1 });
leadSchema.index({ assignedEstimator: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ projectType: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ companyName: "text", contactPerson: "text" }); // Text search
leadSchema.index({ createdAt: -1 }); // Sort by creation date
leadSchema.index({ updatedAt: -1 }); // Sort by update date

// Update the updatedAt field before saving
leadSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for computing lead age
leadSchema.virtual("ageInDays").get(function () {
  return Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
});

// Virtual for latest status change
leadSchema.virtual("latestStatusChange").get(function () {
  if (this.statusHistory && this.statusHistory.length > 0) {
    return this.statusHistory[this.statusHistory.length - 1];
  }
  return null;
});

// Method to add status change
leadSchema.methods.addStatusChange = function (
  toStatus: LeadStatus,
  changedBy: string,
  reason?: string,
  notes?: string
) {
  const statusChange = {
    fromStatus: this.status,
    toStatus,
    changedBy,
    changedAt: new Date(),
    reason,
    notes,
  };

  this.statusHistory.push(statusChange);
  this.status = toStatus;
  this.updatedAt = new Date();
};

// Method to add communication
leadSchema.methods.addCommunication = function (
  communicationData: Partial<Communication>
) {
  this.communications.push(communicationData);
  this.updatedAt = new Date();
};

// Method to add note
leadSchema.methods.addNote = function (
  content: string,
  createdBy: string,
  isPrivate = false,
  tags: string[] = []
) {
  const note = {
    content,
    createdBy,
    createdAt: new Date(),
    isPrivate,
    tags,
  };

  this.notes.push(note);
  this.updatedAt = new Date();
};

// Static method to find leads by status
leadSchema.statics.findByStatus = function (status: LeadStatus) {
  return this.find({ status });
};

// Static method to find leads by project type
leadSchema.statics.findByProjectType = function (projectType: ProjectType) {
  return this.find({ projectType });
};

// Static method to find leads assigned to an estimator
leadSchema.statics.findByEstimator = function (estimatorId: string) {
  return this.find({ assignedEstimator: estimatorId });
};

// Static method for text search
leadSchema.statics.searchLeads = function (searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm },
  });
};

// Delete any existing model to avoid caching issues
if (mongoose.models.Lead) {
  delete mongoose.models.Lead;
}

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
