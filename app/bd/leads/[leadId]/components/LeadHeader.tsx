"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  CheckCircle,
} from "lucide-react";
import { Lead } from "@/lib/types/lead";
import {
  LeadStatus,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TRANSITIONS,
} from "@/lib/types/lead-status";
import { PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeadDetails } from "@/lib/hooks/useLeadDetails";

interface LeadHeaderProps {
  lead: Lead;
  onStatusChange: () => void;
  onEdit: () => void;
}

// Status badge color mapping
const getStatusBadgeVariant = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.ADD_LEAD:
    case LeadStatus.ATTACH_QUALIFIERS:
      return "secondary";
    case LeadStatus.AWAITING_QUALIFIER_RESPONSE:
    case LeadStatus.AWAITING_ESTIMATE_DECISION:
      return "outline";
    case LeadStatus.ESTIMATION_IN_PROGRESS:
    case LeadStatus.REVIEW_QUALIFIER_RESPONSE:
      return "default";
    case LeadStatus.ESTIMATE_APPROVED:
    case LeadStatus.COMPLETED:
      return "default";
    case LeadStatus.ESTIMATE_REJECTED:
      return "destructive";
    default:
      return "secondary";
  }
};

export function LeadHeader({ lead, onStatusChange, onEdit }: LeadHeaderProps) {
  const { user } = useAuth();
  const { updateStatus } = useLeadDetails(lead._id!, user?._id);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Get allowed status transitions
  const allowedStatuses =
    LEAD_STATUS_TRANSITIONS[lead.status as LeadStatus] || [];

  const handleStatusChangeClick = (newStatus: LeadStatus) => {
    setSelectedStatus(newStatus);
    setReason("");
    setNotes("");
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      const success = await updateStatus(selectedStatus, reason, notes);
      if (success) {
        setStatusDialogOpen(false);
        onStatusChange();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card className="border-0 shadow-sm bg-white">
        {/* Prominent Status Banner */}
        <div
          className={`px-6 py-4 border-l-4 ${
            lead.status === LeadStatus.ADD_LEAD
              ? "bg-blue-50 border-blue-500"
              : lead.status === LeadStatus.ATTACH_QUALIFIERS
              ? "bg-indigo-50 border-indigo-500"
              : lead.status === LeadStatus.SEND_QUALIFIERS
              ? "bg-yellow-50 border-yellow-500"
              : lead.status === LeadStatus.AWAITING_QUALIFIER_RESPONSE
              ? "bg-amber-50 border-amber-500"
              : lead.status === LeadStatus.RESPONSE_RECEIVED
              ? "bg-cyan-50 border-cyan-500"
              : lead.status === LeadStatus.REVIEW_QUALIFIER_RESPONSE
              ? "bg-sky-50 border-sky-500"
              : lead.status === LeadStatus.SENT_FOR_ESTIMATES
              ? "bg-violet-50 border-violet-500"
              : lead.status === LeadStatus.ESTIMATION_IN_PROGRESS
              ? "bg-purple-50 border-purple-500"
              : lead.status === LeadStatus.ESTIMATES_READY
              ? "bg-green-50 border-green-500"
              : lead.status === LeadStatus.SHARED_WITH_CLIENT
              ? "bg-teal-50 border-teal-500"
              : lead.status === LeadStatus.AWAITING_ESTIMATE_DECISION
              ? "bg-orange-50 border-orange-500"
              : lead.status === LeadStatus.ESTIMATE_APPROVED
              ? "bg-emerald-50 border-emerald-500"
              : lead.status === LeadStatus.ESTIMATE_REJECTED
              ? "bg-red-50 border-red-500"
              : lead.status === LeadStatus.COMPLETED
              ? "bg-slate-50 border-slate-500"
              : "bg-gray-50 border-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  lead.status === LeadStatus.ADD_LEAD
                    ? "bg-blue-100 text-blue-700"
                    : lead.status === LeadStatus.ATTACH_QUALIFIERS
                    ? "bg-indigo-100 text-indigo-700"
                    : lead.status === LeadStatus.SEND_QUALIFIERS
                    ? "bg-yellow-100 text-yellow-700"
                    : lead.status === LeadStatus.AWAITING_QUALIFIER_RESPONSE
                    ? "bg-amber-100 text-amber-700"
                    : lead.status === LeadStatus.RESPONSE_RECEIVED
                    ? "bg-cyan-100 text-cyan-700"
                    : lead.status === LeadStatus.REVIEW_QUALIFIER_RESPONSE
                    ? "bg-sky-100 text-sky-700"
                    : lead.status === LeadStatus.SENT_FOR_ESTIMATES
                    ? "bg-violet-100 text-violet-700"
                    : lead.status === LeadStatus.ESTIMATION_IN_PROGRESS
                    ? "bg-purple-100 text-purple-700"
                    : lead.status === LeadStatus.ESTIMATES_READY
                    ? "bg-green-100 text-green-700"
                    : lead.status === LeadStatus.SHARED_WITH_CLIENT
                    ? "bg-teal-100 text-teal-700"
                    : lead.status === LeadStatus.AWAITING_ESTIMATE_DECISION
                    ? "bg-orange-100 text-orange-700"
                    : lead.status === LeadStatus.ESTIMATE_APPROVED
                    ? "bg-emerald-100 text-emerald-700"
                    : lead.status === LeadStatus.ESTIMATE_REJECTED
                    ? "bg-red-100 text-red-700"
                    : lead.status === LeadStatus.COMPLETED
                    ? "bg-slate-100 text-slate-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Current Status
                </div>
                <div
                  className={`text-lg font-bold ${
                    lead.status === LeadStatus.ADD_LEAD
                      ? "text-blue-700"
                      : lead.status === LeadStatus.ATTACH_QUALIFIERS
                      ? "text-indigo-700"
                      : lead.status === LeadStatus.SEND_QUALIFIERS
                      ? "text-yellow-700"
                      : lead.status === LeadStatus.AWAITING_QUALIFIER_RESPONSE
                      ? "text-amber-700"
                      : lead.status === LeadStatus.RESPONSE_RECEIVED
                      ? "text-cyan-700"
                      : lead.status === LeadStatus.REVIEW_QUALIFIER_RESPONSE
                      ? "text-sky-700"
                      : lead.status === LeadStatus.SENT_FOR_ESTIMATES
                      ? "text-violet-700"
                      : lead.status === LeadStatus.ESTIMATION_IN_PROGRESS
                      ? "text-purple-700"
                      : lead.status === LeadStatus.ESTIMATES_READY
                      ? "text-green-700"
                      : lead.status === LeadStatus.SHARED_WITH_CLIENT
                      ? "text-teal-700"
                      : lead.status === LeadStatus.AWAITING_ESTIMATE_DECISION
                      ? "text-orange-700"
                      : lead.status === LeadStatus.ESTIMATE_APPROVED
                      ? "text-emerald-700"
                      : lead.status === LeadStatus.ESTIMATE_REJECTED
                      ? "text-red-700"
                      : lead.status === LeadStatus.COMPLETED
                      ? "text-slate-700"
                      : "text-gray-700"
                  }`}
                >
                  {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Change Status
            </Button>
          </div>
        </div>

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {lead.companyName}
                    </h1>
                    <Badge
                      variant={getStatusBadgeVariant(lead.status as LeadStatus)}
                      className="text-sm px-3 py-1"
                    >
                      {LEAD_STATUS_LABELS[lead.status as LeadStatus] ||
                        lead.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{lead.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{lead.email}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info Row */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Project Type:</span>
                  <Badge variant="outline">
                    {PROJECT_TYPE_LABELS[lead.projectType] || lead.projectType}
                  </Badge>
                </div>
                {lead.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{lead.address}</span>
                  </div>
                )}
                {lead.assignedEstimator && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Estimator:</span>
                    <span>
                      {typeof lead.assignedEstimator === "object" &&
                      lead.assignedEstimator
                        ? (lead.assignedEstimator as { name: string }).name
                        : "Assigned"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button>

              {/* Status Change Dropdown */}
              {allowedStatuses.length > 0 && (
                <Select
                  onValueChange={(value) =>
                    handleStatusChangeClick(value as LeadStatus)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {LEAD_STATUS_LABELS[status] || status}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Lead Status</DialogTitle>
            <DialogDescription>
              Update the lead status from{" "}
              <Badge variant="outline" className="mx-1">
                {LEAD_STATUS_LABELS[lead.status as LeadStatus]}
              </Badge>
              to{" "}
              <Badge variant="outline" className="mx-1">
                {selectedStatus ? LEAD_STATUS_LABELS[selectedStatus] : ""}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change (optional)</Label>
              <Input
                id="reason"
                placeholder="Brief reason for status change"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context or notes about this status change"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || !selectedStatus}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
