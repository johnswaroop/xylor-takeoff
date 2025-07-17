"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lead } from "@/lib/types/lead";

interface SendEmailDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

export function SendEmailDialog({
  lead,
  open,
  onOpenChange,
  onSent,
}: SendEmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send an email to {lead.contactPerson} at {lead.email}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <p>Email dialog functionality coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
