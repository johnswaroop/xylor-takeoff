import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = "Type your message...",
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading || !message.trim();

  return (
    <Card className={cn("p-4 border-t border-gray-200 bg-white", className)}>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="min-h-[44px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            rows={1}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span
              className={cn(
                "tabular-nums",
                message.length > 3800 && "text-yellow-600",
                message.length > 3900 && "text-red-600"
              )}
            >
              {message.length}/4000
            </span>
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={isDisabled}
          size="lg"
          className="h-11 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
