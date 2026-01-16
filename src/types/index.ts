// Om Card 类型定义

export type AIProvider = 'google' | 'doubao';

export interface DrawRequest {
  provider?: AIProvider;
}

export interface DrawResponse {
  imageUrl: string;
  prompt: string;
  archetype: string;
  atmosphere: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  imageContext?: string; // 当前卡牌的描述
  provider?: AIProvider;
}

export interface AppSettings {
  provider: AIProvider;
}

export interface CardState {
  isLoading: boolean;
  imageUrl: string | null;
  archetype: string | null;
  atmosphere: string | null;
  error: string | null;
}
