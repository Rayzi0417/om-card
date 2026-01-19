// POST /api/chat - V1.1 AI 引导师对话 (流式响应)
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { checkRateLimit, CHAT_RATE_LIMIT, getClientIP } from '@/lib/utils/rate-limit';
import { getCounselorPromptV2, getCounselorPrompt } from '@/lib/prompts/counselor';
import type { AIProvider, ChatMessage, WordCard } from '@/types';

// Google AI
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// 豆包 AI
const doubao = createOpenAI({
  apiKey: process.env.ARK_API_KEY || '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
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
    const word: WordCard | undefined = body.word;           // V1.1: 文字卡
    const imageContext: string | undefined = body.imageContext;  // 兼容旧版
    const provider: AIProvider = body.provider || 'doubao';

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // V1.1: 使用新的洁净语言 Prompt，优先使用 word
    const systemPrompt = word 
      ? getCounselorPromptV2(word)
      : getCounselorPrompt(imageContext);

    // 选择模型（默认豆包）
    const model = provider === 'google' 
      ? google('gemini-2.0-flash')
      : doubao.chat('doubao-seed-1-8-251228');

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
