"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lead } from "@/lib/types/lead";

interface AddNoteDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddNoteDialog({
  lead,
  open,
  onOpenChange,
}: AddNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note to {lead.companyName}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <p>Add note dialog functionality coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
