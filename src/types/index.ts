export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface UserConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseUrl: string; // 用于自定义端点，如 SiliconFlow
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  config: UserConfig;
  isLoading: boolean;
  error: string | null;
  streamingContent: string; // 流式响应的临时缓冲区
  usage: {
    startTime: number;
    endTime: number;
    totalTime: number;
    // 没有后端的情况下，token 使用量难以精确计算，
    // 但我们可以从可用的头信息中估算或解析
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }
}
