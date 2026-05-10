import { ChatSession, UserConfig } from '../types';

const SESSIONS_KEY = 'ai-chat-data';
const CONFIG_KEY = 'ai-chat-config';

export interface PersistedSessionData {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSessions(): PersistedSessionData {
  const data = safeParse<PersistedSessionData | null>(SESSIONS_KEY, null);
  if (!data) return { sessions: [], currentSessionId: null };
  return {
    sessions: data.sessions || [],
    currentSessionId: data.currentSessionId || null,
  };
}

export function saveSessions(sessions: ChatSession[], currentSessionId: string | null): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify({ sessions, currentSessionId }));
}

export const DEFAULT_CONFIG: UserConfig = {
  apiKey: '',
  model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  temperature: 0.7,
  maxTokens: 2000,
  baseUrl: 'https://api.siliconflow.cn/v1',
};

export function loadConfig(): UserConfig {
  return safeParse<UserConfig>(CONFIG_KEY, DEFAULT_CONFIG);
}

export function saveConfig(config: UserConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
