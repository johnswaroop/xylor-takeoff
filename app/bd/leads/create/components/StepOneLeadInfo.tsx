"use client";

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
import { Building, User, Mail, Phone, MapPin, FileText } from "lucide-react";
import { LeadFormStepOne } from "@/lib/types/lead";
import {
  ProjectType,
  PROJECT_TYPE_CATEGORIES,
  PROJECT_TYPE_LABELS,
} from "@/lib/types/project-types";

interface StepOneLeadInfoProps {
  data: LeadFormStepOne;
  onChange: (data: LeadFormStepOne) => void;
}

export default function StepOneLeadInfo({
  data,
  onChange,
}: StepOneLeadInfoProps) {
  const handleChange = (
    field: keyof LeadFormStepOne,
    value: string | ProjectType
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Company Information</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company/Customer Name *
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Enter company or customer name"
              value={data.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Person *
            </Label>
            <Input
              id="contactPerson"
              type="text"
              placeholder="Enter contact person name"
              value={data.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Contact Information</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={data.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={data.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Project Address/Location
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="Enter project address or location"
            value={data.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>
      </div>

      {/* Project Information */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Project Information</div>

        <div className="space-y-2">
          <Label htmlFor="projectType" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Project Type *
          </Label>
          <Select
            value={data.projectType}
            onValueChange={(value) =>
              handleChange("projectType", value as ProjectType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_TYPE_CATEGORIES).map(
                ([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                      {category.replace("_", " ")}
                    </div>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROJECT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </div>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialNotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Initial Notes/Description
          </Label>
          <Textarea
            id="initialNotes"
            placeholder="Enter any initial notes or project description..."
            value={data.initialNotes || ""}
            onChange={(e) => handleChange("initialNotes", e.target.value)}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Include any important details about the project, timeline, or
            specific requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
