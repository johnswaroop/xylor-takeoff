"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeadDetails } from "@/lib/hooks/useLeadDetails";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ArrowLeft, Mail, Plus, Eye } from "lucide-react";
import { LEAD_STATUS_LABELS } from "@/lib/types/lead-status";
import { PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
import { LeadHeader } from "./components/LeadHeader";
import { LeadDetailsPanel } from "./components/LeadDetailsPanel";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { EditLeadDialog } from "./components/EditLeadDialog";
import { SendEmailDialog } from "./components/SendEmailDialog";
import { AddNoteDialog } from "./components/AddNoteDialog";
import { QualifierResponseViewer } from "./components/QualifierResponseViewer";
import { AssignEstimatorDialog } from "./components/AssignEstimatorDialog";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const leadId = params.leadId as string;

  const { lead, loading, error, refetch } = useLeadDetails(leadId, user?._id);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [qualifierViewerOpen, setQualifierViewerOpen] = useState(false);
  const [assignEstimatorOpen, setAssignEstimatorOpen] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <p className="text-red-600">Please log in to access lead details.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/bd/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lead) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/bd/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-red-600 text-lg font-semibold">
                  {error || "Lead not found"}
                </div>
                <p className="text-muted-foreground">
                  The lead you're looking for doesn't exist or you don't have
                  permission to view it.
                </p>
                <Button onClick={() => router.push("/bd/dashboard")}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <NavigationHeader />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/bd/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="text-sm text-muted-foreground">
            Dashboard → Leads → {lead.companyName}
          </div>
        </div>

        {/* Lead Header */}
        <LeadHeader
          lead={lead}
          onStatusChange={refetch}
          onEdit={() => setEditDialogOpen(true)}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Lead Details */}
          <div className="lg:col-span-1 space-y-6">
            <LeadDetailsPanel
              lead={lead}
              onEdit={() => setEditDialogOpen(true)}
              onViewQualifier={() => setQualifierViewerOpen(true)}
              onAssignEstimator={() => setAssignEstimatorOpen(true)}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setEmailDialogOpen(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  onClick={() => setNoteDialogOpen(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
                {lead.qualifierFormData &&
                  Object.keys(lead.qualifierFormData).length > 0 && (
                    <Button
                      onClick={() => setQualifierViewerOpen(true)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4" />
                      View Response
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="lg:col-span-2">
            <ActivityTimeline lead={lead} onRefresh={refetch} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditLeadDialog
        lead={lead}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={() => {
          setEditDialogOpen(false);
          refetch();
        }}
      />

      <SendEmailDialog
        lead={lead}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSent={() => {
          setEmailDialogOpen(false);
          refetch();
        }}
      />

      <AddNoteDialog
        lead={lead}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        onAdded={() => {
          setNoteDialogOpen(false);
          refetch();
        }}
      />

      <QualifierResponseViewer
        lead={lead}
        open={qualifierViewerOpen}
        onOpenChange={setQualifierViewerOpen}
      />

      <AssignEstimatorDialog
        lead={lead}
        open={assignEstimatorOpen}
        onOpenChange={setAssignEstimatorOpen}
        onAssigned={() => {
          setAssignEstimatorOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
