// V1.2 随机 Prompt 生成器 - 双随机池系统 + OH卡风格优化
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

function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomPickN<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ============== 文字池 (Word Pool) ==============
// 88个 OH Cards 经典词汇

// 88张 OH Cards 官方字词卡 + 空白卡
const words: WordEntry[] = [
  { id: 0, en: "", cn: "" },  // 空白卡
  { id: 1, en: "FEELINGS", cn: "感情" },
  { id: 2, en: "LONELINESS", cn: "孤独" },
  { id: 3, en: "ANGER", cn: "生气" },
  { id: 4, en: "ANXIETY", cn: "焦虑" },
  { id: 5, en: "APOLOGY", cn: "道歉" },
  { id: 6, en: "APPEARANCE", cn: "外表" },
  { id: 7, en: "ATTACK", cn: "攻击" },
  { id: 8, en: "ATTRACTION", cn: "吸引" },
  { id: 9, en: "BEGINNING", cn: "开始" },
  { id: 10, en: "PRAISE", cn: "夸赞" },
  { id: 11, en: "BOREDOM", cn: "厌烦" },
  { id: 12, en: "BOSS", cn: "上司" },
  { id: 13, en: "CHANGE", cn: "改变" },
  { id: 14, en: "CHILD", cn: "孩童" },
  { id: 15, en: "HUMOR", cn: "诙谐" },
  { id: 16, en: "COMPULSION", cn: "强迫" },
  { id: 17, en: "COMPLIANCE", cn: "顺应" },
  { id: 18, en: "CHAOS", cn: "混乱" },
  { id: 19, en: "CYCLE", cn: "循环" },
  { id: 20, en: "DANGER", cn: "危险" },
  { id: 21, en: "DEPENDENCE", cn: "依赖" },
  { id: 22, en: "DESTRUCTION", cn: "破坏" },
  { id: 23, en: "EMBARRASSMENT", cn: "丢脸" },
  { id: 24, en: "DISLIKE", cn: "不喜欢" },
  { id: 25, en: "DREAM", cn: "梦想" },
  { id: 26, en: "ELIMINATION", cn: "消除" },
  { id: 27, en: "AWKWARDNESS", cn: "尴尬" },
  { id: 28, en: "EROTICISM", cn: "色情" },
  { id: 29, en: "EXPERT", cn: "专家" },
  { id: 30, en: "FAILURE", cn: "失败" },
  { id: 31, en: "FANTASY", cn: "幻想" },
  { id: 32, en: "FATHER", cn: "父亲" },
  { id: 33, en: "FEAR", cn: "恐惧" },
  { id: 34, en: "FIRMNESS", cn: "坚定" },
  { id: 35, en: "GAME", cn: "游戏" },
  { id: 36, en: "GIVING", cn: "付出" },
  { id: 37, en: "ADVANCEMENT", cn: "前进" },
  { id: 38, en: "GRIEF", cn: "哀伤" },
  { id: 39, en: "GUILT", cn: "罪恶感" },
  { id: 40, en: "HABIT", cn: "习惯" },
  { id: 41, en: "HATRED", cn: "憎恨" },
  { id: 42, en: "HESITATION", cn: "犹豫" },
  { id: 43, en: "CONCEALMENT", cn: "隐藏" },
  { id: 44, en: "HARM", cn: "伤害" },
  { id: 45, en: "HOME", cn: "家" },
  { id: 46, en: "HOMOSEXUALITY", cn: "同性恋" },
  { id: 47, en: "HOPE", cn: "希望" },
  { id: 48, en: "HUMILIATION", cn: "羞辱" },
  { id: 49, en: "JOY", cn: "喜悦" },
  { id: 50, en: "LAUGHTER", cn: "欢笑" },
  { id: 51, en: "THREAT", cn: "恐吓" },
  { id: 52, en: "LETTING GO", cn: "放开" },
  { id: 53, en: "MASCULINITY", cn: "男性" },
  { id: 54, en: "LIES", cn: "谎言" },
  { id: 55, en: "MOTHER", cn: "母亲" },
  { id: 56, en: "NUDITY", cn: "裸体" },
  { id: 57, en: "DEBT", cn: "亏欠" },
  { id: 58, en: "PAIN", cn: "痛苦" },
  { id: 59, en: "POSTURE", cn: "姿态" },
  { id: 60, en: "POWER PLAY", cn: "权利游戏" },
  { id: 61, en: "LOATHING", cn: "憎恶" },
  { id: 62, en: "RESISTANCE", cn: "抗拒" },
  { id: 63, en: "RETREAT", cn: "退省" },
  { id: 64, en: "STUBBORNNESS", cn: "固执" },
  { id: 65, en: "HOSTILITY", cn: "敌对" },
  { id: 66, en: "DECAY", cn: "腐朽" },
  { id: 67, en: "SELF-SABOTAGE", cn: "弄巧成拙" },
  { id: 68, en: "SHAME", cn: "羞愧" },
  { id: 69, en: "SHARING", cn: "分享" },
  { id: 70, en: "SHOULD", cn: "应该" },
  { id: 71, en: "SLAVERY", cn: "奴隶" },
  { id: 72, en: "STOPPING", cn: "停止" },
  { id: 73, en: "STRANGER", cn: "陌生人" },
  { id: 74, en: "STUPIDITY", cn: "愚蠢" },
  { id: 75, en: "SUCCESS", cn: "成功" },
  { id: 76, en: "REPRESSION", cn: "压抑" },
  { id: 77, en: "PREDATION", cn: "掠夺" },
  { id: 78, en: "INTIMIDATION", cn: "威胁" },
  { id: 79, en: "UGLINESS", cn: "丑陋" },
  { id: 80, en: "VICTIM", cn: "受害者" },
  { id: 81, en: "BETRAYAL", cn: "违背" },
  { id: 82, en: "WAITING", cn: "等候" },
  { id: 83, en: "EXHAUSTION", cn: "疲惫" },
  { id: 84, en: "INTELLIGENCE", cn: "聪明" },
  { id: 85, en: "WOMAN", cn: "女人" },
  { id: 86, en: "WONDER", cn: "奇妙" },
  { id: 87, en: "MISTAKE", cn: "错误" },
  { id: 88, en: "LOVE", cn: "爱情" }
];

export function pickRandomWord(): WordCard {
  const word = randomPick(words);
  return { en: word.en, cn: word.cn };
}

// ============== 卡组类型 ==============

export type DeckStyle = 'abstract' | 'figurative';

// ============== 抽象卡组 (Abstract Deck) ==============

const abstractArchetypes: string[] = [
  "floating feathers",
  "scattered leaves",
  "rippling water",
  "swirling clouds",
  "distant mountains",
  "winding path",
  "tangled threads",
  "falling petals",
  "rising smoke",
  "flickering flame",
  "melting ice",
  "growing roots",
  "still pond",
  "cracked earth",
  "dancing shadows",
  "glowing orb",
  "fading footprints",
  "unraveling rope",
  "suspended droplets",
  "ink diffusing in water"
];

const abstractColorPalettes: string[] = [
  "warm ochre and muted rose",
  "cool blue and misty grey",
  "soft lavender and pale gold",
  "earthy brown and sage green",
  "dusty pink and cream white",
  "deep indigo and silver",
  "sunset orange and twilight purple",
  "forest green and amber",
  "stormy grey and electric blue",
  "burnt sienna and soft teal"
];

const abstractAtmospheres: string[] = [
  "serene", "melancholic", "ethereal", "turbulent", "contemplative",
  "mysterious", "nostalgic", "hopeful", "haunting", "tranquil"
];

const abstractPromptTemplate = "A specialized therapeutic art texture. Abstract watercolor wash, indistinct shapes suggesting {archetype}, misty {atmosphere} atmosphere, {colorPalette}. Full bleed composition filling entire canvas, no borders, no margins, no text, no sharp details. Style: naive art, Rorschach inkblot test aesthetic, soft blurred edges, dreamlike and ambiguous.";

// ============== 具象卡组 V3 (Figurative Deck - David Hockney Style) ==============
// 明亮、鲜艳、阳光、扁平化 - 告别阴郁，拥抱阳光！

// 风格修饰词 - David Hockney 美学
const styleModifiers: string[] = [
  "David Hockney style",
  "naive art aesthetic",
  "vibrant acrylic colors",
  "flat perspective",
  "clear afternoon lighting",
  "playful composition",
  "pop art influence",
  "sunny and airy",
  "clean lines",
  "pastel and bright tones"
];

// 负面提示词 - 防止阴暗恐怖画面
const figurativeNegativePrompts: string[] = [
  "text", "words", "letters", "signature",
  "dark", "horror", "scary", "creepy", "ghostly", "shadows", "nightmare", "gothic", "grim",
  "photorealistic", "highly detailed", "complex", "cluttered",
  "blur", "foggy", "murky", "muddy colors"
];

// 氛围词库 - 阳光明媚
const figurativeAtmospheres: string[] = [
  "sunny", "breezy", "clear", "warm", "peaceful",
  "vibrant", "calm", "fresh", "stark but bright", "playful"
];

// 原型模板 - 三种类别 (David Hockney 风格)
interface ArchetypeTemplate {
  category: string;
  template: string;
}

const archetypeTemplates: ArchetypeTemplate[] = [
  {
    category: "Bright Isolation",
    template: "A painting in David Hockney style of [Subject], vibrant colors, flat perspective, sunny atmosphere, simple and clean composition."
  },
  {
    category: "Everyday Metaphor",
    template: "A naive art painting of [Subject], clear lighting, distinct shapes, bright blue and green tones, peaceful but provocative."
  },
  {
    category: "Relational Space",
    template: "A colorful painting depicting [Subject], emphasizing the space between objects, flat colors, minimalism, emotional resonance without darkness."
  }
];

// 主题库 - 明亮生活化意象 (告别鬼影！)
const subjects: string[] = [
  // 1. 人像 (更自然，少鬼影)
  "a person sitting by a blue swimming pool",
  "two chairs on a green lawn",
  "a figure looking out a bright window",
  "a back view of someone walking on a red road",
  "two people sitting far apart on a yellow bench",
  "a diver jumping into water",
  "a person reading in a sunlit room",
  "crowd of colorful dots representing people",
  "a hand holding a bright flower",

  // 2. 物品与隐喻 (生活化、波普化)
  "a bright red key on a blue table",
  "an open door leading to a green garden",
  "a vase with one yellow tulip",
  "a colorful ladder leaning against a wall",
  "a pair of glasses on a desk",
  "a neatly made bed",
  "a bird cage with the door open",
  "a jigsaw puzzle on the floor",
  "a telephone on a side table",
  "a raincoat hanging on a hook",

  // 3. 自然与场景 (风景明信片感)
  "a road disappearing into bright hills",
  "a single tree with green leaves",
  "a bridge over calm blue water",
  "white clouds in a clear sky",
  "a path through a colorful forest",
  "a house with a red roof",
  "a crossroads under the sun",
  "waves crashing on a yellow beach",
  "a mountain peak in pink light"
];

/**
 * 生成具象卡组提示词 (V2 OH卡风格)
 */
function generateFigurativePromptV2(): {
  prompt: string;
  negativePrompt: string;
  keywords: string[];
} {
  // 1. 随机选择模板
  const template = randomPick(archetypeTemplates);
  
  // 2. 随机选择主题和氛围
  const subject = randomPick(subjects);
  const atmosphere = randomPick(figurativeAtmospheres);
  
  // 3. 随机选择 2-3 个风格修饰词
  const selectedModifiers = randomPickN(styleModifiers, 2 + Math.floor(Math.random() * 2));
  
  // 4. 填充模板
  let prompt = template.template
    .replace('[Subject]', subject)
    .replace('[Atmosphere]', atmosphere);
  
  // 5. 追加风格修饰词
  prompt += ` Style: ${selectedModifiers.join(', ')}.`;
  
  // 6. 组合负面提示词
  const negativePrompt = figurativeNegativePrompts.join(', ');
  
  // 7. 提取关键词用于显示
  const subjectKeyword = subject.split(' ').slice(-2).join(' ');
  
  return {
    prompt,
    negativePrompt,
    keywords: [subjectKeyword, atmosphere, template.category]
  };
}

/**
 * 生成抽象卡组提示词
 */
function generateAbstractPrompt(): {
  prompt: string;
  negativePrompt: string;
  keywords: string[];
} {
  const archetype = randomPick(abstractArchetypes);
  const colorPalette = randomPick(abstractColorPalettes);
  const atmosphere = randomPick(abstractAtmospheres);
  
  const prompt = abstractPromptTemplate
    .replace('{archetype}', archetype)
    .replace('{colorPalette}', colorPalette)
    .replace('{atmosphere}', atmosphere);
  
  const negativePrompt = "watermark, signature, logo, AI generated, text, letters, words, writing, frames, borders, white background, realistic, sharp details, photorealistic, clear edges, margins, padding, copyright";
  
  return {
    prompt,
    negativePrompt,
    keywords: [archetype, atmosphere]
  };
}

// ============== 主接口 ==============

export function generateImagePromptV2(deckStyle: DeckStyle = 'abstract'): {
  prompt: string;
  negativePrompt: string;
  keywords: string[];
} {
  if (deckStyle === 'figurative') {
    return generateFigurativePromptV2();
  }
  return generateAbstractPrompt();
}

// 兼容旧接口
export function generateBlurryImagePrompt() {
  return generateImagePromptV2('abstract');
}

interface CardDrawResultV2 extends CardDrawResult {
  negativePrompt: string;
  deckStyle: DeckStyle;
}

/**
 * V1.2 一键生成完整的抽牌数据
 */
export function drawCardV2(deckStyle: DeckStyle = 'abstract'): CardDrawResultV2 {
  const word = pickRandomWord();
  const { prompt, negativePrompt, keywords } = generateImagePromptV2(deckStyle);
  
  return {
    word,
    imagePrompt: prompt,
    negativePrompt,
    promptKeywords: keywords,
    deckStyle
  };
}

// ============== V1.0 兼容接口 (已弃用) ==============

const LEGACY_ARCHETYPES = [
  '门', '钥匙', '桥', '鸟', '阴影', '镜子', '迷宫',
  '远山', '空椅子', '枯树', '种子', '窗户', '阶梯', '洞穴'
];

const LEGACY_ATMOSPHERES = [
  '迷雾的', '金色的', '破碎的', '寂静的', '暴风雨前的',
  '温暖的', '模糊的', '深邃的', '晨光的', '黄昏的'
];

/** @deprecated */
export function generateRandomCombination() {
  return { archetype: randomPick(LEGACY_ARCHETYPES), atmosphere: randomPick(LEGACY_ATMOSPHERES) };
}

/** @deprecated */
export function generateImagePrompt(archetype: string, atmosphere: string): string {
  return `A beautiful naive watercolor painting of a ${atmosphere} ${archetype}.`;
}

/** @deprecated */
export function generateChineseDescription(archetype: string, atmosphere: string): string {
  return `${atmosphere}${archetype}`;
}

/** @deprecated */
export function drawCard() {
  const { archetype, atmosphere } = generateRandomCombination();
  return { archetype, atmosphere, prompt: generateImagePrompt(archetype, atmosphere), description: generateChineseDescription(archetype, atmosphere) };
}
