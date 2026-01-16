// 随机 Prompt 生成器 - Om Card Oracle Engine

// 意象词库 (Archetypes) - 来自心理投射理论
const ARCHETYPES = [
  '门', '钥匙', '桥', '鸟', '阴影', '镜子', '迷宫',
  '远山', '空椅子', '枯树', '种子', '窗户', '阶梯', '洞穴',
  '河流', '月亮', '面具', '船', '花园', '塔', '井',
  '蜡烛', '信封', '时钟', '羽毛', '贝壳', '蝴蝶', '蜘蛛网',
  '沙漏', '灯笼', '风筝', '气球', '锚', '指南针', '地图',
  '书本', '钥匙孔', '裂缝', '影子', '倒影'
];

// 氛围词库 (Atmospheres)
const ATMOSPHERES = [
  '迷雾的', '金色的', '破碎的', '寂静的', '暴风雨前的',
  '温暖的', '模糊的', '深邃的', '晨光的', '黄昏的',
  '梦幻的', '神秘的', '宁静的', '忧郁的', '漂浮的',
  '褪色的', '朦胧的', '苍白的', '绚烂的', '孤独的',
  '被遗忘的', '永恒的', '流动的', '静止的', '遥远的'
];

/**
 * 随机选择数组中的一个元素
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 生成随机的意象和氛围组合
 */
export function generateRandomCombination() {
  const archetype = randomPick(ARCHETYPES);
  const atmosphere = randomPick(ATMOSPHERES);
  return { archetype, atmosphere };
}

/**
 * 生成符合 OH 卡学术风格的图像 Prompt
 */
export function generateImagePrompt(archetype: string, atmosphere: string): string {
  return `A beautiful naive watercolor painting of a ${atmosphere} ${archetype}. Artistic style similar to OH cards and therapeutic projection cards. Soft dreamlike quality, visible gentle brushstrokes, muted colors with subtle warm accents. Simple centered composition on cream/white background. Evocative, metaphoric, emotionally resonant. No text, no photorealism.`;
}

/**
 * 生成中文描述（用于 AI 对话上下文）- 简洁模糊，引发联想
 */
export function generateChineseDescription(archetype: string, atmosphere: string): string {
  return `${atmosphere}${archetype}`;
}

/**
 * 一键生成完整的抽牌数据
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
