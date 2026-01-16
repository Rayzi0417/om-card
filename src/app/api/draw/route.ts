// POST /api/draw - 生成卡牌图片
import { NextRequest, NextResponse } from 'next/server';
import { drawCard } from '@/lib/prompts/generator';
import { checkRateLimit, DRAW_RATE_LIMIT, getClientIP } from '@/lib/utils/rate-limit';
import { generateImageWithGoogle } from '@/lib/ai-service/google';
import { generateImageWithDoubao } from '@/lib/ai-service/doubao';
import type { AIProvider, DrawResponse } from '@/types';

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

    // 生成随机卡牌数据
    const cardData = drawCard();
    console.log('Drawing card:', cardData.archetype, cardData.atmosphere);

    // 调用 AI 生成图片
    let imageUrl: string;
    
    try {
      if (provider === 'doubao') {
        imageUrl = await generateImageWithDoubao(cardData.prompt);
      } else {
        imageUrl = await generateImageWithGoogle(cardData.prompt);
      }
    } catch (error) {
      console.error('Image generation error:', error);
      return NextResponse.json(
        { error: '图片生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    const response: DrawResponse = {
      imageUrl,
      prompt: cardData.description,
      archetype: cardData.archetype,
      atmosphere: cardData.atmosphere
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
