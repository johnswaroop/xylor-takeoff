import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/lib/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { User, Bot } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export function ChatMessageComponent({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user";

  const MarkdownComponents: Components = {
    code(props) {
      const { children, className, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      const isCodeBlock = match && typeof children === "string";

      return isCodeBlock ? (
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto mt-2 mb-2">
          <code className="text-sm font-mono" {...rest}>
            {String(children).replace(/\n$/, "")}
          </code>
        </pre>
      ) : (
        <code
          className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
          {...rest}
        >
          {children}
        </code>
      );
    },
    pre({ children }) {
      return <div className="overflow-x-auto">{children}</div>;
    },
    h1({ children }) {
      return (
        <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="text-base font-bold mb-1 mt-2 first:mt-0">{children}</h3>
      );
    },
    p({ children }) {
      return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
    },
    ul({ children }) {
      return (
        <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
      );
    },
    li({ children }) {
      return <li className="ml-2">{children}</li>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
          {children}
        </blockquote>
      );
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          {children}
        </a>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-2">
          <table className="min-w-full border border-gray-300 rounded">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-gray-50">{children}</thead>;
    },
    th({ children }) {
      return (
        <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className="border border-gray-300 px-2 py-1">{children}</td>;
    },
  };

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="/assistant-avatar.png" alt="AI Assistant" />
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {isUser ? "You" : "AI Assistant"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), "HH:mm")}
          </span>
        </div>

        <Card
          className={cn(
            "p-3 shadow-sm",
            isUser
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white border-gray-200"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none">
              <ReactMarkdown components={MarkdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </Card>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback className="bg-gray-100 text-gray-600">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
