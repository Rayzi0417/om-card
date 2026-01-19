'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { WordCard } from '@/types';

interface CompositeCardProps {
  word: WordCard;
  imageUrl: string | null;
  isImageLoading?: boolean;
  className?: string;
}

/**
 * V1.1 复合卡牌组件
 * 
 * 结构：白色文字框 + 中央模糊内图
 * 
 *  ┌─────────────────────────┐
 *  │         LOVE            │  ← 上方文字
 *  │  ┌─────────────────┐    │
 *  │ L│                 │E   │  ← 左/右侧文字
 *  │ O│   [模糊内图]    │V   │
 *  │ V│                 │O   │
 *  │ E│                 │L   │
 *  │  └─────────────────┘    │
 *  │         EVOL            │  ← 下方文字 (倒置)
 *  └─────────────────────────┘
 */
export function CompositeCard({ 
  word, 
  imageUrl, 
  isImageLoading = false,
  className = ''
}: CompositeCardProps) {
  const wordText = word.en;
  
  return (
    <div 
      className={`
        relative aspect-[3/4] w-full max-w-[320px]
        bg-[#faf8f5] rounded-2xl
        shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)]
        overflow-hidden
        ${className}
      `}
      style={{
        // 卡纸纹理效果
        backgroundImage: `
          linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(201,169,89,0.03) 0%, transparent 50%)
        `
      }}
    >
      {/* 文字框层 */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        {/* 上方文字 */}
        <span 
          className="absolute top-3 left-1/2 -translate-x-1/2 
                     text-[#2c2c2c] font-serif text-sm tracking-[0.3em] font-medium
                     select-none"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {wordText}
        </span>
        
        {/* 下方文字 (倒置) */}
        <span 
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rotate-180
                     text-[#2c2c2c] font-serif text-sm tracking-[0.3em] font-medium
                     select-none"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {wordText}
        </span>
        
        {/* 左侧文字 (从下往上读) */}
        <div 
          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
        >
          <span 
            className="text-[#2c2c2c] font-serif text-xs tracking-[0.2em] font-medium select-none whitespace-nowrap"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              writingMode: 'vertical-lr',
              transform: 'rotate(180deg)'
            }}
          >
            {wordText}
          </span>
        </div>
        
        {/* 右侧文字 (从上往下读) */}
        <div 
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
        >
          <span 
            className="text-[#2c2c2c] font-serif text-xs tracking-[0.2em] font-medium select-none whitespace-nowrap"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              writingMode: 'vertical-lr'
            }}
          >
            {wordText}
          </span>
        </div>
        
        {/* 中央图像区域 */}
        <div 
          className="relative w-[75%] h-[78%] rounded-lg overflow-hidden
                     shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)]
                     bg-[#e8e4df]"
        >
          {isImageLoading ? (
            // 加载骨架屏
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #d4cfc7 0%, #e8e4df 50%, #d4cfc7 100%)'
              }}
            >
              <motion.div
                className="w-12 h-12 border-2 border-[#c9a959]/40 border-t-[#c9a959] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          ) : imageUrl ? (
            // 模糊内图
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative w-full h-full"
            >
              <Image
                src={imageUrl}
                alt="Card image"
                fill
                className="object-cover"
                priority
                unoptimized={imageUrl.startsWith('data:')}
              />
              {/* 内图边缘柔化 */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 20px rgba(250,248,245,0.3)'
                }}
              />
            </motion.div>
          ) : (
            // 空状态
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#a09a90] text-xs">等待图像...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 卡片边缘高光 */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.05)'
        }}
      />
    </div>
  );
}

/**
 * 带动画的复合卡牌 - 用于抽牌展示
 */
export function AnimatedCompositeCard({
  word,
  imageUrl,
  isImageLoading,
  onAnimationComplete
}: CompositeCardProps & { onAnimationComplete?: () => void }) {
  return (
    <motion.div
      initial={{ 
        scale: 0.8, 
        rotateY: 90,
        opacity: 0 
      }}
      animate={{ 
        scale: 1, 
        rotateY: 0,
        opacity: 1 
      }}
      exit={{ 
        scale: 0.8, 
        opacity: 0 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        duration: 0.6 
      }}
      onAnimationComplete={onAnimationComplete}
      style={{ perspective: '1000px' }}
    >
      <CompositeCard 
        word={word} 
        imageUrl={imageUrl} 
        isImageLoading={isImageLoading}
      />
    </motion.div>
  );
}
