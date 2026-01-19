'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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

interface CardViewProps {
  imageUrl: string | null;
  isLoading?: boolean;
  description?: string;
  onClose?: () => void;
}

export function CardView({ imageUrl, isLoading, description, onClose }: CardViewProps) {
  // 加载文案轮播
  const [messageIndex, setMessageIndex] = useState(0);
  
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
              // 加载骨架屏
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
                <motion.div
                  className="w-16 h-16 border-2 border-[#c9a959] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                
                {/* 诗意文案轮播 */}
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
                
                {/* 进度提示 */}
                <motion.p
                  className="text-[#8b8b9e]/50 text-xs mt-2"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  大约需要 5-8 秒
                </motion.p>
                
                {/* 装饰性光效 */}
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
              // 卡牌图片
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={description || "Om Card"}
                    fill
                    className="object-cover"
                    priority
                    unoptimized={imageUrl.startsWith('data:')}
                  />
                </div>
                
                {/* 底部描述 */}
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

                {/* 金色边框光效 */}
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

          {/* 点击提示 */}
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
