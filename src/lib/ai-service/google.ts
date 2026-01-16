// Google AI 服务适配器 (Gemini)
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { getCounselorPrompt } from '../prompts/counselor';

// 创建 Google AI 实例
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// 创建代理 Agent
function getProxyAgent() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

/**
 * 使用 Gemini 生成图像
 * 注意：Gemini 2.0 Flash 支持原生图像生成
 */
export async function generateImageWithGoogle(prompt: string): Promise<string> {
  try {
    const proxyAgent = getProxyAgent();
    
    // 使用 Gemini 2.0 Flash 的图像生成能力
    const response = await undiciFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate an image: ${prompt}`
            }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        }),
        dispatcher: proxyAgent,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Image API error:', error);
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: {
              mimeType?: string;
              data?: string;
            };
          }>;
        };
      }>;
    };
    
    // 从响应中提取图像
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        // 返回 base64 图像数据 URL
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error('No image generated in response');
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
}

/**
 * 使用 Gemini 进行对话 (流式)
 */
export function chatWithGoogle(
  messages: { role: 'user' | 'assistant'; content: string }[],
  imageDescription?: string
) {
  const systemPrompt = getCounselorPrompt(imageDescription);
  
  return streamText({
    model: google('gemini-2.0-flash'),
    system: systemPrompt,
    messages: messages,
  });
}

/**
 * 使用 Gemini 进行单次对话 (非流式)
 */
export async function generateChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  imageDescription?: string
): Promise<string> {
  const systemPrompt = getCounselorPrompt(imageDescription);
  
  const { text } = await generateText({
    model: google('gemini-1.5-pro'),
    system: systemPrompt,
    messages: messages,
  });
  
  return text;
}
