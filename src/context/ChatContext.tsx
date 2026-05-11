import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, UserConfig, ChatState } from '../types';
import { chatStorage } from '../services/chatStorage';
import { streamChatCompletion, StreamResult } from '../services/chatApi';
import { getErrorMessage, logError, ApiError } from '../utils/errorHandler';

interface ChatContextType extends ChatState {
  hasValidUsage: boolean;
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
  baseUrl: 'https://api.siliconflow.cn/v1'
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => chatStorage.loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => chatStorage.loadCurrentSessionId());
  const [config, setConfigState] = useState<UserConfig>(() => chatStorage.loadConfig(DEFAULT_CONFIG));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [usage, setUsage] = useState<ChatState['usage']>({ startTime: 0, endTime: 0, totalTime: 0 });
  const [hasValidUsage, setHasValidUsage] = useState(false);

  useEffect(() => {
    chatStorage.saveState({ sessions, currentSessionId });
  }, [sessions, currentSessionId]);

  useEffect(() => {
    chatStorage.saveConfig(config);
  }, [config]);

  const setConfig = useCallback((newConfig: Partial<UserConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const selectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    setStreamingContent('');
    setError(null);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const updateCurrentMessage = useCallback((_content: string) => {}, []);

  const clearError = useCallback(() => setError(null), []);

  const ensureActiveSession = useCallback((content: string): string => {
    if (currentSessionId) return currentSessionId;

    const newSession: ChatSession = {
      id: uuidv4(),
      title: content.slice(0, 30) || 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, [currentSessionId]);

  const addUserMessage = useCallback((sessionId: string, content: string): Message => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() };
      }
      return s;
    }));

    return userMessage;
  }, []);

  const addAssistantMessage = useCallback((sessionId: string, content: string) => {
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, assistantMessage], updatedAt: Date.now() };
      }
      return s;
    }));
  }, []);

  const handleStreamingStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    setHasValidUsage(false);
    const startTime = Date.now();
    setUsage({ startTime, endTime: 0, totalTime: 0 });
    return startTime;
  }, []);

  const handleStreamingComplete = useCallback((startTime: number, result: StreamResult) => {
    const endTime = Date.now();
    setUsage({
      startTime,
      endTime,
      totalTime: endTime - startTime,
      ...result.usage
    });
    setHasValidUsage(true);
  }, []);

  const handleStreamingError = useCallback((err: ApiError) => {
    logError(err);
    setError(getErrorMessage(err));
    setStreamingContent('');
    setHasValidUsage(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    if (!config.apiKey) {
      setError('请在配置中输入您的 API 密钥。');
      setHasValidUsage(false);
      return;
    }

    const activeSessionId = ensureActiveSession(content);
    addUserMessage(activeSessionId, content);

    const startTime = handleStreamingStart();
    let accumulatedContent = '';

    try {
      const currentSession = sessions.find(s => s.id === activeSessionId);
      const historyMessages = currentSession?.messages || [];

      const result = await streamChatCompletion(config, historyMessages, content, {
        onChunk: (delta) => {
          accumulatedContent += delta;
          setStreamingContent(accumulatedContent);
        }
      });

      addAssistantMessage(activeSessionId, accumulatedContent);
      setStreamingContent('');
      handleStreamingComplete(startTime, result);

    } catch (err: any) {
      handleStreamingError(err);
    } finally {
      setIsLoading(false);
    }
  }, [config, sessions, ensureActiveSession, addUserMessage, addAssistantMessage, handleStreamingStart, handleStreamingComplete, handleStreamingError]);

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      config,
      isLoading,
      error,
      streamingContent,
      usage,
      hasValidUsage,
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
