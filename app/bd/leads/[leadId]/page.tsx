"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeadDetails } from "@/lib/hooks/useLeadDetails";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArrowLeft, Mail, Plus, Eye, User } from "lucide-react";

import { LeadHeader } from "./components/LeadHeader";
import { LeadDetailsPanel } from "./components/LeadDetailsPanel";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { EditLeadDialog } from "./components/EditLeadDialog";
import { SendEmailDialog } from "./components/SendEmailDialog";
import { AddNoteDialog } from "./components/AddNoteDialog";
import { QualifierResponseViewer } from "./components/QualifierResponseViewer";
import { AssignEstimatorDialog } from "./components/AssignEstimatorDialog";
import { EmailConversationTab } from "./components/EmailConversationTab";
import { AIAssistantTab } from "./components/AIAssistantTab";
import { SendEstimateDialog } from "./components/SendEstimateDialog";

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
  const [sendEstimateOpen, setSendEstimateOpen] = useState(false);

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
                  The lead you&apos;re looking for doesn&apos;t exist or you
                  don&apos;t have permission to view it.
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

        {/* Estimator Assignment Warning Banner */}
        {!lead.assignedEstimator && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-orange-900">
                    ⚠️ Estimator Assignment Required
                  </h3>
                </div>
                <p className="text-orange-700 text-sm">
                  This lead cannot be sent for estimation without an assigned
                  estimator. Please assign an estimator to proceed with the
                  workflow.
                </p>
              </div>
              <Button
                onClick={() => setAssignEstimatorOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6"
                size="lg"
              >
                Assign Estimator Now
              </Button>
            </div>
          </div>
        )}

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
                {/* Prominent Assign Estimator Button when none assigned */}
                {!lead.assignedEstimator && (
                  <Button
                    onClick={() => setAssignEstimatorOpen(true)}
                    className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white font-semibold border-2 border-orange-300"
                    size="lg"
                  >
                    <User className="h-5 w-5" />
                    🚨 Assign Estimator Required
                  </Button>
                )}

                <Button
                  onClick={() => setEmailDialogOpen(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>

                {/* Send Estimate Button - Only show if estimation data exists */}
                {lead.estimationData && (
                  <Button
                    onClick={() => setSendEstimateOpen(true)}
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white font-semibold"
                    size="lg"
                  >
                    <Mail className="h-5 w-5" />
                    📊 Send Estimate to Client
                  </Button>
                )}
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

                {/* Secondary Assign Estimator Button when one is already assigned */}
                {lead.assignedEstimator && (
                  <Button
                    onClick={() => setAssignEstimatorOpen(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <User className="h-4 w-4" />
                    Change Estimator
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity & Communications */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
                <TabsTrigger value="emails">Email Conversations</TabsTrigger>
                <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-6">
                <ActivityTimeline lead={lead} onRefresh={refetch} />
              </TabsContent>

              <TabsContent value="emails" className="mt-6">
                <EmailConversationTab lead={lead} userId={user?._id} />
              </TabsContent>

              <TabsContent value="ai-assistant" className="mt-6">
                <AIAssistantTab lead={lead} />
              </TabsContent>
            </Tabs>
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

      <SendEstimateDialog
        lead={lead}
        open={sendEstimateOpen}
        onOpenChange={setSendEstimateOpen}
        onSent={() => {
          setSendEstimateOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
