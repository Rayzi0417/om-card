'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompositeCard } from './composite-card';
import type { WordCard } from '@/types';

// 诗意加载文案
const LOADING_MESSAGES = [
  '正在潜意识海洋中打捞...',
  '让星光为你指引方向...',
  '聆听内心深处的回响...',
  '梦境正在缓缓成形...',
  '意象从迷雾中浮现...',
  '水彩在纸上蔓延流淌...',
  '时光在这一刻静止...',
  '让心灵找到它的画面...',
];

// ============== V1.1 复合卡牌视图 ==============

interface CardViewV2Props {
  word: WordCard | null;
  imageUrl: string | null;
  isLoading?: boolean;
  onClose?: () => void;
}

/**
 * V1.1 卡牌展示组件
 * 使用 CompositeCard 实现图文分离的视觉效果
 * 支持滚轮和双指缩放
 */
export function CardViewV2({ word, imageUrl, isLoading, onClose }: CardViewV2Props) {
  // 加载文案轮播
  const [messageIndex, setMessageIndex] = useState(0);
  // 缩放状态
  const [scale, setScale] = useState(1);
  const lastTouchDistance = useRef<number | null>(null);
  
  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }
    
    // 随机初始文案
    setMessageIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
    
    // 每 2.5 秒切换一次文案
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  // 重置缩放
  useEffect(() => {
    if (!word || !imageUrl) {
      setScale(1);
    }
  }, [word, imageUrl]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isLoading) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  }, [isLoading]);

  // 双指缩放
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isLoading) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastTouchDistance.current !== null) {
        const delta = (distance - lastTouchDistance.current) * 0.01;
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      }
      lastTouchDistance.current = distance;
    }
  }, [isLoading]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
  }, []);

  // 判断是否显示
  const shouldShow = isLoading || (word && imageUrl);
  const canZoom = word && imageUrl && !isLoading;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 overflow-hidden"
          onClick={onClose}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            initial={{ scale: 0.8, rotateY: 90, opacity: 0 }}
            animate={{ scale: canZoom ? scale : 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.6 
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ perspective: '1000px', touchAction: 'none' }}
            className="w-full max-w-[320px]"
          >
            {isLoading && !word ? (
              // 纯加载状态（还没抽到词）
              <div className="aspect-[3/4] bg-[#faf8f5] rounded-2xl flex flex-col items-center justify-center gap-4 px-6 shadow-2xl">
                <motion.div
                  className="w-16 h-16 border-2 border-[#c9a959] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                
                {/* 诗意文案轮播 */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIndex}
                    className="text-[#8b7355] text-sm text-center font-serif"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {LOADING_MESSAGES[messageIndex]}
                  </motion.p>
                </AnimatePresence>
                
                {/* 进度提示 */}
                <motion.p
                  className="text-[#a09a90] text-xs mt-2"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  大约需要 5-8 秒
                </motion.p>
              </div>
            ) : word ? (
              // V1.1 复合卡牌
              <CompositeCard
                word={word}
                imageUrl={imageUrl}
                isImageLoading={isLoading && !imageUrl}
              />
            ) : null}
          </motion.div>

          {/* 底部文字描述 */}
          {canZoom && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-20 left-0 right-0 px-4"
            >
              <p className="text-center text-base text-[#c9a959] font-serif">
                {word.cn}
              </p>
              <p className="text-center text-xs text-[#8b8b9e] mt-1">
                {word.en}
              </p>
            </motion.div>
          )}

          {/* 点击提示 */}
          {canZoom && (
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#8b8b9e] text-xs"
              >
                滚轮/双指缩放 · 点击空白处继续
              </motion.p>
              <p className="text-[#8b8b9e]/60 text-xs mt-1">
                {Math.round(scale * 100)}%
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============== V1.0 兼容组件 (已弃用) ==============

interface CardViewProps {
  imageUrl: string | null;
  isLoading?: boolean;
  description?: string;
  onClose?: () => void;
}

/**
 * @deprecated 使用 CardViewV2 替代
 */
export function CardView({ imageUrl, isLoading, description, onClose }: CardViewProps) {
  // 加载文案轮播
  const [messageIndex, setMessageIndex] = useState(0);
  
  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }
    
    setMessageIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
    
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence mode="wait">
      {(isLoading || imageUrl) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, rotateY: 90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.6 
            }}
            className="relative w-[85vw] max-w-sm aspect-[3/4] om-card rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ perspective: '1000px' }}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
                <motion.div
                  className="w-16 h-16 border-2 border-[#c9a959] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIndex}
                    className="text-[#c9a959]/80 text-sm text-center font-serif"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {LOADING_MESSAGES[messageIndex]}
                  </motion.p>
                </AnimatePresence>
                
                <motion.p
                  className="text-[#8b8b9e]/50 text-xs mt-2"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  大约需要 5-8 秒
                </motion.p>
                
                <motion.div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(201, 169, 89, 0.3) 0%, transparent 70%)'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            ) : imageUrl ? (
              <>
                <div className="relative w-full h-full">
                  <img
                    src={imageUrl}
                    alt={description || "Om Card"}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
                  >
                    <p className="text-center text-sm text-[#edf2f4]/80 font-serif">
                      {description}
                    </p>
                  </motion.div>
                )}

                <div 
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{
                    boxShadow: 'inset 0 0 30px rgba(201, 169, 89, 0.1)',
                    border: '1px solid rgba(201, 169, 89, 0.3)'
                  }}
                />
              </>
            ) : null}
          </motion.div>

          {imageUrl && !isLoading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-8 text-[#8b8b9e] text-xs"
            >
              点击空白处继续
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
