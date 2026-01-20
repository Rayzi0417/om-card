// 字节跳动豆包 AI 服务适配器
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { getCounselorPrompt } from '../prompts/counselor';

// 豆包使用 OpenAI 兼容接口
const doubao = createOpenAI({
  apiKey: process.env.ARK_API_KEY || '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

/**
 * 使用豆包生成图像
 * 豆包图像生成使用火山引擎的独立 API
 * @param prompt - 正向提示词
 * @param negativePrompt - 负向提示词（可选）
 */
export async function generateImageWithDoubao(prompt: string, negativePrompt?: string): Promise<string> {
  const apiKey = process.env.ARK_API_KEY;
  
  if (!apiKey) {
    throw new Error('ARK_API_KEY not configured');
  }

  // 将 negative prompt 添加到主 prompt 中
  let fullPrompt = prompt;
  if (negativePrompt) {
    fullPrompt += ` DO NOT include: ${negativePrompt}`;
  }

  try {
    // 火山引擎图像生成 API
    // 使用 b64_json 格式返回，避免外部 CDN URL 的跨域问题
    // 注意：此模型要求图片尺寸至少 1920x1920
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-5-251128',
        prompt: fullPrompt,
        size: '1920x1920',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Doubao Image API error:', error);
      throw new Error(`Doubao API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data?.[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    
    if (data.data?.[0]?.url) {
      return data.data[0].url;
    }
    
    throw new Error('No image in response');
  } catch (error) {
    console.error('Doubao image generation failed:', error);
    throw error;
  }
}

/**
 * 使用豆包进行对话 (流式)
 */
export function chatWithDoubao(
  messages: { role: 'user' | 'assistant'; content: string }[],
  imageDescription?: string
) {
  const systemPrompt = getCounselorPrompt(imageDescription);
  
  return streamText({
    model: doubao('doubao-seed-1-8-251228'),
    system: systemPrompt,
    messages: messages,
  });
}

/**
 * 使用豆包进行单次对话 (非流式)
 */
export async function generateDoubaoResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  imageDescription?: string
): Promise<string> {
  const systemPrompt = getCounselorPrompt(imageDescription);
  
  const { text } = await generateText({
    model: doubao('doubao-seed-1-8-251228'),
    system: systemPrompt,
    messages: messages,
  });
  
  return text;
}
