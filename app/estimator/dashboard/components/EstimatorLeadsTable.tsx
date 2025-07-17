"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EstimatorLead } from "@/lib/types/dashboard";
import { LeadStatus, LEAD_STATUS_LABELS } from "@/lib/types/lead-status";
import { PROJECT_TYPE_LABELS, ProjectType } from "@/lib/types/project-types";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Search,
  Filter,
  Building2,
  Calendar,
  User,
  Mail,
  Clock,
  Edit,
  FileText,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface EstimatorLeadsTableProps {
  leads: EstimatorLead[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Status badge color mapping for estimator-relevant statuses
const getStatusBadgeVariant = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.SENT_FOR_ESTIMATES:
      return "secondary";
    case LeadStatus.ESTIMATION_IN_PROGRESS:
      return "default";
    case LeadStatus.ESTIMATES_READY:
      return "default";
    default:
      return "outline";
  }
};

// Status update dialog component
function StatusUpdateDialog({
  lead,
  onStatusUpdate,
}: {
  lead: EstimatorLead;
  onStatusUpdate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Available status transitions for estimators
  const availableStatuses = [
    LeadStatus.SENT_FOR_ESTIMATES,
    LeadStatus.ESTIMATION_IN_PROGRESS,
    LeadStatus.ESTIMATES_READY,
  ];

  const handleSubmit = async () => {
    if (!user || newStatus === lead.status) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${lead._id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user._id,
        },
        body: JSON.stringify({
          toStatus: newStatus,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status updated successfully");
      setIsOpen(false);
      setNotes("");
      onStatusUpdate();
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Status update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Update Status">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Estimation Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">New Status</Label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as LeadStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || newStatus === lead.status}
            >
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add note dialog component
function AddNoteDialog({
  lead,
  onNoteAdded,
}: {
  lead: EstimatorLead;
  onNoteAdded: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user || !note.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${lead._id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user._id,
        },
        body: JSON.stringify({
          content: note.trim(),
          isPrivate: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      toast.success("Note added successfully");
      setIsOpen(false);
      setNote("");
      onNoteAdded();
    } catch (error) {
      toast.error("Failed to add note");
      console.error("Add note error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Add Note">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your note about this project..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !note.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EstimatorLeadsTable({
  leads,
  isLoading,
  onRefresh,
}: EstimatorLeadsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [projectTypeFilter, setProjectTypeFilter] = useState<
    ProjectType | "ALL"
  >("ALL");

  // Navigate to planning tool
  const handleCreatePlan = (leadId: string) => {
    router.push(`/estimator/${leadId}`);
  };

  // Filter leads based on search and filters (client-side as requested)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || lead.status === statusFilter;
      const matchesProjectType =
        projectTypeFilter === "ALL" || lead.projectType === projectTypeFilter;

      return matchesSearch && matchesStatus && matchesProjectType;
    });
  }, [leads, searchTerm, statusFilter, projectTypeFilter]);

  // Format date
  const formatDate = (date: string) => {
    try {
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(dateObj);
    } catch {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex space-x-4 p-4 border rounded"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-20 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Projects</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, contact person, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as LeadStatus | "ALL")
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value={LeadStatus.SENT_FOR_ESTIMATES}>
                {LEAD_STATUS_LABELS[LeadStatus.SENT_FOR_ESTIMATES]}
              </SelectItem>
              <SelectItem value={LeadStatus.ESTIMATION_IN_PROGRESS}>
                {LEAD_STATUS_LABELS[LeadStatus.ESTIMATION_IN_PROGRESS]}
              </SelectItem>
              <SelectItem value={LeadStatus.ESTIMATES_READY}>
                {LEAD_STATUS_LABELS[LeadStatus.ESTIMATES_READY]}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={projectTypeFilter}
            onValueChange={(value) =>
              setProjectTypeFilter(value as ProjectType | "ALL")
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <Building2 className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Project Types</SelectItem>
              {Object.entries(PROJECT_TYPE_LABELS).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">
              {leads.length === 0
                ? "No assigned projects yet"
                : "No projects match your filters"}
            </p>
            <p className="text-sm text-gray-400">
              {leads.length === 0
                ? "Projects will appear here when they are assigned to you"
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Company & Contact
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Project Type
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Timeline
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium">{lead.companyName}</div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="mr-1 h-3 w-3" />
                            {lead.contactPerson}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-1 h-3 w-3" />
                            {lead.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm">
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {PROJECT_TYPE_LABELS[
                            lead.projectType as ProjectType
                          ] || lead.projectType}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          {LEAD_STATUS_LABELS[lead.status]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            {formatDate(lead.createdAt)}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {lead.ageInDays} days ago
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreatePlan(lead._id)}
                            className="flex items-center gap-2"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Create Takeoff
                          </Button>
                          <StatusUpdateDialog
                            lead={lead}
                            onStatusUpdate={onRefresh || (() => {})}
                          />
                          <AddNoteDialog
                            lead={lead}
                            onNoteAdded={onRefresh || (() => {})}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filteredLeads.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredLeads.length} of {leads.length} projects
          </div>
        )}
      </CardContent>
    </Card>
  );
}
