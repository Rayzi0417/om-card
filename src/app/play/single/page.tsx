'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import { BreathingRing } from '@/components/breathing-ring';
import { CardViewV2 } from '@/components/card-view';
import { CompositeCard } from '@/components/composite-card';
import { ChatBox } from '@/components/chat-box';
import { SettingsDrawer } from '@/components/settings-drawer';
import { SavePreviewModal } from '@/components/save-preview-modal';
import type { AIProvider, DeckStyle, CardStateV2, DrawResponseV2 } from '@/types';

/**
 * 单张抽牌玩法 - "当下映照"
 */
export default function SinglePlayPage() {
  // 状态管理
  const [provider, setProvider] = useState<AIProvider>('doubao');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('figurative');
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
  
  // 保存卡片功能 - 使用 Canvas 绘制
  const [saveState, setSaveState] = useState<{
    isGenerating: boolean;
    previewUrl: string | null;
  }>({ isGenerating: false, previewUrl: null });

  const clearPreview = useCallback(() => {
    setSaveState({ isGenerating: false, previewUrl: null });
  }, []);

  // 抽牌逻辑
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
        body: JSON.stringify({ provider, deckStyle }),
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
  }, [provider, deckStyle, cardState.imageUrl]);

  // 关闭卡牌，开启对话
  const handleCardClose = useCallback(() => {
    if (cardState.imageUrl && !cardState.isLoading) {
      setShowCard(false);
      setTimeout(() => setShowChat(true), 300);
    }
  }, [cardState.imageUrl, cardState.isLoading]);

  // 查看卡牌
  const handleViewCard = useCallback(() => {
    setShowCard(true);
  }, []);

  // 关闭卡牌查看
  const handleCardViewClose = useCallback(() => {
    setShowCard(false);
  }, []);

  // 重新开始
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

  // 切换卡组（自动重置当前卡牌）
  const handleDeckChange = useCallback((newDeck: DeckStyle) => {
    if (newDeck !== deckStyle) {
      setDeckStyle(newDeck);
      // 如果已有卡牌，自动重置
      if (cardState.imageUrl) {
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
        toast.success(`已切换到${newDeck === 'classic' ? '经典' : newDeck === 'abstract' ? '抽象' : '具象'}卡组`);
      }
    }
  }, [deckStyle, cardState.imageUrl]);

  // 保存卡片 - 使用 Canvas 绘制
  const saveCard = useCallback(async () => {
    if (!cardState.imageUrl || !cardState.word) {
      toast.error('没有可保存的卡牌');
      return;
    }

    setSaveState({ isGenerating: true, previewUrl: null });
    toast.loading('正在生成图片...', { id: 'saving' });

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 设置画布尺寸 (2x 高清)
      const scale = 2;
      const W = 320; // 逻辑宽度
      const H = 480; // 逻辑高度
      canvas.width = W * scale;
      canvas.height = H * scale;
      ctx.scale(scale, scale);

      // 绘制背景渐变
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f23');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // 绘制装饰边框
      ctx.strokeStyle = 'rgba(201, 169, 89, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(15, 15, W - 30, H - 30);

      // 绘制标题
      ctx.fillStyle = '#c9a959';
      ctx.font = 'bold 18px serif';
      ctx.textAlign = 'center';
      ctx.fillText('当下映照', W / 2, 45);

      ctx.fillStyle = '#8b8b9e';
      ctx.font = '11px sans-serif';
      ctx.fillText('The Daily Mirror', W / 2, 62);

      // 加载并绘制卡片图片
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          // 只有外部 http URL 才需要设置 crossOrigin
          // base64 和本地图片不需要
          if (src.startsWith('http') && !src.startsWith(window.location.origin)) {
            img.crossOrigin = 'anonymous';
          }
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error('图片加载失败:', src.substring(0, 100), e);
            reject(new Error('图片加载失败'));
          };
          img.src = src;
        });
      };

      const getFullImageUrl = (path: string) => {
        // base64 图片直接返回
        if (path.startsWith('data:')) return path;
        // 完整 URL 直接返回
        if (path.startsWith('http')) return path;
        // 本地路径拼接 origin
        return `${window.location.origin}${path}`;
      };

      // 绘制卡片
      const cardX = 60;
      const cardY = 85;
      const cardWidth = 200;
      const cardHeight = 260;

      // 卡片背景
      ctx.fillStyle = '#faf8f5';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
      ctx.fill();

      // 绘制图片
      try {
        const img = await loadImg(getFullImageUrl(cardState.imageUrl));
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(cardX + 10, cardY + 10, cardWidth - 20, cardHeight - 60, 8);
        ctx.clip();
        ctx.drawImage(img, cardX + 10, cardY + 10, cardWidth - 20, cardHeight - 60);
        ctx.restore();
      } catch (error) {
        console.error('绘制图片失败:', error);
        ctx.fillStyle = '#e8e4df';
        ctx.fillRect(cardX + 10, cardY + 10, cardWidth - 20, cardHeight - 60);
        ctx.fillStyle = '#8b8b9e';
        ctx.font = '12px sans-serif';
        ctx.fillText('图片', cardX + cardWidth / 2, cardY + (cardHeight - 60) / 2 + 10);
      }

      // 绘制文字
      ctx.fillStyle = '#2a2a3e';
      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(cardState.word.cn, cardX + cardWidth / 2, cardY + cardHeight - 25);

      ctx.fillStyle = '#8b7355';
      ctx.font = '11px sans-serif';
      ctx.fillText(cardState.word.en, cardX + cardWidth / 2, cardY + cardHeight - 8);

      // 绘制底部信息
      ctx.fillStyle = '#c9a959';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Om Card · ${new Date().toLocaleDateString('zh-CN')}`, W / 2, H - 25);

      const dataUrl = canvas.toDataURL('image/png');
      setSaveState({ isGenerating: false, previewUrl: dataUrl });
      toast.success('图片已生成！', { id: 'saving' });
    } catch (err) {
      console.error('生成图片失败:', err);
      setSaveState({ isGenerating: false, previewUrl: null });
      toast.error('生成图片失败，请重试', { id: 'saving' });
    }
  }, [cardState.imageUrl, cardState.word]);

  // 卡牌描述（用于 AI 上下文）
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
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8b8b9e]" />
          </Link>
          <div>
            <motion.h1 
              className="text-lg font-serif text-[#c9a959] tracking-wider"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              当下映照
            </motion.h1>
            <p className="text-xs text-[#8b8b9e]">The Daily Mirror</p>
          </div>
        </div>
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
              className="flex flex-col items-center gap-6"
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
              
              {/* 卡组切换器 */}
              {!cardState.isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                >
                  <span className="text-xs text-[#8b8b9e]">卡组</span>
                  <div className="w-px h-4 bg-white/10" />
                  <button
                    onClick={() => handleDeckChange('classic')}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      deckStyle === 'classic'
                        ? 'bg-[#c9a959]/20 text-[#c9a959]'
                        : 'text-[#8b8b9e] hover:text-[#edf2f4]'
                    }`}
                  >
                    经典
                  </button>
                  <button
                    onClick={() => handleDeckChange('abstract')}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      deckStyle === 'abstract'
                        ? 'bg-[#c9a959]/20 text-[#c9a959]'
                        : 'text-[#8b8b9e] hover:text-[#edf2f4]'
                    }`}
                  >
                    抽象
                  </button>
                  <button
                    onClick={() => handleDeckChange('figurative')}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      deckStyle === 'figurative'
                        ? 'bg-[#c9a959]/20 text-[#c9a959]'
                        : 'text-[#8b8b9e] hover:text-[#edf2f4]'
                    }`}
                  >
                    具象
                  </button>
                </motion.div>
              )}
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
              {/* 复合卡牌预览 */}
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
          className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-safe bg-gradient-to-t from-[#0f0f23] via-[#0f0f23]/90 to-transparent"
        >
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-full border border-white/10 text-[#8b8b9e] text-sm hover:border-[#c9a959]/30 hover:text-[#edf2f4] transition-colors"
            >
              重新抽牌
            </button>
            <button
              onClick={saveCard}
              disabled={saveState.isGenerating}
              className="py-3 px-4 rounded-full border border-white/10 text-[#8b8b9e] text-sm hover:border-[#c9a959]/30 hover:text-[#edf2f4] transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {saveState.isGenerating ? '生成中...' : '保存'}
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
        word={cardState.word || undefined}
        imageUrl={cardState.imageUrl || undefined}
        provider={provider}
      />

      {/* 保存预览模态框 */}
      <SavePreviewModal
        isOpen={!!saveState.previewUrl}
        imageUrl={saveState.previewUrl}
        onClose={clearPreview}
        title="保存卡片"
      />

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#c9a959]/5 to-transparent pointer-events-none" />
    </main>
  );
}
