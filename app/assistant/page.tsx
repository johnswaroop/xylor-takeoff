"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantModal } from "@/components/assistant-components/assistant-modal";

const MyApp = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal />
    </AssistantRuntimeProvider>
  );
};

export default MyApp;
