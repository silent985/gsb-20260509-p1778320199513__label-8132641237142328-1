import { ChatSession, UserConfig } from '../types';

const STORAGE_KEY = 'ai-chat-data';
const CONFIG_KEY = 'ai-chat-config';

export interface StorageState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

export const chatStorage = {
  loadState: (): Partial<StorageState> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load chat state:', e);
      return {};
    }
  },

  saveState: (state: StorageState): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save chat state:', e);
    }
  },

  loadSessions: (): ChatSession[] => {
    const state = chatStorage.loadState();
    return state.sessions || [];
  },

  loadCurrentSessionId: (): string | null => {
    const state = chatStorage.loadState();
    return state.currentSessionId || null;
  },

  loadConfig: (defaultConfig: UserConfig): UserConfig => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved) : defaultConfig;
    } catch (e) {
      console.error('Failed to load config:', e);
      return defaultConfig;
    }
  },

  saveConfig: (config: UserConfig): void => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  },

  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONFIG_KEY);
  }
};
