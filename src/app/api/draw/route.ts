// POST /api/draw - V1.1 复合卡牌生成
import { NextRequest, NextResponse } from 'next/server';
import { drawCardV2, getClassicCard } from '@/lib/prompts/generator';
import { checkRateLimit, DRAW_RATE_LIMIT, getClientIP } from '@/lib/utils/rate-limit';
import { generateImageWithGoogle } from '@/lib/ai-service/google';
import { generateImageWithDoubao } from '@/lib/ai-service/doubao';
import type { AIProvider, DrawResponseV2, DeckStyle } from '@/types';

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
    let deckStyle: DeckStyle = 'figurative'; // 默认具象卡组
    try {
      const body = await request.json();
      if (body.provider === 'doubao') {
        provider = 'doubao';
      }
      // 支持三种卡组风格
      if (body.deckStyle === 'figurative') {
        deckStyle = 'figurative';
      } else if (body.deckStyle === 'abstract') {
        deckStyle = 'abstract';
      } else if (body.deckStyle === 'classic') {
        deckStyle = 'classic';
      }
    } catch {
      // 使用默认值
    }

    // 经典卡组：直接使用本地图片，不需要 AI 生成
    if (deckStyle === 'classic') {
      const classicCard = getClassicCard();
      console.log('Drawing classic card:', {
        id: classicCard.id,
        word: classicCard.word.en
      });

      const response: DrawResponseV2 = {
        cardId: crypto.randomUUID(),
        word: classicCard.word,
        imageUrl: classicCard.imageUrl,
        promptKeywords: ['classic', 'OH card', classicCard.word.cn]
      };

      return NextResponse.json(response, {
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime)
        }
      });
    }

    // AI 生成卡组（抽象/具象）
    const cardData = drawCardV2(deckStyle);
    console.log('Drawing V1.1 card:', {
      word: cardData.word.en,
      keywords: cardData.promptKeywords,
      deckStyle: cardData.deckStyle
    });

    // 调用 AI 生成图像
    let imageUrl: string;
    
    try {
      if (provider === 'doubao') {
        imageUrl = await generateImageWithDoubao(cardData.imagePrompt, cardData.negativePrompt);
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
