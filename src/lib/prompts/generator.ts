// V1.1 随机 Prompt 生成器 - 双随机池系统
import wordsData from '@/lib/data/words.json';
import promptsData from '@/lib/data/prompts.json';
import type { WordCard } from '@/types';

// ============== 类型定义 ==============

interface WordEntry {
  id: number;
  en: string;
  cn: string;
}

interface CardDrawResult {
  word: WordCard;
  imagePrompt: string;
  promptKeywords: string[];
}

// ============== 工具函数 ==============

/**
 * 随机选择数组中的一个元素
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ============== 文字池 (Word Pool) ==============

const words: WordEntry[] = wordsData.words;

/**
 * 从文字库随机抽取一个词
 */
export function pickRandomWord(): WordCard {
  const word = randomPick(words);
  return {
    en: word.en,
    cn: word.cn
  };
}

// ============== 图像提示词池 (Image Prompt Pool) ==============

const archetypes: string[] = promptsData.archetypes;
const colorPalettes: string[] = promptsData.colorPalettes;
const atmospheres: string[] = promptsData.atmospheres;
const promptTemplate: string = promptsData.promptTemplate;
const negativePrompt: string = promptsData.negativePrompt;

/**
 * 生成模糊内图的提示词
 * V1.1 关键变更：强制 AI 画得"模糊"、"填满画布"
 */
export function generateBlurryImagePrompt(): {
  prompt: string;
  negativePrompt: string;
  keywords: string[];
} {
  const archetype = randomPick(archetypes);
  const colorPalette = randomPick(colorPalettes);
  const atmosphere = randomPick(atmospheres);
  
  // 填充模板
  const prompt = promptTemplate
    .replace('{archetype}', archetype)
    .replace('{colorPalette}', colorPalette)
    .replace('{atmosphere}', atmosphere);
  
  return {
    prompt,
    negativePrompt,
    keywords: [archetype, atmosphere, colorPalette.split(' and ')[0]]
  };
}

// ============== V1.1 主接口 ==============

/**
 * V1.1 一键生成完整的抽牌数据
 * 返回独立的 word + imagePrompt 组合
 */
export function drawCardV2(): CardDrawResult {
  // 独立随机：文字和图像互不关联
  const word = pickRandomWord();
  const { prompt, keywords } = generateBlurryImagePrompt();
  
  return {
    word,
    imagePrompt: prompt,
    promptKeywords: keywords
  };
}

// ============== V1.0 兼容接口 (已弃用) ==============

// 旧版意象词库 (Archetypes) - 保留用于兼容
const LEGACY_ARCHETYPES = [
  '门', '钥匙', '桥', '鸟', '阴影', '镜子', '迷宫',
  '远山', '空椅子', '枯树', '种子', '窗户', '阶梯', '洞穴',
  '河流', '月亮', '面具', '船', '花园', '塔', '井',
  '蜡烛', '信封', '时钟', '羽毛', '贝壳', '蝴蝶', '蜘蛛网',
  '沙漏', '灯笼', '风筝', '气球', '锚', '指南针', '地图',
  '书本', '钥匙孔', '裂缝', '影子', '倒影'
];

// 旧版氛围词库 (Atmospheres)
const LEGACY_ATMOSPHERES = [
  '迷雾的', '金色的', '破碎的', '寂静的', '暴风雨前的',
  '温暖的', '模糊的', '深邃的', '晨光的', '黄昏的',
  '梦幻的', '神秘的', '宁静的', '忧郁的', '漂浮的',
  '褪色的', '朦胧的', '苍白的', '绚烂的', '孤独的',
  '被遗忘的', '永恒的', '流动的', '静止的', '遥远的'
];

/**
 * @deprecated V1.0 兼容 - 生成随机的意象和氛围组合
 */
export function generateRandomCombination() {
  const archetype = randomPick(LEGACY_ARCHETYPES);
  const atmosphere = randomPick(LEGACY_ATMOSPHERES);
  return { archetype, atmosphere };
}

/**
 * @deprecated V1.0 兼容 - 生成图像 Prompt
 */
export function generateImagePrompt(archetype: string, atmosphere: string): string {
  return `A beautiful naive watercolor painting of a ${atmosphere} ${archetype}. Artistic style similar to OH cards and therapeutic projection cards. Soft dreamlike quality, visible gentle brushstrokes, muted colors with subtle warm accents. Simple centered composition on cream/white background. Evocative, metaphoric, emotionally resonant. No text, no photorealism.`;
}

/**
 * @deprecated V1.0 兼容 - 生成中文描述
 */
export function generateChineseDescription(archetype: string, atmosphere: string): string {
  return `${atmosphere}${archetype}`;
}

/**
 * @deprecated V1.0 兼容 - 使用 drawCardV2() 替代
 */
export function drawCard() {
  const { archetype, atmosphere } = generateRandomCombination();
  const prompt = generateImagePrompt(archetype, atmosphere);
  const description = generateChineseDescription(archetype, atmosphere);
  
  return {
    archetype,
    atmosphere,
    prompt,
    description
  };
}
