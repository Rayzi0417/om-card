'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BreathingRing } from '@/components/breathing-ring';
import { CardViewV2 } from '@/components/card-view';
import { CompositeCard } from '@/components/composite-card';
import { ChatBox } from '@/components/chat-box';
import { SettingsDrawer } from '@/components/settings-drawer';
import type { AIProvider, CardStateV2, DrawResponseV2 } from '@/types';

export default function Home() {
  // 状态管理 - V1.1
  const [provider, setProvider] = useState<AIProvider>('google');
  const [cardState, setCardState] = useState<CardStateV2>({
    isLoading: false,
    cardId: null,
    word: null,
    imageUrl: null,
    promptKeywords: [],
    error: null,
  });
  const [showCard, setShowCard] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // V1.1 抽牌逻辑
  const handleDraw = useCallback(async () => {
    // 如果已经有卡牌，先重置
    if (cardState.imageUrl) {
      setCardState({
        isLoading: false,
        cardId: null,
        word: null,
        imageUrl: null,
        promptKeywords: [],
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

      const data: DrawResponseV2 = await response.json();
      
      setCardState({
        isLoading: false,
        cardId: data.cardId,
        word: data.word,
        imageUrl: data.imageUrl,
        promptKeywords: data.promptKeywords,
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
      cardId: null,
      word: null,
      imageUrl: null,
      promptKeywords: [],
      error: null,
    });
  }, []);

  // V1.1: 卡牌描述（用于 AI 上下文）
  const cardDescription = cardState.word && cardState.promptKeywords.length > 0
    ? `文字「${cardState.word.cn}/${cardState.word.en}」配合一幅${cardState.promptKeywords.join('、')}意象的画面`
    : undefined;

  // 是否已有卡牌
  const hasCard = !!cardState.imageUrl && !!cardState.word;

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
            // 已抽牌状态：显示复合卡牌缩略图
            <motion.div
              key="card-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              {/* V1.1 复合卡牌预览 */}
              <motion.div
                className="w-36 cursor-pointer"
                onClick={handleViewCard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CompositeCard
                  word={cardState.word!}
                  imageUrl={cardState.imageUrl}
                />
              </motion.div>
              
              {/* 文字提示 */}
              <div className="text-center">
                <p className="text-[#c9a959] text-sm font-serif">
                  {cardState.word?.cn}
                </p>
                <p className="text-[#8b8b9e] text-xs mt-1">
                  {cardState.word?.en}
                </p>
              </div>
              <p className="text-[#8b8b9e]/60 text-xs">点击卡牌放大查看</p>
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

      {/* V1.1 卡牌展示层 */}
      <CardViewV2
        word={showCard ? cardState.word : null}
        imageUrl={showCard ? cardState.imageUrl : null}
        isLoading={cardState.isLoading}
        onClose={hasCard && !cardState.isLoading ? handleCardViewClose : handleCardClose}
      />

      {/* 对话层 - V1.1 传递 word 上下文 */}
      <ChatBox
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        imageContext={cardDescription}
        imageUrl={cardState.imageUrl || undefined}
        provider={provider}
      />

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#c9a959]/5 to-transparent pointer-events-none" />

      {/* 免责声明 */}
      <footer className="absolute bottom-2 left-0 right-0 text-center z-10 px-4">
        <p className="text-[10px] text-[#8b8b9e]/50 leading-relaxed">
          本应用由 AI 驱动，仅供心理投射与自我探索，不构成任何医疗建议。
        </p>
      </footer>
    </main>
  );
}
