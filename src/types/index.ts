// Om Card 类型定义

export type AIProvider = 'google' | 'doubao';

// 卡组风格类型
export type DeckStyle = 'abstract' | 'figurative' | 'classic';

// V1.8: 游戏模式类型
export type GameMode = 'single' | 'flip';
export type FlipPhase = 'definition' | 'flipped';

// V1.8: Flip 模式卡牌状态
export interface FlipCardState {
  id: string;
  word: WordCard;
  imageUrl: string;
  promptKeywords: string[];
  isFlipped: boolean;  // 是否已翻开
  zone?: 'comfort' | 'discomfort' | null;  // 所属区域
}

// ============== V1.1 新增类型 ==============

/**
 * 文字卡数据
 */
export interface WordCard {
  en: string;
  cn: string;
}

/**
 * V1.1 抽牌响应 - 复合卡牌结构
 */
export interface DrawResponseV2 {
  cardId: string;
  word: WordCard;
  imageUrl: string;
  promptKeywords: string[];  // 用于传给 LLM 做上下文
}

/**
 * V1.1 卡牌状态 - 支持复合卡牌
 */
export interface CardStateV2 {
  isLoading: boolean;
  cardId: string | null;
  word: WordCard | null;
  imageUrl: string | null;
  promptKeywords: string[];
  error: string | null;
}

// ============== V1.0 兼容类型 ==============

export interface DrawRequest {
  provider?: AIProvider;
}

/** @deprecated 使用 DrawResponseV2 */
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
  imageContext?: string;
  word?: WordCard;           // V1.1: 文字卡上下文
  promptKeywords?: string[]; // V1.1: 图像关键词上下文
  provider?: AIProvider;
}

export interface AppSettings {
  provider: AIProvider;
}

/** @deprecated 使用 CardStateV2 */
export interface CardState {
  isLoading: boolean;
  imageUrl: string | null;
  archetype: string | null;
  atmosphere: string | null;
  error: string | null;
}
