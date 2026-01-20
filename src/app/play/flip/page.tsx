'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Camera, RefreshCw, Shuffle, ZoomIn, X } from 'lucide-react';
import Link from 'next/link';
import { CompositeCard } from '@/components/composite-card';
import { SettingsDrawer } from '@/components/settings-drawer';
import { SavePreviewModal } from '@/components/save-preview-modal';
import { getClassicCards } from '@/lib/prompts/generator';
import type { AIProvider, DeckStyle, WordCard, ChatMessage } from '@/types';

// 游戏阶段
type GameStage = 
  | 'init'         // 选择卡组
  | 'loading'      // 加载卡牌
  | 'setup'        // 分配卡牌到左右区域
  | 'initial'      // 第一轮探索（交换前）
  | 'swapping'     // 交换动画
  | 'swapped'      // 第二轮探索（交换后）
  | 'conclusion';  // 收尾整合

// 卡组来源
type DeckSource = 'classic' | 'ai';

// 卡牌状态
interface CardData {
  id: string;
  word: WordCard;
  imageUrl: string;
}

/**
 * Mode B: 舒服 VS. 不舒服 (Paradox Flip)
 * 官方玩法 - 随机2张 + 左右固定区域 + Swap交换
 */
export default function FlipPlayPage() {
  // 基础状态
  const [provider, setProvider] = useState<AIProvider>('doubao');
  const [deckStyle] = useState<DeckStyle>('figurative');
  const [deckSource, setDeckSource] = useState<DeckSource>('classic');
  
  // 游戏状态
  const [stage, setStage] = useState<GameStage>('init');
  const [cards, setCards] = useState<CardData[]>([]);
  const [leftCard, setLeftCard] = useState<CardData | null>(null);   // 不舒服区
  const [rightCard, setRightCard] = useState<CardData | null>(null); // 舒服区
  const [isSwapped, setIsSwapped] = useState(false);
  
  // 拖拽状态
  const [draggingCard, setDraggingCard] = useState<CardData | null>(null);
  const leftZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);
  
  // 预览状态
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  
  // 对话状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // 保存功能
  const [savePreviewUrl, setSavePreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 消息容器 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 生成经典卡牌
  const generateClassicCards = useCallback(() => {
    const classicCards = getClassicCards(2);
    const generatedCards: CardData[] = classicCards.map((card) => ({
      id: `classic-${card.id}`,
      word: card.word,
      imageUrl: card.imageUrl,
    }));
    setCards(generatedCards);
    setStage('setup');
  }, []);

  // 生成AI卡牌
  const generateAiCards = useCallback(async () => {
    setStage('loading');
    const generatedCards: CardData[] = [];
    
    for (let i = 0; i < 2; i++) {
      try {
        const response = await fetch('/api/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, deckStyle }),
        });
        
        if (response.ok) {
          const data = await response.json();
          generatedCards.push({
            id: data.cardId,
            word: data.word,
            imageUrl: data.imageUrl,
          });
        }
      } catch (error) {
        console.error('Card generation failed:', error);
      }
      
      if (i < 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (generatedCards.length >= 2) {
      setCards(generatedCards);
      setStage('setup');
    } else {
      toast.error('卡牌生成失败，请重试');
      setStage('init');
    }
  }, [provider, deckStyle]);

  // 开始游戏
  const startGame = useCallback((source: DeckSource) => {
    setDeckSource(source);
    setLeftCard(null);
    setRightCard(null);
    setIsSwapped(false);
    setMessages([]);
    
    if (source === 'classic') {
      setStage('loading');
      setTimeout(() => generateClassicCards(), 500);
    } else {
      generateAiCards();
    }
  }, [generateClassicCards, generateAiCards]);

  // 最后记录的指针位置
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);

  // 记录拖拽过程中的位置
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    let x: number, y: number;
    
    if ('touches' in event && event.touches.length > 0) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else if ('clientX' in event) {
      x = (event as MouseEvent).clientX;
      y = (event as MouseEvent).clientY;
    } else {
      return;
    }
    
    lastPointerPosition.current = { x, y };
  }, []);

  // 检测拖拽结束时卡牌落在哪个区域
  const handleDragEnd = useCallback((card: CardData) => {
    setDraggingCard(null);
    
    const leftZone = leftZoneRef.current;
    const rightZone = rightZoneRef.current;
    const pos = lastPointerPosition.current;
    
    if (!leftZone || !rightZone || !pos) return;
    
    const leftRect = leftZone.getBoundingClientRect();
    const rightRect = rightZone.getBoundingClientRect();
    
    const { x: dropX, y: dropY } = pos;
    
    // 扩大检测范围，更容易放入
    const padding = 30;
    
    // 检查是否落在左边区域
    if (
      dropX >= leftRect.left - padding && 
      dropX <= leftRect.right + padding && 
      dropY >= leftRect.top - padding && 
      dropY <= leftRect.bottom + padding
    ) {
      // 如果右边也是这张卡，先移除
      if (rightCard?.id === card.id) {
        setRightCard(null);
      }
      setLeftCard(card);
      toast.success('已放入不舒服区 🌙');
      return;
    }
    
    // 检查是否落在右边区域
    if (
      dropX >= rightRect.left - padding && 
      dropX <= rightRect.right + padding && 
      dropY >= rightRect.top - padding && 
      dropY <= rightRect.bottom + padding
    ) {
      // 如果左边也是这张卡，先移除
      if (leftCard?.id === card.id) {
        setLeftCard(null);
      }
      setRightCard(card);
      toast.success('已放入舒服区 ☀️');
      return;
    }
    
    // 如果没有落在任何区域，且这张卡之前在某个区域，则移除
    if (leftCard?.id === card.id) {
      setLeftCard(null);
    }
    if (rightCard?.id === card.id) {
      setRightCard(null);
    }
  }, [leftCard, rightCard]);

  // 确认分配，开始第一轮探索
  const confirmSetup = useCallback(() => {
    if (!leftCard || !rightCard) {
      toast.error('请将两张卡牌分别放入左右区域');
      return;
    }
    setStage('initial');
    startChat('initial');
  }, [leftCard, rightCard]);

  // 开始对话
  const startChat = useCallback(async (phase: 'initial' | 'swapped' | 'conclusion') => {
    setIsAiThinking(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '（用户已准备好）' }],
          provider,
          mode: 'flip',
          phase,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let aiMessage = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value, { stream: true });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('对话出错，请重试');
    } finally {
      setIsAiThinking(false);
    }
  }, [provider]);

  // 发送用户消息
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiThinking(true);

    try {
      const currentPhase = stage === 'initial' ? 'initial' : stage === 'swapped' ? 'swapped' : 'conclusion';
      const allMessages = [...messages, { role: 'user' as const, content: userMessage }];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          provider,
          mode: 'flip',
          phase: currentPhase,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let aiMessage = '';
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: aiMessage };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('对话出错，请重试');
    } finally {
      setIsAiThinking(false);
    }
  }, [inputValue, messages, provider, stage]);

  // 触发 Swap 动画
  const triggerSwap = useCallback(() => {
    setStage('swapping');
    setTimeout(() => {
      setIsSwapped(true);
      setStage('swapped');
      // 继续对话
      startChat('swapped');
    }, 1500);
  }, [startChat]);

  // 进入收尾阶段
  const goToConclusion = useCallback(() => {
    setStage('conclusion');
    startChat('conclusion');
  }, [startChat]);

  // 保存咨询 - 使用 Canvas 直接绘制
  const saveConsultation = useCallback(async () => {
    if (!leftCard || !rightCard) {
      toast.error('没有可保存的卡牌');
      return;
    }

    setIsSaving(true);
    toast.loading('正在生成图片...', { id: 'saving' });

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 设置画布尺寸
      canvas.width = 400;
      canvas.height = 550;

      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f23');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制标题
      ctx.fillStyle = '#c9a959';
      ctx.font = 'bold 22px serif';
      ctx.textAlign = 'center';
      ctx.fillText('舒服 VS. 不舒服', canvas.width / 2, 35);

      ctx.fillStyle = '#8b8b9e';
      ctx.font = '12px sans-serif';
      ctx.fillText('一体两面的洞见', canvas.width / 2, 55);

      // 加载并绘制图片 - 使用完整 URL
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          // 构建完整 URL
          let fullUrl = src;
          if (!src.startsWith('http') && !src.startsWith('data:')) {
            fullUrl = window.location.origin + (src.startsWith('/') ? src : '/' + src);
          }
          console.log('Loading image:', fullUrl);
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error('Image load failed:', fullUrl, e);
            reject(new Error('图片加载失败'));
          };
          // 本地图片不需要 crossOrigin
          if (src.startsWith('http') && !src.includes(window.location.host)) {
            img.crossOrigin = 'anonymous';
          }
          img.src = fullUrl;
        });
      };

      // 绘制左边卡（不舒服区）
      ctx.fillStyle = '#818cf8';
      ctx.font = '13px sans-serif';
      ctx.fillText('🌙 不舒服区', 100, 85);

      try {
        const leftImg = await loadImg(leftCard.imageUrl);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(30, 95, 140, 180, 8);
        ctx.clip();
        ctx.drawImage(leftImg, 30, 95, 140, 180);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(30, 95, 140, 180);
        ctx.fillStyle = '#8b8b9e';
        ctx.font = '12px sans-serif';
        ctx.fillText('卡牌图片', 100, 190);
      }

      // 左卡文字
      ctx.fillStyle = '#8b8b9e';
      ctx.font = '11px sans-serif';
      ctx.fillText(leftCard.word?.cn || leftCard.word?.en || '', 100, 290);

      // 绘制右边卡（舒服区）
      ctx.fillStyle = '#fbbf24';
      ctx.font = '13px sans-serif';
      ctx.fillText('☀️ 舒服区', 300, 85);

      try {
        const rightImg = await loadImg(rightCard.imageUrl);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(230, 95, 140, 180, 8);
        ctx.clip();
        ctx.drawImage(rightImg, 230, 95, 140, 180);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(230, 95, 140, 180);
        ctx.fillStyle = '#8b8b9e';
        ctx.font = '12px sans-serif';
        ctx.fillText('卡牌图片', 300, 190);
      }

      // 右卡文字
      ctx.fillStyle = '#8b8b9e';
      ctx.font = '11px sans-serif';
      ctx.fillText(rightCard.word?.cn || rightCard.word?.en || '', 300, 290);

      // 绘制对话摘要背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(20, 310, 360, 200, 12);
      ctx.fill();

      // 对话摘要标题
      ctx.fillStyle = '#8b8b9e';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💬 咨询摘要', 35, 335);

      // 绘制最后几条消息
      const recentMessages = messages.slice(-3);
      let yPos = 360;
      ctx.font = '10px sans-serif';
      
      for (const msg of recentMessages) {
        ctx.fillStyle = msg.role === 'user' ? '#edf2f4' : '#8b8b9e';
        const prefix = msg.role === 'user' ? '我: ' : 'Om: ';
        const text = prefix + msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '');
        
        // 简单换行处理
        const maxWidth = 340;
        const words = text.split('');
        let line = '';
        
        for (const char of words) {
          const testLine = line + char;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line.length > 0) {
            ctx.fillText(line, 35, yPos);
            line = char;
            yPos += 18;
            if (yPos > 490) break;
          } else {
            line = testLine;
          }
        }
        if (yPos <= 490) {
          ctx.fillText(line, 35, yPos);
          yPos += 25;
        }
        if (yPos > 490) break;
      }

      // 底部信息
      ctx.fillStyle = 'rgba(201, 169, 89, 0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Om Card · ${new Date().toLocaleDateString('zh-CN')}`, canvas.width / 2, canvas.height - 15);

      // 转换为图片 URL
      const dataUrl = canvas.toDataURL('image/png', 1);
      setSavePreviewUrl(dataUrl);
      toast.success('图片生成成功！', { id: 'saving' });
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('生成图片失败，请重试', { id: 'saving' });
    } finally {
      setIsSaving(false);
    }
  }, [leftCard, rightCard, messages]);

  // 重新开始
  const handleReset = useCallback(() => {
    setStage('init');
    setCards([]);
    setLeftCard(null);
    setRightCard(null);
    setIsSwapped(false);
    setMessages([]);
  }, []);

  // 交换左右卡牌位置（调整用）
  const swapCardPositions = useCallback(() => {
    const temp = leftCard;
    setLeftCard(rightCard);
    setRightCard(temp);
  }, [leftCard, rightCard]);

  // 渲染可拖拽的卡牌
  const renderDraggableCard = (card: CardData, isInZone: boolean = false) => {
    return (
      <motion.div
        key={card.id}
        drag
        dragSnapToOrigin
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={() => setDraggingCard(card)}
        onDrag={(event) => handleDrag(event as MouseEvent | TouchEvent | PointerEvent)}
        onDragEnd={() => handleDragEnd(card)}
        whileDrag={{ scale: 1.15, zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
        className={`cursor-grab active:cursor-grabbing touch-none relative group ${
          isInZone ? 'w-full h-full' : 'w-28'
        }`}
        style={{ touchAction: 'none' }}
      >
        <div className={`rounded-xl overflow-hidden shadow-lg pointer-events-none ${isInZone ? 'w-full h-full' : ''}`}>
          <CompositeCard
            word={card.word}
            imageUrl={card.imageUrl}
            imageOnly
          />
        </div>
        {/* 放大按钮 - hover 时显示 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreviewCard(card);
          }}
          className="absolute top-1 right-1 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/70"
          title="点击放大查看"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  // 渲染卡片预览模态框
  const renderPreviewModal = () => {
    if (!previewCard) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={() => setPreviewCard(null)}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setPreviewCard(null)}
            className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 卡片大图 */}
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <CompositeCard
              word={previewCard.word}
              imageUrl={previewCard.imageUrl}
              imageOnly
            />
          </div>

          {/* 提示文字 */}
          <p className="text-center text-[#8b8b9e] text-sm mt-4">
            点击空白处或 ✕ 关闭预览
          </p>
        </motion.div>
      </motion.div>
    );
  };

  // 渲染卡牌区域（setup 阶段）
  const renderSetupZones = () => {
    // 未分配的卡牌
    const unassignedCards = cards.filter(
      card => card.id !== leftCard?.id && card.id !== rightCard?.id
    );

    return (
      <div className="flex flex-col items-center gap-6 py-4">
        {/* 放置区域 */}
        <div className="flex justify-center gap-8 items-start">
          {/* 左侧：不舒服区 */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
              <span className="text-indigo-300">🌙</span>
              <span className="text-indigo-300 text-sm font-medium">不舒服区</span>
            </div>
            <div 
              ref={leftZoneRef}
              className={`w-36 h-48 rounded-xl overflow-hidden transition-all ${
                draggingCard ? 'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-[#0f0f23]' : ''
              } ${
                leftCard 
                  ? 'shadow-[0_0_25px_rgba(99,102,241,0.3)]' 
                  : 'border-2 border-dashed border-indigo-400/40 bg-indigo-500/10 flex items-center justify-center'
              }`}
            >
              {leftCard ? (
                renderDraggableCard(leftCard, true)
              ) : (
                <span className="text-indigo-300/50 text-xs text-center px-2">
                  拖入让你<br/>不舒服的卡
                </span>
              )}
            </div>
          </div>

          {/* 右侧：舒服区 */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/30">
              <span className="text-amber-400">☀️</span>
              <span className="text-amber-300 text-sm font-medium">舒服区</span>
            </div>
            <div 
              ref={rightZoneRef}
              className={`w-36 h-48 rounded-xl overflow-hidden transition-all ${
                draggingCard ? 'ring-2 ring-amber-400/50 ring-offset-2 ring-offset-[#0f0f23]' : ''
              } ${
                rightCard 
                  ? 'shadow-[0_0_25px_rgba(251,191,36,0.3)]' 
                  : 'border-2 border-dashed border-amber-400/40 bg-amber-500/10 flex items-center justify-center'
              }`}
            >
              {rightCard ? (
                renderDraggableCard(rightCard, true)
              ) : (
                <span className="text-amber-300/50 text-xs text-center px-2">
                  拖入让你<br/>舒服的卡
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 待分配的卡牌 */}
        {unassignedCards.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-[#8b8b9e] text-xs">↓ 拖动卡牌到上方区域 ↓</p>
            <div className="flex justify-center gap-4">
              {unassignedCards.map(card => renderDraggableCard(card))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-2">
          {leftCard && rightCard && (
            <>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={swapCardPositions}
                className="px-4 py-2 border border-white/10 text-[#8b8b9e] rounded-full text-sm flex items-center gap-2 hover:border-[#c9a959]/30"
              >
                <Shuffle className="w-4 h-4" />
                交换位置
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={confirmSetup}
                className="px-6 py-2 bg-[#c9a959] text-[#0f0f23] rounded-full text-sm font-medium"
              >
                确认，开始探索
              </motion.button>
            </>
          )}
        </div>
      </div>
    );
  };

  // 渲染卡牌区域（对话阶段）
  const renderDialogueZones = () => {
    // 当前显示的卡牌（考虑交换状态）
    const displayLeftCard = isSwapped ? rightCard : leftCard;
    const displayRightCard = isSwapped ? leftCard : rightCard;

    return (
      <div className="flex justify-center gap-8 items-start py-1">
        {/* 左侧：不舒服区 */}
        <div className="flex flex-col items-center gap-2">
          {/* 标签 - 不动 */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
            <span className="text-indigo-300">🌙</span>
            <span className="text-indigo-300 text-sm font-medium">不舒服区</span>
          </div>
          {/* 卡牌容器 - 固定位置，内部卡牌可能动 */}
          <div className="relative w-40 h-52 md:w-48 md:h-64 lg:w-52 lg:h-72">
            {/* 左边的卡牌 */}
            <motion.div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(99,102,241,0.3)] cursor-pointer group"
              animate={stage === 'swapping' ? { x: 200 } : { x: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              onClick={() => displayLeftCard && setPreviewCard(displayLeftCard)}
            >
              {displayLeftCard && (
                <>
                  <CompositeCard
                    word={displayLeftCard.word}
                    imageUrl={displayLeftCard.imageUrl}
                    imageOnly
                  />
                  {/* 放大提示 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* 右侧：舒服区 */}
        <div className="flex flex-col items-center gap-2">
          {/* 标签 - 不动 */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/30">
            <span className="text-amber-400">☀️</span>
            <span className="text-amber-300 text-sm font-medium">舒服区</span>
          </div>
          {/* 卡牌容器 - 固定位置，内部卡牌可能动 */}
          <div className="relative w-40 h-52 md:w-48 md:h-64 lg:w-52 lg:h-72">
            {/* 右边的卡牌 */}
            <motion.div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(251,191,36,0.3)] cursor-pointer group"
              animate={stage === 'swapping' ? { x: -200 } : { x: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              onClick={() => displayRightCard && setPreviewCard(displayRightCard)}
            >
              {displayRightCard && (
                <>
                  <CompositeCard
                    word={displayRightCard.word}
                    imageUrl={displayRightCard.imageUrl}
                    imageOnly
                  />
                  {/* 放大提示 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染对话区域
  const renderChat = () => (
    <div className="flex flex-col h-[28vh] md:h-[32vh] bg-[#1a1a2e]/50 rounded-xl border border-white/10 overflow-hidden">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-[#c9a959] text-[#0f0f23] rounded-br-md'
                  : 'bg-white/10 text-[#edf2f4] rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-[#8b8b9e] p-3 rounded-2xl rounded-bl-md text-sm">
              Om 正在感受...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="分享你的感受..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-[#edf2f4] placeholder-[#8b8b9e] focus:outline-none focus:border-[#c9a959]/50"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isAiThinking}
            className="px-4 py-2 bg-[#c9a959] text-[#0f0f23] rounded-full text-sm font-medium disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="relative min-h-dvh om-gradient-bg om-stars overflow-hidden flex flex-col">
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
          <motion.h1 
            className="text-lg font-serif text-[#c9a959] tracking-wider"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            舒服 VS. 不舒服
          </motion.h1>
        </div>
        <SettingsDrawer 
          provider={provider}
          onProviderChange={setProvider}
        />
      </header>

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* 初始选择卡组 */}
          {stage === 'init' && (
            <motion.div
              key="init"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-[#c9a959] text-lg font-serif mb-2">选择卡组</h2>
                <p className="text-[#8b8b9e] text-sm">系统将随机抽取2张卡牌</p>
              </div>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  onClick={() => startGame('classic')}
                  className="p-4 rounded-xl border-2 border-[#c9a959]/50 bg-[#c9a959]/10 hover:bg-[#c9a959]/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎴</span>
                    <div>
                      <p className="text-[#edf2f4] font-medium">经典卡牌</p>
                      <p className="text-[#8b8b9e] text-xs">88张原版OH卡，即时加载</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => startGame('ai')}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <p className="text-[#edf2f4] font-medium">AI 随机生成</p>
                      <p className="text-[#8b8b9e] text-xs">独一无二的画面，需等待</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* 加载中 */}
          {stage === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                className="w-16 h-16 border-2 border-[#c9a959]/40 border-t-[#c9a959] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-[#8b8b9e] text-sm">
                {deckSource === 'classic' ? '正在抽取卡牌...' : '正在生成卡牌...'}
              </p>
            </motion.div>
          )}

          {/* 分配阶段 - 拖拽 */}
          {stage === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="text-center mb-4">
                <p className="text-[#c9a959] text-lg font-serif mb-1">分配卡牌</p>
                <p className="text-[#8b8b9e] text-sm">
                  拖动卡牌放入对应区域
                </p>
              </div>
              
              {renderSetupZones()}
            </motion.div>
          )}

          {/* 探索与对话阶段 */}
          {(stage === 'initial' || stage === 'swapped' || stage === 'swapping' || stage === 'conclusion') && (
            <motion.div
              key="dialogue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-between overflow-hidden"
            >
              {/* 上方：卡牌区域 */}
              <div className="flex-shrink-0">
                {renderDialogueZones()}
                
                {/* Swap 提示 */}
                {stage === 'swapping' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-2"
                  >
                    <p className="text-[#c9a959] text-lg font-serif">卡牌位置互换中...</p>
                  </motion.div>
                )}
              </div>

              {/* 下方：对话区域 + 按钮 */}
              <div className="flex flex-col gap-2 mt-auto">
                {/* 对话区域 */}
                {stage !== 'swapping' && renderChat()}

                {/* 底部操作按钮 */}
                <div className="flex justify-center gap-3 py-1">
                {/* 第一轮探索后，AI说出交换提示时 -> 显示交换按钮 */}
                {stage === 'initial' && messages.some(m => 
                  m.role === 'assistant' && 
                  (m.content.includes('交换') || m.content.includes('互换') || m.content.includes('换一下') || m.content.includes('调换'))
                ) && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={triggerSwap}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-amber-400 text-white rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    交换卡牌位置
                  </motion.button>
                )}

                {/* 第二轮探索后，AI说出收尾提示时 -> 显示整合洞见 + 保存按钮 */}
                {stage === 'swapped' && messages.some(m => 
                  m.role === 'assistant' && 
                  (m.content.includes('一体两面') || m.content.includes('整合') || m.content.includes('收尾') || m.content.includes('重新看看'))
                ) && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={goToConclusion}
                      className="px-5 py-2 bg-[#c9a959] text-[#0f0f23] rounded-full text-sm font-medium"
                    >
                      整合洞见
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={saveConsultation}
                      className="px-4 py-2 border border-white/10 text-[#8b8b9e] rounded-full text-sm flex items-center gap-2 hover:border-[#c9a959]/30"
                    >
                      <Camera className="w-4 h-4" />
                      保存本次咨询
                    </motion.button>
                  </>
                )}

                {/* 收尾阶段 -> 可以保存和重新开始 */}
                {stage === 'conclusion' && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={saveConsultation}
                      className="px-4 py-2 border border-white/10 text-[#8b8b9e] rounded-full text-sm flex items-center gap-2 hover:border-[#c9a959]/30"
                    >
                      <Camera className="w-4 h-4" />
                      保存本次咨询
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleReset}
                      className="px-4 py-2 bg-[#c9a959] text-[#0f0f23] rounded-full text-sm font-medium"
                    >
                      重新开始
                    </motion.button>
                  </>
                )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 保存预览模态框 */}
      <SavePreviewModal
        isOpen={!!savePreviewUrl}
        imageUrl={savePreviewUrl}
        onClose={() => setSavePreviewUrl(null)}
        title="保存咨询记录"
      />

      {/* 卡片放大预览 */}
      <AnimatePresence>
        {previewCard && renderPreviewModal()}
      </AnimatePresence>


      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#c9a959]/5 to-transparent pointer-events-none" />
    </main>
  );
}
