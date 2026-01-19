// POST /api/draw - V1.1 复合卡牌生成
import { NextRequest, NextResponse } from 'next/server';
import { drawCardV2 } from '@/lib/prompts/generator';
import { checkRateLimit, DRAW_RATE_LIMIT, getClientIP } from '@/lib/utils/rate-limit';
import { generateImageWithGoogle } from '@/lib/ai-service/google';
import { generateImageWithDoubao } from '@/lib/ai-service/doubao';
import type { AIProvider, DrawResponseV2 } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 获取客户端 IP 并检查限流
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`draw:${clientIP}`, DRAW_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: '请求过于频繁，请稍后再试',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime)
          }
        }
      );
    }

    // 解析请求体
    let provider: AIProvider = 'google';
    try {
      const body = await request.json();
      if (body.provider === 'doubao') {
        provider = 'doubao';
      }
    } catch {
      // 使用默认 provider
    }

    // V1.1: 使用双随机池生成卡牌数据
    const cardData = drawCardV2();
    console.log('Drawing V1.1 card:', {
      word: cardData.word.en,
      keywords: cardData.promptKeywords
    });

    // 调用 AI 生成模糊内图
    let imageUrl: string;
    
    try {
      if (provider === 'doubao') {
        imageUrl = await generateImageWithDoubao(cardData.imagePrompt);
      } else {
        imageUrl = await generateImageWithGoogle(cardData.imagePrompt);
      }
    } catch (error) {
      console.error('Image generation error:', error);
      return NextResponse.json(
        { error: '图片生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    // V1.1: 新的响应结构
    const response: DrawResponseV2 = {
      cardId: crypto.randomUUID(),
      word: cardData.word,
      imageUrl,
      promptKeywords: cardData.promptKeywords
    };

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetTime)
      }
    });

  } catch (error) {
    console.error('Draw API error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
