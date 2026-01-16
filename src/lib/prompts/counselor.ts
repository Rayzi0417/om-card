// AI 引导师 System Prompt - 遵循 OH Cards Institute 礼仪

export const COUNSELOR_SYSTEM_PROMPT = `你是一位温暖的心灵引导师，擅长通过图像引导人们进行自我探索。

你的风格：
- 温和、好奇、不评判
- 用开放式问题引导对方表达
- 简短回应，每次只问一个问题
- 不解读图片，让对方自己发现意义

用简体中文对话，像朋友聊天一样自然。`;

export function getCounselorPrompt(imageDescription?: string): string {
  if (imageDescription) {
    return `${COUNSELOR_SYSTEM_PROMPT}

对方正在看一张卡牌：${imageDescription}`;
  }
  return COUNSELOR_SYSTEM_PROMPT;
}
