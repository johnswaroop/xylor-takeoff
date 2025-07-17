import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex gap-3 mb-4 justify-start", className)}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src="/assistant-avatar.png" alt="AI Assistant" />
        <AvatarFallback className="bg-blue-100 text-blue-600">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1 max-w-[80%] items-start">
        <Badge variant="secondary" className="text-xs">
          AI Assistant
        </Badge>

        <Card className="p-3 shadow-sm bg-white border-gray-200">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">AI is typing</span>
            <div className="flex gap-1 ml-2">
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
