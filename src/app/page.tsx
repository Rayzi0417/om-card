'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BreathingRing } from '@/components/breathing-ring';
import { CardView } from '@/components/card-view';
import { ChatBox } from '@/components/chat-box';
import { SettingsDrawer } from '@/components/settings-drawer';
import type { AIProvider, CardState } from '@/types';

export default function Home() {
  // 状态管理
  const [provider, setProvider] = useState<AIProvider>('google');
  const [cardState, setCardState] = useState<CardState>({
    isLoading: false,
    imageUrl: null,
    archetype: null,
    atmosphere: null,
    error: null,
  });
  const [showCard, setShowCard] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // 抽牌逻辑
  const handleDraw = useCallback(async () => {
    // 如果已经有卡牌，先重置
    if (cardState.imageUrl) {
      setCardState({
        isLoading: false,
        imageUrl: null,
        archetype: null,
        atmosphere: null,
        error: null,
      });
      setShowChat(false);
    }
    
    setCardState(prev => ({ ...prev, isLoading: true, error: null }));
    setShowCard(true);

    try {
      const response = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (response.status === 429) {
        const data = await response.json();
        toast.error(`请求过于频繁，请 ${data.retryAfter} 秒后再试`);
        setShowCard(false);
        setCardState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();
      
      setCardState({
        isLoading: false,
        imageUrl: data.imageUrl,
        archetype: data.archetype,
        atmosphere: data.atmosphere,
        error: null,
      });
    } catch (error) {
      console.error('Draw error:', error);
      toast.error('卡牌生成失败，请稍后重试');
      setShowCard(false);
      setCardState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: '生成失败' 
      }));
    }
  }, [provider, cardState.imageUrl]);

  // 关闭卡牌，开启对话
  const handleCardClose = useCallback(() => {
    if (cardState.imageUrl && !cardState.isLoading) {
      setShowCard(false);
      // 短暂延迟后打开对话
      setTimeout(() => setShowChat(true), 300);
    }
  }, [cardState.imageUrl, cardState.isLoading]);

  // 查看卡牌（不重置对话）
  const handleViewCard = useCallback(() => {
    setShowCard(true);
  }, []);

  // 关闭卡牌查看（返回对话）
  const handleCardViewClose = useCallback(() => {
    setShowCard(false);
  }, []);

  // 重新开始（新抽牌）
  const handleReset = useCallback(() => {
    setShowChat(false);
    setShowCard(false);
    setCardState({
      isLoading: false,
      imageUrl: null,
      archetype: null,
      atmosphere: null,
      error: null,
    });
  }, []);

  // 获取卡牌描述（用于 AI 上下文）
  const cardDescription = cardState.archetype && cardState.atmosphere
    ? `一幅${cardState.atmosphere}「${cardState.archetype}」的水彩画`
    : undefined;

  // 是否已有卡牌（用于判断显示状态）
  const hasCard = !!cardState.imageUrl;

  return (
    <main className="relative min-h-dvh om-gradient-bg om-stars overflow-hidden">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#c9a959]/5 to-transparent pointer-events-none" />
      
      {/* 头部 */}
      <header className="relative z-10 flex items-center justify-between p-4 pt-safe">
        <motion.h1 
          className="text-lg font-serif text-[#c9a959] tracking-wider"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Om Card
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <SettingsDrawer 
            provider={provider}
            onProviderChange={setProvider}
          />
        </motion.div>
      </header>

      {/* 主内容区 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] px-4">
        <AnimatePresence mode="wait">
          {!hasCard ? (
            // 未抽牌状态：显示呼吸圆环
            <motion.div
              key="ring"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8"
            >
              <BreathingRing
                isLoading={cardState.isLoading}
                onClick={handleDraw}
                disabled={cardState.isLoading}
              />
              <motion.p
                className="text-center text-[#8b8b9e] text-sm max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {cardState.isLoading 
                  ? '静心感应...' 
                  : '点击圆环，让潜意识为你选择一张卡牌'}
              </motion.p>
            </motion.div>
          ) : (
            // 已抽牌状态：显示卡牌预览
            <motion.div
              key="card-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              {/* 卡牌预览 */}
              <motion.div
                className="w-32 h-44 rounded-xl overflow-hidden om-card cursor-pointer shadow-2xl"
                onClick={handleViewCard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src={cardState.imageUrl!} 
                  alt="当前卡牌"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <p className="text-[#8b8b9e] text-xs">{cardDescription}</p>
              <p className="text-[#c9a959] text-xs">点击卡牌放大查看</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作区 */}
      {hasCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-[#0f0f23] to-transparent"
        >
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-full border border-white/10 text-[#8b8b9e] text-sm hover:border-[#c9a959]/30 hover:text-[#edf2f4] transition-colors"
            >
              重新抽牌
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="flex-1 py-3 rounded-full bg-[#c9a959] text-[#0f0f23] text-sm font-medium hover:bg-[#b8942d] transition-colors"
            >
              {showChat ? '继续对话' : '开始对话'}
            </button>
          </div>
        </motion.div>
      )}

      {/* 卡牌展示层 */}
      <CardView
        imageUrl={showCard ? cardState.imageUrl : null}
        isLoading={cardState.isLoading}
        description={cardDescription}
        onClose={hasCard && !cardState.isLoading ? handleCardViewClose : handleCardClose}
      />

      {/* 对话层 */}
      <ChatBox
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        imageContext={cardDescription}
        imageUrl={cardState.imageUrl || undefined}
        provider={provider}
        onViewImage={handleViewCard}
      />

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#c9a959]/5 to-transparent pointer-events-none" />
    </main>
  );
}
