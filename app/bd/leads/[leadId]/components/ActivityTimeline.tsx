"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Clock,
  Mail,
  Phone,
  MessageSquare,
  UserCheck,
  ArrowRight,
  RefreshCw,
  User,
} from "lucide-react";
import { Lead, Communication, Note, StatusChange } from "@/lib/types/lead";
import { LEAD_STATUS_LABELS } from "@/lib/types/lead-status";
import { CommunicationType } from "@/lib/types/lead";

interface ActivityTimelineProps {
  lead: Lead;
  onRefresh: () => void;
}

interface ActivityItem {
  id: string;
  type: "communication" | "status_change" | "note" | "creation";
  timestamp: Date;
  title: string;
  description: string;
  icon: React.ReactNode;
  data?: Communication | StatusChange | Note;
}

export function ActivityTimeline({ lead, onRefresh }: ActivityTimelineProps) {
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

  const formatRelativeTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return formatDate(date);
  };

  const getActivityItems = (): ActivityItem[] => {
    const items: ActivityItem[] = [];

    // Add lead creation
    items.push({
      id: "creation",
      type: "creation",
      timestamp: new Date(lead.createdAt),
      title: "Lead Created",
      description: `Lead created for ${lead.companyName}`,
      icon: <UserCheck className="h-4 w-4 text-blue-600" />,
    });

    // Add communications
    if (lead.communications) {
      lead.communications.forEach((comm, index) => {
        const isEmail = comm.type === CommunicationType.EMAIL;
        const isOutbound = comm.direction === "OUTBOUND";

        items.push({
          id: `comm-${index}`,
          type: "communication",
          timestamp: new Date(comm.sentAt),
          title: `${comm.type} ${isOutbound ? "Sent" : "Received"}`,
          description:
            comm.subject ||
            comm.content.substring(0, 100) +
              (comm.content.length > 100 ? "..." : ""),
          icon: isEmail ? (
            <Mail
              className={`h-4 w-4 ${
                isOutbound ? "text-green-600" : "text-blue-600"
              }`}
            />
          ) : (
            <Phone
              className={`h-4 w-4 ${
                isOutbound ? "text-green-600" : "text-blue-600"
              }`}
            />
          ),
          data: comm,
        });
      });
    }

    // Add status changes
    if (lead.statusHistory) {
      lead.statusHistory.forEach((status, index) => {
        items.push({
          id: `status-${index}`,
          type: "status_change",
          timestamp: new Date(status.changedAt),
          title: "Status Updated",
          description: `Status changed to ${
            LEAD_STATUS_LABELS[status.toStatus] || status.toStatus
          }`,
          icon: <ArrowRight className="h-4 w-4 text-purple-600" />,
          data: status,
        });
      });
    }

    // Add notes
    if (lead.notes) {
      lead.notes.forEach((note, index) => {
        items.push({
          id: `note-${index}`,
          type: "note",
          timestamp: new Date(note.createdAt),
          title: "Note Added",
          description:
            note.content.substring(0, 100) +
            (note.content.length > 100 ? "..." : ""),
          icon: <MessageSquare className="h-4 w-4 text-yellow-600" />,
          data: note,
        });
      });
    }

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const activityItems = getActivityItems();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activityItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activity yet</p>
            <p className="text-sm">
              Activity will appear here as you interact with this lead.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activityItems.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Timeline connector */}
                {index < activityItems.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {item.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>

                    {/* Additional details based on type */}
                    {item.type === "communication" && item.data && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            Direction: {(item.data as Communication).direction}
                          </span>
                          <span>•</span>
                          <span>Type: {(item.data as Communication).type}</span>
                        </div>
                        {(item.data as Communication).content && (
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {(item.data as Communication).content}
                          </p>
                        )}
                      </div>
                    )}

                    {item.type === "status_change" && item.data && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {(item.data as StatusChange).fromStatus && (
                            <>
                              <span>
                                From:{" "}
                                {LEAD_STATUS_LABELS[
                                  (item.data as StatusChange).fromStatus!
                                ] || (item.data as StatusChange).fromStatus}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                          <span>
                            To:{" "}
                            {LEAD_STATUS_LABELS[
                              (item.data as StatusChange).toStatus
                            ] || (item.data as StatusChange).toStatus}
                          </span>
                        </div>
                        {(item.data as StatusChange).reason && (
                          <p className="text-sm text-gray-700 mt-1">
                            Reason: {(item.data as StatusChange).reason}
                          </p>
                        )}
                        {(item.data as StatusChange).notes && (
                          <p className="text-sm text-gray-700 mt-1">
                            Notes: {(item.data as StatusChange).notes}
                          </p>
                        )}
                      </div>
                    )}

                    {item.type === "note" && item.data && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {(item.data as Note).content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <User className="h-3 w-3" />
                          <span>Added by user</span>
                          {(item.data as Note).isPrivate && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                Private
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
