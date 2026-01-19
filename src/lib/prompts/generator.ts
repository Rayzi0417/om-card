// V1.1 随机 Prompt 生成器 - 双随机池系统
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
// 88个 OH Cards 经典词汇

const words: WordEntry[] = [
  { id: 1, en: "LOVE", cn: "爱" },
  { id: 2, en: "FEAR", cn: "恐惧" },
  { id: 3, en: "JOY", cn: "喜悦" },
  { id: 4, en: "ANGER", cn: "愤怒" },
  { id: 5, en: "SADNESS", cn: "悲伤" },
  { id: 6, en: "HOPE", cn: "希望" },
  { id: 7, en: "GUILT", cn: "愧疚" },
  { id: 8, en: "SHAME", cn: "羞耻" },
  { id: 9, en: "PRIDE", cn: "骄傲" },
  { id: 10, en: "PEACE", cn: "平静" },
  { id: 11, en: "LONGING", cn: "渴望" },
  { id: 12, en: "TRUST", cn: "信任" },
  { id: 13, en: "DOUBT", cn: "怀疑" },
  { id: 14, en: "COURAGE", cn: "勇气" },
  { id: 15, en: "DESIRE", cn: "欲望" },
  { id: 16, en: "FATHER", cn: "父亲" },
  { id: 17, en: "MOTHER", cn: "母亲" },
  { id: 18, en: "CHILD", cn: "孩子" },
  { id: 19, en: "FRIEND", cn: "朋友" },
  { id: 20, en: "STRANGER", cn: "陌生人" },
  { id: 21, en: "SELF", cn: "自我" },
  { id: 22, en: "SHADOW", cn: "阴影" },
  { id: 23, en: "FAMILY", cn: "家庭" },
  { id: 24, en: "LOVER", cn: "爱人" },
  { id: 25, en: "ENEMY", cn: "敌人" },
  { id: 26, en: "TEACHER", cn: "老师" },
  { id: 27, en: "BODY", cn: "身体" },
  { id: 28, en: "SOUL", cn: "灵魂" },
  { id: 29, en: "HEART", cn: "心" },
  { id: 30, en: "MIND", cn: "头脑" },
  { id: 31, en: "STOP", cn: "停" },
  { id: 32, en: "GO", cn: "走" },
  { id: 33, en: "WAIT", cn: "等待" },
  { id: 34, en: "RUN", cn: "奔跑" },
  { id: 35, en: "HIDE", cn: "隐藏" },
  { id: 36, en: "SEEK", cn: "寻找" },
  { id: 37, en: "GIVE", cn: "给予" },
  { id: 38, en: "TAKE", cn: "索取" },
  { id: 39, en: "CREATE", cn: "创造" },
  { id: 40, en: "DESTROY", cn: "毁灭" },
  { id: 41, en: "HOLD", cn: "握住" },
  { id: 42, en: "RELEASE", cn: "放手" },
  { id: 43, en: "SPEAK", cn: "诉说" },
  { id: 44, en: "SILENCE", cn: "沉默" },
  { id: 45, en: "LISTEN", cn: "倾听" },
  { id: 46, en: "LOST", cn: "迷失" },
  { id: 47, en: "FOUND", cn: "被找到" },
  { id: 48, en: "ALONE", cn: "孤独" },
  { id: 49, en: "TOGETHER", cn: "相聚" },
  { id: 50, en: "FREE", cn: "自由" },
  { id: 51, en: "TRAPPED", cn: "困住" },
  { id: 52, en: "EMPTY", cn: "空虚" },
  { id: 53, en: "FULL", cn: "充盈" },
  { id: 54, en: "BROKEN", cn: "破碎" },
  { id: 55, en: "WHOLE", cn: "完整" },
  { id: 56, en: "WEAK", cn: "脆弱" },
  { id: 57, en: "STRONG", cn: "坚强" },
  { id: 58, en: "SAFE", cn: "安全" },
  { id: 59, en: "DANGER", cn: "危险" },
  { id: 60, en: "OPEN", cn: "敞开" },
  { id: 61, en: "CLOSED", cn: "关闭" },
  { id: 62, en: "PAST", cn: "过去" },
  { id: 63, en: "FUTURE", cn: "未来" },
  { id: 64, en: "NOW", cn: "此刻" },
  { id: 65, en: "NEVER", cn: "永不" },
  { id: 66, en: "ALWAYS", cn: "永远" },
  { id: 67, en: "BEGINNING", cn: "开始" },
  { id: 68, en: "END", cn: "结束" },
  { id: 69, en: "CHANGE", cn: "改变" },
  { id: 70, en: "STAY", cn: "停留" },
  { id: 71, en: "HOME", cn: "家" },
  { id: 72, en: "ROAD", cn: "路" },
  { id: 73, en: "DOOR", cn: "门" },
  { id: 74, en: "WINDOW", cn: "窗" },
  { id: 75, en: "BRIDGE", cn: "桥" },
  { id: 76, en: "WALL", cn: "墙" },
  { id: 77, en: "EDGE", cn: "边缘" },
  { id: 78, en: "CENTER", cn: "中心" },
  { id: 79, en: "LIGHT", cn: "光" },
  { id: 80, en: "DARK", cn: "黑暗" },
  { id: 81, en: "DREAM", cn: "梦" },
  { id: 82, en: "REALITY", cn: "现实" },
  { id: 83, en: "SECRET", cn: "秘密" },
  { id: 84, en: "TRUTH", cn: "真相" },
  { id: 85, en: "LIFE", cn: "生命" },
  { id: 86, en: "DEATH", cn: "死亡" },
  { id: 87, en: "BREATH", cn: "呼吸" },
  { id: 88, en: "CHOICE", cn: "选择" }
];

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

const archetypes: string[] = [
  "floating feathers",
  "scattered leaves",
  "rippling water",
  "swirling clouds",
  "distant mountains",
  "winding path",
  "empty chair",
  "open doorway",
  "broken mirror",
  "tangled threads",
  "falling petals",
  "rising smoke",
  "flickering flame",
  "melting ice",
  "growing roots",
  "flying birds",
  "still pond",
  "cracked earth",
  "blooming flower",
  "withered tree",
  "spiral staircase",
  "hidden cave",
  "crossing bridges",
  "scattered stones",
  "dancing shadows",
  "glowing orb",
  "fading footprints",
  "nested boxes",
  "unraveling rope",
  "suspended droplets"
];

const colorPalettes: string[] = [
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

const atmospheres: string[] = [
  "serene",
  "melancholic",
  "ethereal",
  "turbulent",
  "contemplative",
  "mysterious",
  "nostalgic",
  "hopeful",
  "haunting",
  "tranquil"
];

const promptTemplate = "A specialized therapeutic art texture. Abstract watercolor wash, indistinct shapes suggesting {archetype}, misty {atmosphere} atmosphere, {colorPalette}. Full bleed composition filling entire canvas, no borders, no margins, no text, no sharp details. Style: naive art, Rorschach inkblot test aesthetic, soft blurred edges, dreamlike and ambiguous.";

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
  
  const negativePrompt = "text, letters, words, writing, frames, borders, white background, realistic, sharp details, photorealistic, clear edges, defined shapes, margins, padding";
  
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
