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

// ============== 经典卡牌组 ==============
// 88张原版 OH 卡图像，存放在 /cards/classic/ 目录
// 注意：000.jpg 是卡牌背面，不参与抽取

/**
 * 获取经典卡牌（图片 + 随机文字）
 * @param excludeIds - 要排除的卡牌ID（避免重复）
 * @returns 卡牌数据
 */
export function getClassicCard(excludeIds: number[] = []): {
  id: number;
  imageUrl: string;
  word: WordCard;
} {
  // 可用的卡牌ID范围：1-88（排除0空白卡和已使用的）
  const availableIds = Array.from({ length: 88 }, (_, i) => i + 1)
    .filter(id => !excludeIds.includes(id));
  
  if (availableIds.length === 0) {
    // 如果没有可用的，重新从全部中选
    const id = Math.floor(Math.random() * 88) + 1;
    const word = words.find(w => w.id === id) || words[1];
    return {
      id,
      imageUrl: `/cards/classic/${id}.jpg`,
      word: { en: word.en, cn: word.cn }
    };
  }
  
  const id = availableIds[Math.floor(Math.random() * availableIds.length)];
  const word = words.find(w => w.id === id) || words[1];
  
  return {
    id,
    imageUrl: `/cards/classic/${id}.jpg`,
    word: { en: word.en, cn: word.cn }
  };
}

/**
 * 批量获取不重复的经典卡牌
 * @param count - 需要的卡牌数量
 * @returns 卡牌数组
 */
export function getClassicCards(count: number): Array<{
  id: number;
  imageUrl: string;
  word: WordCard;
}> {
  const cards: Array<{ id: number; imageUrl: string; word: WordCard }> = [];
  const usedIds: number[] = [];
  
  for (let i = 0; i < count; i++) {
    const card = getClassicCard(usedIds);
    cards.push(card);
    usedIds.push(card.id);
  }
  
  return cards;
}

// ============== 卡组类型 ==============

export type DeckStyle = 'abstract' | 'figurative' | 'classic';

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

// ============== 具象卡组 V7.1 (Figurative Deck - Masters Fusion Edition) ==============
// 霍克尼 + 高更 + 杜飞 + 马蒂斯 四大师融合风格
// 模糊五官但可辨认，色彩丰富，便于投射

// 风格修饰词 - 四大师融合风格
const styleModifiers: string[] = [
  "naive watercolor style",
  "style of Raoul Dufy and Henri Matisse",
  "Paul Gauguin color palette",
  "David Hockney composition",
  "visible brushstrokes",
  "expressive colors",
  "rough texture",
  "psychological symbolism",
  "loose wash",
  "hand-painted aesthetic",
  "blurred facial features",
  "ambiguous expressions"
];

// 负面提示词 - 禁止清晰表情、黑白、恐怖
const figurativeNegativePrompts: string[] = [
  "text", "words", "photorealistic", "3d", "shiny",
  "horror", "ghostly", "scary",
  "overly dark", "black and white", "monochrome",
  "low contrast", "muddy",
  "detailed facial expression", "clear eyes", "distinct facial features",
  "portrait photography", "hyperrealistic face"
];

// 氛围词库 - 40% 暖/亮，40% 中性，20% 负面
const figurativeAtmospheres: string[] = [
  // 阳 (40%) - 暖色调氛围
  "playful", "sunny", "calm", "peaceful", "vibrant", "warm",
  // 中 (40%) - 中性色调氛围
  "silent", "dreamy", "misty", "ambiguous", "hazy",
  // 阴 (20%) - 用色彩表达负面情绪
  "chaotic", "tense", "melancholic"
];

// 原型模板 - 三种类别 (大师融合风格)
interface ArchetypeTemplate {
  category: string;
  template: string;
}

const archetypeTemplates: ArchetypeTemplate[] = [
  {
    category: "Interpersonal (Masters Fusion)",
    template: "A naive watercolor painting of [Subject]. Combining Matisse's bold colors, Gauguin's warm palette, and Hockney's flat composition. The figures have blurred facial features with ambiguous expressions, allowing for projection. The mood is [Atmosphere]."
  },
  {
    category: "Metaphor (Colorful)",
    template: "A symbolic painting of [Subject] in the style of Raoul Dufy and Paul Gauguin. Vibrant warm colors, loose brushwork, soft edges, evocative and dreamlike."
  },
  {
    category: "Scene (Atmospheric)",
    template: "An expressive landscape featuring [Subject]. Hockney-style composition with Dufy's loose wash, capturing a psychological state of [Atmosphere] through rich expressive colors."
  }
];

// 主题库 - 阴阳平衡的心理意象
const subjects: string[] = [
  // --- 阴 (Yin): 冲突、压抑、恐惧、丧失 ---
  "two people arguing but no sound",
  "a person curling up in a corner",
  "a heavy stone pressing down on a flower",
  "a figure trapped inside a glass jar",
  "a rope about to break",
  "a dark hallway with no end",
  "a mask lying on the floor, broken",
  "a person standing on the edge of a cliff",
  "hands tied together",
  "a drowning figure reaching up",
  "a wall separating two people",
  "withered flowers in a vase",
  "shadows looming over a small figure",
  "a bird with a broken wing",
  "spilled dark liquid",

  // --- 阳 (Yang): 希望、连接、力量、生长 ---
  "sunlight breaking through dark clouds",
  "hands holding a small light",
  "a sturdy bridge crossing a chasm",
  "a green sprout in dry soil",
  "two figures hugging tightly",
  "a bird flying free into the sky",
  "an open door with light coming out",
  "a ladder reaching upwards",
  "a peaceful garden bench",
  "a key that fits a lock",
  "a clear path forward",
  "roots of a tree going deep",
  "a mirror reflecting a smile",

  // --- 中性 (Neutral): 等待、迷茫、空无、日常 ---
  "an empty chair in an empty room",
  "a clock without hands",
  "fog covering a road",
  "a closed book on a table",
  "a person standing at a crossroads",
  "reflection in water",
  "a suitcase packed by the door",
  "a window looking out at nothing",
  "footprints disappearing",
  "a generic silhouette walking away",
  "distant mountains",
  "a floating feather",
  "a locked box",
  "static noise on a screen"
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
