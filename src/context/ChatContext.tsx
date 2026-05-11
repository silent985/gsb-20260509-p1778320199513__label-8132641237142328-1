import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, UserConfig, ChatState } from '../types';
import OpenAI from 'openai';

interface ChatContextType extends ChatState {
  setConfig: (config: Partial<UserConfig>) => void;
  createNewSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  updateCurrentMessage: (content: string) => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_CONFIG: UserConfig = {
  apiKey: '',
  model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  temperature: 0.7,
  maxTokens: 2000,
  baseUrl: 'https://api.siliconflow.cn/v1' // SiliconFlow 基础 URL
};

const STORAGE_KEY = 'ai-chat-data';

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from local storage or defaults
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).sessions || [] : [];
    } catch (e) {
      console.error("Failed to parse sessions", e);
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).currentSessionId || null : null;
    } catch (e) {
      return null;
    }
  });

  const [config, setConfigState] = useState<UserConfig>(() => {
    try {
      const saved = localStorage.getItem('ai-chat-config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [usage, setUsage] = useState<ChatState['usage']>({ startTime: 0, endTime: 0, totalTime: 0 });

  // Persist sessions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, currentSessionId }));
  }, [sessions, currentSessionId]);

  // Persist config
  useEffect(() => {
    localStorage.setItem('ai-chat-config', JSON.stringify(config));
  }, [config]);

  const setConfig = (newConfig: Partial<UserConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const selectSession = (id: string) => {
    setCurrentSessionId(id);
    setStreamingContent('');
    setError(null);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const updateCurrentMessage = (content: string) => {
    // 手动更新消息的辅助函数（在流式逻辑中很少使用）
  };

  const clearError = () => setError(null);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!config.apiKey) {
      setError('请在配置中输入您的 API 密钥。');
      return;
    }

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: uuidv4(),
        title: content.slice(0, 30) || 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      activeSessionId = newSession.id;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() };
      }
      return s;
    }));

    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    const startTime = Date.now();
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    setUsage({ startTime, endTime: 0, totalTime: 0 });

    try {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
        dangerouslyAllowBrowser: true // Client-side only requirement
      });

      // Prepare history
      const currentSession = sessions.find(s => s.id === activeSessionId);
      const history = currentSession ? currentSession.messages.map(m => ({ role: m.role, content: m.content })) : [];

      const stream = await openai.chat.completions.create({
        model: config.model,
        messages: [...history, { role: 'user', content }] as any,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          setStreamingContent(fullResponse);
        }
        // Check if chunk contains usage information (usually in the last chunk)
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens || 0;
          completionTokens = chunk.usage.completion_tokens || 0;
          totalTokens = chunk.usage.total_tokens || 0;
        }
      }

      // Finalize message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, assistantMessage], updatedAt: Date.now() };
        }
        return s;
      }));
      setStreamingContent('');

    } catch (err: any) {
      console.error('API Error:', err);
      let errorMessage = '发送消息失败';
      if (err.status === 403) {
        errorMessage = '403 错误：API 密钥无效或无权限，请检查配置';
      } else if (err.status === 401) {
        errorMessage = '401 错误：API 密钥未授权，请检查配置';
      } else if (err.status === 429) {
        errorMessage = '429 错误：API 请求过于频繁，请稍后再试';
      } else if (err.code === 30001) {
        errorMessage = '账户余额不足，请充值后再试';
      } else if (err.error?.code === 30001) {
        errorMessage = '账户余额不足，请充值后再试';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      const endTime = Date.now();
      setUsage(prev => ({
        ...prev,
        endTime,
        totalTime: endTime - startTime,
        promptTokens,
        completionTokens,
        totalTokens
      }));
    }
  };

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      config,
      isLoading,
      error,
      streamingContent,
      usage,
      setConfig,
      createNewSession,
      selectSession,
      deleteSession,
      sendMessage,
      updateCurrentMessage,
      clearError
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
