"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Edit,
  Eye,
} from "lucide-react";
import { Lead } from "@/lib/types/lead";
import { PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
import { LEAD_STATUS_LABELS } from "@/lib/types/lead-status";

interface LeadDetailsPanelProps {
  lead: Lead;
  onEdit: () => void;
  onViewQualifier: () => void;
  onAssignEstimator: () => void;
}

export function LeadDetailsPanel({
  lead,
  onEdit,
  onViewQualifier,
  onAssignEstimator,
}: LeadDetailsPanelProps) {
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

  const hasQualifierData =
    lead.qualifierFormData && Object.keys(lead.qualifierFormData).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lead Details
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
            Contact Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {lead.companyName}
                </div>
                <div className="text-sm text-gray-500">Company Name</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {lead.contactPerson}
                </div>
                <div className="text-sm text-gray-500">Contact Person</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Mail className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{lead.email}</div>
                <div className="text-sm text-gray-500">Email Address</div>
              </div>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{lead.phone}</div>
                  <div className="text-sm text-gray-500">Phone Number</div>
                </div>
              </div>
            )}

            {lead.address && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {lead.address}
                  </div>
                  <div className="text-sm text-gray-500">Address</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Project Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
            Project Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Project Type
              </span>
              <Badge variant="outline">
                {PROJECT_TYPE_LABELS[lead.projectType] || lead.projectType}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Current Status
              </span>
              <Badge variant="secondary">
                {LEAD_STATUS_LABELS[lead.status] || lead.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Is Draft
              </span>
              <Badge variant={lead.isDraft ? "outline" : "secondary"}>
                {lead.isDraft ? "Yes" : "No"}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Assigned Estimator
                </span>
                <Button
                  variant={lead.assignedEstimator ? "outline" : "default"}
                  size="sm"
                  onClick={onAssignEstimator}
                  className={`text-xs h-7 px-3 ${
                    !lead.assignedEstimator
                      ? "bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      : ""
                  }`}
                >
                  {lead.assignedEstimator ? "Change" : "Assign Now"}
                </Button>
              </div>
              {lead.assignedEstimator ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900">
                      {(lead.assignedEstimator as { name?: string })?.name ||
                        "Assigned"}
                    </div>
                    <div className="text-xs text-green-600">
                      {(lead.assignedEstimator as { email?: string })?.email ||
                        "Estimator assigned"}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Assigned
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-orange-50 border-2 border-orange-200 border-dashed rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-orange-900">
                      ⚠️ No estimator assigned
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      Required before sending for estimation
                    </div>
                  </div>
                  <Button
                    onClick={onAssignEstimator}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                  >
                    Assign Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Timeline Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
            Timeline
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formatDate(lead.createdAt)}
                </div>
                <div className="text-sm text-gray-500">Created Date</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formatDate(lead.updatedAt)}
                </div>
                <div className="text-sm text-gray-500">Last Updated</div>
              </div>
            </div>
          </div>
        </div>

        {/* Initial Notes */}
        {lead.initialNotes && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
                Initial Notes
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {lead.initialNotes}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Qualifier Form Status */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
            Qualification Form
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  hasQualifierData ? "bg-green-50" : "bg-gray-50"
                }`}
              >
                <FileText
                  className={`h-4 w-4 ${
                    hasQualifierData ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {hasQualifierData ? "Response Received" : "Awaiting Response"}
                </div>
                <div className="text-sm text-gray-500">
                  {hasQualifierData
                    ? "Client has submitted qualification form"
                    : "Waiting for client to complete form"}
                </div>
              </div>
            </div>
            {hasQualifierData && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewQualifier}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Response
              </Button>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
            Activity Summary
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {lead.communications?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Communications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {lead.notes?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Notes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {lead.statusHistory?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Status Changes</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
