"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, UserCheck, UserX, Loader2 } from "lucide-react";
import { Lead } from "@/lib/types/lead";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeadDetails } from "@/lib/hooks/useLeadDetails";
import { toast } from "sonner";

interface EstimatorData {
  _id: string;
  name: string;
  email: string;
  company?: string;
}

interface AssignEstimatorDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function AssignEstimatorDialog({
  lead,
  open,
  onOpenChange,
  onAssigned,
}: AssignEstimatorDialogProps) {
  const { user } = useAuth();
  const { updateLead } = useLeadDetails(lead._id!, user?._id);

  const [estimators, setEstimators] = useState<EstimatorData[]>([]);
  const [selectedEstimatorId, setSelectedEstimatorId] =
    useState<string>("UNASSIGN");
  const [isLoadingEstimators, setIsLoadingEstimators] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Get current assigned estimator ID
  const currentEstimatorId =
    typeof lead.assignedEstimator === "object"
      ? (lead.assignedEstimator as { _id: string; name?: string })?._id
      : lead.assignedEstimator;

  // Set initial selected estimator
  useEffect(() => {
    if (open && currentEstimatorId) {
      setSelectedEstimatorId(currentEstimatorId);
    } else if (open) {
      setSelectedEstimatorId("UNASSIGN");
    }
  }, [open, currentEstimatorId]);

  // Fetch estimators when dialog opens
  useEffect(() => {
    if (open && user?._id) {
      fetchEstimators();
    }
  }, [open, user?._id]);

  const fetchEstimators = async () => {
    if (!user?._id) return;

    setIsLoadingEstimators(true);
    try {
      const response = await fetch("/api/users/estimators", {
        headers: {
          "x-user-id": user._id,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch estimators");
      }

      const data = await response.json();
      if (data.success) {
        setEstimators(data.estimators || []);
      } else {
        throw new Error(data.error || "Failed to fetch estimators");
      }
    } catch (error) {
      console.error("Error fetching estimators:", error);
      toast.error("Failed to fetch estimators", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoadingEstimators(false);
    }
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      const success = await updateLead({
        assignedEstimator:
          selectedEstimatorId === "UNASSIGN" ? undefined : selectedEstimatorId,
      });

      if (success) {
        const selectedEstimator = estimators.find(
          (e) => e._id === selectedEstimatorId
        );
        if (selectedEstimatorId !== "UNASSIGN" && selectedEstimator) {
          toast.success("Estimator assigned successfully", {
            description: `${selectedEstimator.name} has been assigned to this lead`,
          });
        } else {
          toast.success("Estimator unassigned", {
            description: "No estimator is now assigned to this lead",
          });
        }
        onAssigned();
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancel = () => {
    setSelectedEstimatorId(currentEstimatorId || "UNASSIGN");
    onOpenChange(false);
  };

  const selectedEstimator = estimators.find(
    (e) => e._id === selectedEstimatorId
  );
  const currentEstimator = estimators.find((e) => e._id === currentEstimatorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Estimator
          </DialogTitle>
          <DialogDescription>
            Assign an estimator to handle the estimation for {lead.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Assignment</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              {currentEstimator ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {currentEstimator.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentEstimator.email}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    Assigned
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserX className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">
                      No estimator assigned
                    </div>
                    <div className="text-sm text-gray-400">
                      This lead needs an estimator
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* New Assignment */}
          <div className="space-y-2">
            <Label htmlFor="estimator-select" className="text-sm font-medium">
              Select Estimator
            </Label>
            {isLoadingEstimators ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">
                  Loading estimators...
                </span>
              </div>
            ) : (
              <Select
                value={selectedEstimatorId}
                onValueChange={setSelectedEstimatorId}
              >
                <SelectTrigger id="estimator-select">
                  <SelectValue placeholder="Choose an estimator..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGN">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-gray-400" />
                      <span>No estimator (unassign)</span>
                    </div>
                  </SelectItem>
                  {estimators.map((estimator) => (
                    <SelectItem key={estimator._id} value={estimator._id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{estimator.name}</div>
                          <div className="text-xs text-gray-500">
                            {estimator.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Preview of selection */}
          {selectedEstimatorId && selectedEstimator && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-blue-900">
                    Will be assigned: {selectedEstimator.name}
                  </div>
                  <div className="text-sm text-blue-600">
                    {selectedEstimator.email}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto border-blue-300 text-blue-700"
                >
                  Selected
                </Badge>
              </div>
            </div>
          )}

          {selectedEstimatorId === "" && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserX className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-orange-900">
                    Will unassign estimator
                  </div>
                  <div className="text-sm text-orange-600">
                    No estimator will be assigned to this lead
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || isLoadingEstimators}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : selectedEstimatorId ? (
              "Assign Estimator"
            ) : (
              "Unassign Estimator"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
