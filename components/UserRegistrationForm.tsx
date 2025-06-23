"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserFormData, ApiResponse } from "@/lib/types/user";
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface UserRegistrationFormProps {
  onRegistrationComplete: (userId: string) => void;
}

export default function UserRegistrationForm({
  onRegistrationComplete,
}: UserRegistrationFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    wantDemo: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (
    field: keyof UserFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const toastId = toast.loading("Creating your account...");

    try {
      const response = await fetch("/api/user-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.userId) {
        // Store user info for the session
        localStorage.setItem("user_id", data.userId);
        localStorage.setItem("user_info", JSON.stringify(data.user));

        toast.success("Registration successful! Welcome aboard!", {
          id: toastId,
          description: `Hello ${formData.name}! You can now upload your floor plans.`,
        });

        onRegistrationComplete(data.userId);
      } else {
        if (response.status === 409) {
          toast.error("Email already registered", {
            id: toastId,
            description:
              "An account with this email already exists. Please use a different email or contact support.",
          });
        } else {
          toast.error("Registration failed", {
            id: toastId,
            description:
              data.error || "Please check your information and try again.",
          });
        }
        setError(data.error || "Registration failed");
      }
    } catch {
      toast.error("Network error", {
        id: toastId,
        description:
          "Could not connect to server. Please check your internet connection and try again.",
      });
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.name && formData.email && formData.company && formData.title;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Get Started</h1>
          <p className="text-muted-foreground">
            Please provide your information to access the floor plan analysis
            tool
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registration Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                  <span className="text-muted-foreground text-sm">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company *
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Enter your company name"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  required
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter your job title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              {/* Demo Request */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Would you like us to demo the full capabilities of this
                  program? *
                </Label>
                <Select
                  value={formData.wantDemo.toString()}
                  onValueChange={(value) =>
                    handleInputChange("wantDemo", value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      Yes, I&apos;m interested in a demo
                    </SelectItem>
                    <SelectItem value="false">
                      No, just the tool access
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Continue to Upload"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                * Required fields
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
