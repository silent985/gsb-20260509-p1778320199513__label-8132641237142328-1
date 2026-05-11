import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChatSession, UserConfig, ChatState } from '../types';
import { loadSessions, saveSessions, loadConfig, saveConfig } from '../services/storage';
import {
  createSession,
  createUserMessage,
  appendMessage,
  extractHistory,
  sendChatMessage,
  ChatResult,
} from '../services/chatApi';
import { formatApiError } from '../services/errorHandler';

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

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions().sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => loadSessions().currentSessionId,
  );
  const [config, setConfigState] = useState<UserConfig>(() => loadConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastResult, setLastResult] = useState<ChatResult | null>(null);

  useEffect(() => {
    saveSessions(sessions, currentSessionId);
  }, [sessions, currentSessionId]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const setConfig = useCallback((partial: Partial<UserConfig>) => {
    setConfigState(prev => ({ ...prev, ...partial }));
  }, []);

  const createNewSession = useCallback(() => {
    const session = createSession('New Chat');
    setSessions(prev => [session, ...prev]);
    setCurrentSessionId(session.id);
  }, []);

  const selectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    setStreamingContent('');
    setError(null);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    },
    [currentSessionId],
  );

  const updateCurrentMessage = useCallback((_content: string) => {}, []);

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      if (!config.apiKey) {
        setError('请在配置中输入您的 API 密钥。');
        return;
      }

      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        const session = createSession(content.slice(0, 30) || 'New Chat');
        setSessions(prev => [session, ...prev]);
        setCurrentSessionId(session.id);
        activeSessionId = session.id;
      }

      const targetId = activeSessionId;
      const userMsg = createUserMessage(content);

      setSessions(prev => appendMessage(prev, targetId, userMsg));
      setIsLoading(true);
      setError(null);
      setStreamingContent('');
      setLastResult(null);

      try {
        const currentSession = sessions.find(s => s.id === targetId);
        const history = extractHistory(currentSession);

        const result = await sendChatMessage({
          config,
          history,
          userContent: content,
          onChunk: accumulated => setStreamingContent(accumulated),
        });

        setSessions(prev => appendMessage(prev, targetId, result.assistantMessage));
        setStreamingContent('');
        setLastResult(result);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(formatApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [config, currentSessionId, sessions],
  );

  const usage: ChatState['usage'] = lastResult
    ? {
        startTime: lastResult.timing.startTime,
        endTime: lastResult.timing.endTime,
        totalTime: lastResult.timing.totalTime,
        promptTokens: lastResult.usage.promptTokens,
        completionTokens: lastResult.usage.completionTokens,
        totalTokens: lastResult.usage.totalTokens,
      }
    : { startTime: 0, endTime: 0, totalTime: 0 };

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
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
