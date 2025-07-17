"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ChatMessage, ChatState } from "@/lib/types/chat";
import { ChatMessageComponent } from "@/components/ui/chat-message";
import { ChatInput } from "@/components/ui/chat-input";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lead } from "@/lib/types/lead";
import { toast } from "sonner";
import { Bot, Trash2, MessageSquare, Building2 } from "lucide-react";

interface AIAssistantTabProps {
  lead: Lead;
}

export function AIAssistantTab({ lead }: AIAssistantTabProps) {
  const { user, isAuthenticated } = useAuth();

  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  // Refs for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isLoading]);

  // Initialize with lead-specific welcome message
  useEffect(() => {
    if (isAuthenticated && user && chatState.messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        content: `Hello ${user.name}! I'm your AI assistant for **${
          lead.companyName
        }**. I have access to all the lead information including:

• **Contact**: ${lead.contactPerson} (${lead.email})
• **Project Type**: ${lead.projectType}
• **Status**: ${lead.status}
• **Location**: ${lead.address}
${
  lead.assignedEstimator
    ? "• **✅ Estimator assigned**"
    : "• **⚠️ No estimator assigned yet**"
}

I can help you with:
- Business development strategies for this lead
- Project estimation guidance
- Email drafting suggestions
- Next steps in the sales process
- General questions about the construction takeoff process

How can I assist you with this lead today?`,
        role: "assistant",
        timestamp: new Date(),
      };
      setChatState((prev) => ({
        ...prev,
        messages: [welcomeMessage],
      }));
    }
  }, [isAuthenticated, user, lead, chatState.messages.length]);

  const handleSendMessage = async (messageContent: string) => {
    if (!user || !isAuthenticated) {
      toast.error("Authentication required");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: messageContent,
      role: "user",
      timestamp: new Date(),
    };

    // Add user message and set loading state
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user._id,
        },
        body: JSON.stringify({
          message: messageContent,
          userId: user._id,
          leadId: lead._id, // Include lead context
          leadContext: {
            companyName: lead.companyName,
            contactPerson: lead.contactPerson,
            email: lead.email,
            projectType: lead.projectType,
            status: lead.status,
            address: lead.address,
            assignedEstimator: lead.assignedEstimator,
            notes: lead.notes?.slice(-3), // Include last 3 notes for context
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          content: data.message,
          role: "assistant",
          timestamp: new Date(),
        };

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
        }));
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";

      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast.error("Failed to send message", {
        description: errorMessage,
      });
    }
  };

  const handleClearChat = () => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null,
    });
    toast.success("Chat cleared");
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border">
      {/* Header */}
      <div className="border-b bg-gray-50 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                AI Assistant for{" "}
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {lead.companyName}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Lead-specific guidance and assistance
              </p>
            </div>
          </div>

          {chatState.messages.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={chatState.isLoading}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div ref={messagesContainerRef} className="h-full overflow-y-auto p-4">
          {chatState.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Start a conversation
                </h4>
                <p className="text-xs text-gray-500">
                  Ask me anything about this lead, estimation strategies, or
                  next steps.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatState.messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}

              {chatState.isLoading && <TypingIndicator />}

              {chatState.error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    {chatState.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 rounded-b-lg">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={chatState.isLoading}
          disabled={!isAuthenticated}
          placeholder={`Ask me about ${lead.companyName}...`}
        />
      </div>
    </div>
  );
}
