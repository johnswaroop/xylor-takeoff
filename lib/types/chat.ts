export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatApiRequest {
  message: string;
  userId: string;
}

export interface ChatApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ChatApiError {
  success: false;
  error: string;
}

export interface ChatApiSuccess {
  success: true;
  message: string;
}

export type ChatApiResult = ChatApiSuccess | ChatApiError;
