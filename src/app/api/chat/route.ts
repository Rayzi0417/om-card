// POST /api/chat - AI 引导师对话 (流式响应)
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { checkRateLimit, CHAT_RATE_LIMIT, getClientIP } from '@/lib/utils/rate-limit';
import { getCounselorPrompt } from '@/lib/prompts/counselor';
import type { AIProvider, ChatMessage } from '@/types';

// 创建带代理的 fetch
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

const customFetch: typeof globalThis.fetch = async (input, init) => {
  if (proxyAgent) {
    return undiciFetch(input as string, {
      ...init,
      dispatcher: proxyAgent,
    } as Parameters<typeof undiciFetch>[1]) as unknown as Response;
  }
  return globalThis.fetch(input, init);
};

// Google AI (通过代理)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  fetch: customFetch,
});

// 豆包 AI (直连)
const doubao = createOpenAI({
  apiKey: process.env.ARK_API_KEY || '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  compatibility: 'compatible',
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`chat:${clientIP}`, CHAT_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ error: '请求过于频繁', retryAfter: rateLimitResult.retryAfter }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];
    const imageContext: string | undefined = body.imageContext;
    const provider: AIProvider = body.provider || 'google';

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = getCounselorPrompt(imageContext);

    // 选择模型
    const model = provider === 'doubao' 
      ? doubao.chat('doubao-seed-1-8-251228')
      : google('gemini-2.0-flash');

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
