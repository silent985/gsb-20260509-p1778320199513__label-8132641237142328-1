import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { UserConfig, Message, ChatSession } from '../types';

export interface StreamUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  assistantMessage: Message;
  timing: {
    startTime: number;
    endTime: number;
    totalTime: number;
  };
  usage: StreamUsage;
}

export interface ChatApiParams {
  config: UserConfig;
  history: Pick<Message, 'role' | 'content'>[];
  userContent: string;
  onChunk: (accumulated: string) => void;
}

export function createSession(title: string): ChatSession {
  return {
    id: uuidv4(),
    title,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createUserMessage(content: string): Message {
  return {
    id: uuidv4(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
}

export function appendMessage(
  sessions: ChatSession[],
  sessionId: string,
  message: Message,
): ChatSession[] {
  return sessions.map(s =>
    s.id === sessionId
      ? { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
      : s,
  );
}

export function extractHistory(session: ChatSession | undefined): Pick<Message, 'role' | 'content'>[] {
  return session ? session.messages.map(m => ({ role: m.role, content: m.content })) : [];
}

export async function sendChatMessage(params: ChatApiParams): Promise<ChatResult> {
  const { config, history, userContent, onChunk } = params;

  const startTime = Date.now();

  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: true,
  });

  const stream = await openai.chat.completions.create({
    model: config.model,
    messages: [...history, { role: 'user', content: userContent }] as any,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  });

  let fullResponse = '';
  const streamUsage: StreamUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullResponse += delta;
      onChunk(fullResponse);
    }
    if (chunk.usage) {
      streamUsage.promptTokens = chunk.usage.prompt_tokens || 0;
      streamUsage.completionTokens = chunk.usage.completion_tokens || 0;
      streamUsage.totalTokens = chunk.usage.total_tokens || 0;
    }
  }

  const endTime = Date.now();

  const assistantMessage: Message = {
    id: uuidv4(),
    role: 'assistant',
    content: fullResponse,
    timestamp: Date.now(),
  };

  return {
    assistantMessage,
    timing: { startTime, endTime, totalTime: endTime - startTime },
    usage: streamUsage,
  };
}
