import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, UserConfig, ChatState } from '../types';
import { loadChatData, saveChatData, loadConfig, saveConfig } from '../utils/storage';
import { sendChatMessage, StreamTokenInfo } from '../services/chatApi';
import { mapAPIError, APIError } from '../utils/errors';

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
  baseUrl: 'https://api.siliconflow.cn/v1',
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadChatData().sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => loadChatData().currentSessionId);
  const [config, setConfigState] = useState<UserConfig>(() => loadConfig(DEFAULT_CONFIG));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [usage, setUsage] = useState<ChatState['usage']>({ startTime: 0, endTime: 0, totalTime: 0 });

  useEffect(() => {
    saveChatData({ sessions, currentSessionId });
  }, [sessions, currentSessionId]);

  useEffect(() => {
    saveConfig(config);
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
      updatedAt: Date.now(),
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

  const updateCurrentMessage = (_content: string) => {
  };

  const clearError = () => setError(null);

  const ensureSession = (content: string): string => {
    if (currentSessionId) {
      return currentSessionId;
    }
    const newSession: ChatSession = {
      id: uuidv4(),
      title: content.slice(0, 30) || 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const addMessage = (sessionId: string, message: Message) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, message], updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const getHistoryForSession = (sessionsList: ChatSession[], sessionId: string, extraMessage?: Message): Message[] => {
    const currentSession = sessionsList.find(s => s.id === sessionId);
    const history = currentSession ? [...currentSession.messages] : [];
    if (extraMessage) {
      history.push(extraMessage);
    }
    return history;
  };

  const handleStreamToken = (delta: string, accumulated: string): string => {
    const newContent = accumulated + delta;
    setStreamingContent(newContent);
    return newContent;
  };

  const finalizeAssistantMessage = (sessionId: string, content: string) => {
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    addMessage(sessionId, assistantMessage);
    setStreamingContent('');
  };

  const updateUsageStats = (startTime: number, tokenInfo: StreamTokenInfo) => {
    const endTime = Date.now();
    setUsage({
      startTime,
      endTime,
      totalTime: endTime - startTime,
      promptTokens: tokenInfo.promptTokens,
      completionTokens: tokenInfo.completionTokens,
      totalTokens: tokenInfo.totalTokens,
    });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!config.apiKey) {
      setError('请在配置中输入您的 API 密钥。');
      return;
    }

    const activeSessionId = ensureSession(content);

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(activeSessionId, userMessage);

    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    const startTime = Date.now();
    setUsage({ startTime, endTime: 0, totalTime: 0 });

    let accumulatedContent = '';

    try {
      const history = getHistoryForSession(sessions, activeSessionId, userMessage);

      const tokenInfo = await sendChatMessage(config, history, {
        onToken: (delta) => {
          accumulatedContent = handleStreamToken(delta, accumulatedContent);
        },
        onComplete: () => {},
      });

      finalizeAssistantMessage(activeSessionId, accumulatedContent);
      updateUsageStats(startTime, tokenInfo);
    } catch (err) {
      console.error('API Error:', err);
      setError(mapAPIError(err as APIError));
    } finally {
      setIsLoading(false);
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
      clearError,
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
