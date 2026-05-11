import OpenAI from 'openai';
import { Message, UserConfig } from '../types';

export interface StreamTokenInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamCallbacks {
  onToken: (delta: string) => void;
  onComplete: () => void;
}

export const sendChatMessage = async (
  config: UserConfig,
  history: Message[],
  callbacks: StreamCallbacks
): Promise<StreamTokenInfo> => {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: true,
  });

  const messages = history.map(m => ({ role: m.role, content: m.content })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  const stream = await openai.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  });

  const tokenInfo: StreamTokenInfo = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      callbacks.onToken(delta);
    }
    if (chunk.usage) {
      tokenInfo.promptTokens = chunk.usage.prompt_tokens || 0;
      tokenInfo.completionTokens = chunk.usage.completion_tokens || 0;
      tokenInfo.totalTokens = chunk.usage.total_tokens || 0;
    }
  }

  callbacks.onComplete();
  return tokenInfo;
};
