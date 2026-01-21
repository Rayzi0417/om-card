// POST /api/chat - V2.0 AI 引导师对话 (流式响应)
// 支持 Mode A (单张抽卡)、Mode B (舒服区与不舒服区)、Mode C (英雄之旅)
// 支持多模态：AI 可以看到卡牌图像

import { NextRequest } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { checkRateLimit, CHAT_RATE_LIMIT, getClientIP } from '@/lib/utils/rate-limit';
import { getCounselorPromptV2, getFlipModePrompt, getHeroModePrompt, type GameMode, type FlipPhase } from '@/lib/prompts/counselor';
import type { AIProvider, ChatMessage, WordCard } from '@/types';
import fs from 'fs';
import path from 'path';

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
    const word: WordCard | undefined = body.word;
    const provider: AIProvider = body.provider || 'doubao';
    const imageUrl: string | undefined = body.imageUrl; // 卡牌图像 URL
    
    // V2.0: 新增模式和阶段参数
    const mode: GameMode = body.mode || 'single';
    const phase: FlipPhase | undefined = body.phase;
    const step: number | undefined = body.step; // Mode C: 英雄之旅步骤
    const storyLog: Array<{ step: number; answer: string }> = body.storyLog || []; // Mode C: 故事日志

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 计算当前对话轮次（用户消息数量）
    const currentTurnCount = messages.filter(m => m.role === 'user').length;

    // V2.0: 根据模式选择不同的 System Prompt
    let systemPrompt: string;
    
    if (mode === 'hero' && step !== undefined) {
      // Mode C: 英雄之旅
      systemPrompt = getHeroModePrompt(step, storyLog, currentTurnCount);
    } else if (mode === 'flip' && phase) {
      // Mode B: 舒服 VS. 不舒服
      systemPrompt = getFlipModePrompt(phase);
    } else {
      // Mode A: 单张抽卡 (默认)
      systemPrompt = getCounselorPromptV2(word, currentTurnCount);
    }

    // 选择模型
    // 如果有图像，优先使用 Google（多模态支持更好）
    // 豆包的多模态模型是 doubao-1-5-vision-pro-32k-250115
    const useVision = !!imageUrl;
    let model;
    
    if (useVision) {
      // 多模态：使用支持视觉的模型
      model = provider === 'google'
        ? google('gemini-2.0-flash')
        : doubao.chat('doubao-1-5-vision-pro-32k-250115');
    } else {
      // 纯文本
      model = provider === 'google' 
        ? google('gemini-2.0-flash')
        : doubao.chat('doubao-seed-1-8-251228');
    }

    // 构建多模态消息
    let aiMessages: CoreMessage[] = [];
    
    if (useVision && imageUrl) {
      // 获取图像数据
      let imageData: { type: 'image'; image: string } | { type: 'image'; image: URL } | null = null;
      
      if (imageUrl.startsWith('/cards/')) {
        // 本地图片：读取文件并转为 base64
        try {
          const imagePath = path.join(process.cwd(), 'public', imageUrl);
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
          imageData = { type: 'image', image: `data:${mimeType};base64,${base64Image}` };
        } catch (err) {
          console.error('读取本地图片失败:', err);
        }
      } else if (imageUrl.startsWith('data:')) {
        // 已经是 base64
        imageData = { type: 'image', image: imageUrl };
      } else if (imageUrl.startsWith('http')) {
        // 外部 URL
        imageData = { type: 'image', image: new URL(imageUrl) };
      }

      // 构建带图像的消息
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (i === 0 && msg.role === 'user' && imageData) {
          // 第一条用户消息附带图像
          aiMessages.push({
            role: 'user',
            content: [
              imageData,
              { type: 'text', text: msg.content + '\n\n（请根据这张卡牌图像的内容来引导对话）' }
            ]
          });
        } else {
          aiMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    } else {
      // 纯文本消息
      aiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
    }

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: aiMessages,
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
