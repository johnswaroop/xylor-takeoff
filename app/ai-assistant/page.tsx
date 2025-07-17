"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { UserRole } from "@/lib/types/user-roles";
import { ChatMessage, ChatState } from "@/lib/types/chat";
import { ChatMessageComponent } from "@/components/ui/chat-message";
import { ChatInput } from "@/components/ui/chat-input";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Bot, Trash2, MessageSquare } from "lucide-react";

export default function AIAssistantPage() {
  // Authentication and role check
  const { user, isAuthenticated } = useAuth();
  const { isLoading: authLoading, isAuthorized } = useAuthGuard({
    requiredRoles: [UserRole.ADMIN, UserRole.BD],
  });

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

  // Initialize with welcome message
  useEffect(() => {
    if (isAuthenticated && user && chatState.messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        content: `Hello ${user.name}! I'm your AI assistant for Xylor. I can help you with business development strategies, lead management, project planning, and general questions about the construction takeoff process. How can I assist you today?`,
        role: "assistant",
        timestamp: new Date(),
      };
      setChatState((prev) => ({
        ...prev,
        messages: [welcomeMessage],
      }));
    }
  }, [isAuthenticated, user, chatState.messages.length]);

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

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <p className="mt-2 text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-lg font-semibold mb-2">Access Restricted</h1>
            <p className="text-gray-600">
              The AI Assistant is only available to Admin and Business
              Development users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Card className="rounded-none border-b shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your intelligent helper for Xylor operations
                </p>
              </div>
            </div>

            {chatState.messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={chatState.isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-4 py-4"
        >
          {chatState.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Start a conversation
                </h2>
                <p className="text-gray-500">
                  Ask me anything about lead management, project estimation, or
                  business development strategies.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {chatState.messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}

              {chatState.isLoading && <TypingIndicator />}

              {chatState.error && (
                <Alert variant="destructive">
                  <AlertDescription>{chatState.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={chatState.isLoading}
            disabled={!isAuthenticated}
            placeholder="Ask me anything about your business..."
          />
        </div>
      </div>
    </div>
  );
}
