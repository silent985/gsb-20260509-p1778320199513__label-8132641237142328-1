import OpenAI from 'openai';
import { Message, UserConfig } from '../types';

export interface StreamChunk {
  delta: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamResult {
  fullResponse: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (result: StreamResult) => void;
  onError: (error: Error) => void;
}

export const createChatClient = (config: UserConfig) => {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: true
  });
};

export const buildMessageHistory = (messages: Message[]): Array<{ role: string; content: string }> => {
  return messages.map(m => ({ role: m.role, content: m.content }));
};

export const streamChatCompletion = async (
  config: UserConfig,
  messages: Message[],
  userContent: string,
  callbacks: Partial<StreamCallbacks> = {}
): Promise<StreamResult> => {
  const openai = createChatClient(config);
  const history = buildMessageHistory(messages);

  const stream = await openai.chat.completions.create({
    model: config.model,
    messages: [...history, { role: 'user', content: userContent }] as any,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  });

  let fullResponse = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullResponse += delta;
      callbacks.onChunk?.(delta);
    }

    if (chunk.usage) {
      promptTokens = chunk.usage.prompt_tokens || 0;
      completionTokens = chunk.usage.completion_tokens || 0;
      totalTokens = chunk.usage.total_tokens || 0;
    }
  }

  const result: StreamResult = {
    fullResponse,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens
    }
  };

  callbacks.onComplete?.(result);
  return result;
};
