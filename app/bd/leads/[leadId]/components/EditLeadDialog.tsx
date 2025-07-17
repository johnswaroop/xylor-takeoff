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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead } from "@/lib/types/lead";
import { ProjectType, PROJECT_TYPE_LABELS } from "@/lib/types/project-types";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeadDetails } from "@/lib/hooks/useLeadDetails";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditLeadDialog({
  lead,
  open,
  onOpenChange,
  onSave,
}: EditLeadDialogProps) {
  const { user } = useAuth();
  const { updateLead } = useLeadDetails(lead._id!, user?._id);

  const [formData, setFormData] = useState({
    companyName: lead.companyName || "",
    contactPerson: lead.contactPerson || "",
    email: lead.email || "",
    phone: lead.phone || "",
    address: lead.address || "",
    projectType: lead.projectType || ProjectType.RESIDENTIAL_NEW_BUILD,
    initialNotes: lead.initialNotes || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when lead changes
  useEffect(() => {
    setFormData({
      companyName: lead.companyName || "",
      contactPerson: lead.contactPerson || "",
      email: lead.email || "",
      phone: lead.phone || "",
      address: lead.address || "",
      projectType: lead.projectType || ProjectType.RESIDENTIAL_NEW_BUILD,
      initialNotes: lead.initialNotes || "",
    });
    setErrors({});
  }, [lead]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.projectType) {
      newErrors.projectType = "Project type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateLead(formData);
      if (success) {
        onSave();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      companyName: lead.companyName || "",
      contactPerson: lead.contactPerson || "",
      email: lead.email || "",
      phone: lead.phone || "",
      address: lead.address || "",
      projectType: lead.projectType || ProjectType.RESIDENTIAL_NEW_BUILD,
      initialNotes: lead.initialNotes || "",
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead Details</DialogTitle>
          <DialogDescription>
            Update the lead information. Required fields are marked with an
            asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              placeholder="Enter company name"
              className={errors.companyName ? "border-red-500" : ""}
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">{errors.companyName}</p>
            )}
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) =>
                handleInputChange("contactPerson", e.target.value)
              }
              placeholder="Enter contact person name"
              className={errors.contactPerson ? "border-red-500" : ""}
            />
            {errors.contactPerson && (
              <p className="text-sm text-red-500">{errors.contactPerson}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number (optional)"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter project address (optional)"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType">Project Type *</Label>
            <Select
              value={formData.projectType}
              onValueChange={(value) => handleInputChange("projectType", value)}
            >
              <SelectTrigger
                className={errors.projectType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectType && (
              <p className="text-sm text-red-500">{errors.projectType}</p>
            )}
          </div>

          {/* Initial Notes */}
          <div className="space-y-2">
            <Label htmlFor="initialNotes">Initial Notes</Label>
            <Textarea
              id="initialNotes"
              value={formData.initialNotes}
              onChange={(e) =>
                handleInputChange("initialNotes", e.target.value)
              }
              placeholder="Enter any initial notes about this lead (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
