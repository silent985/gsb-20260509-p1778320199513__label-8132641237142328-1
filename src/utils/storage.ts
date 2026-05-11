import { ChatSession, UserConfig } from '../types';

const CHAT_DATA_KEY = 'ai-chat-data';
const CHAT_CONFIG_KEY = 'ai-chat-config';

interface ChatStorageData {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

const safeParse = <T>(data: string | null, defaultValue: T): T => {
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse storage data:', e);
    return defaultValue;
  }
};

export const loadChatData = (): ChatStorageData => {
  const saved = localStorage.getItem(CHAT_DATA_KEY);
  return safeParse(saved, { sessions: [], currentSessionId: null });
};

export const saveChatData = (data: ChatStorageData): void => {
  localStorage.setItem(CHAT_DATA_KEY, JSON.stringify(data));
};

export const loadConfig = (defaultConfig: UserConfig): UserConfig => {
  const saved = localStorage.getItem(CHAT_CONFIG_KEY);
  return safeParse(saved, defaultConfig);
};

export const saveConfig = (config: UserConfig): void => {
  localStorage.setItem(CHAT_CONFIG_KEY, JSON.stringify(config));
};
