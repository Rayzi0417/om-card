'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Camera, SkipForward, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { CompositeCard } from '@/components/composite-card';
import { SettingsDrawer } from '@/components/settings-drawer';
import { SavePreviewModal } from '@/components/save-preview-modal';
import { getSagaCard } from '@/lib/prompts/generator';
import type { AIProvider } from '@/types';

// 英雄之旅的10个步骤定义
const HERO_STEPS = [
  { step: 1, title: '英雄', subtitle: 'The Hero', question: '他是谁？有什么特质？' },
  { step: 2, title: '天赋', subtitle: 'The Talent', question: '他拥有什么天赋或资源？' },
  { step: 3, title: '召唤', subtitle: 'The Call', question: '发生了什么事促使他踏上旅程？' },
  { step: 4, title: '伙伴', subtitle: 'The Companion', question: '谁来帮助他？（导师/伙伴）' },
  { step: 5, title: '伙伴之力', subtitle: "Companion's Power", question: '伙伴的超能力是什么？' },
  { step: 6, title: '大魔王', subtitle: 'The Demon', question: '遇到了什么大魔王（最大障碍）？' },
  { step: 7, title: '魔王之力', subtitle: "Demon's Power", question: '魔王最强的技能或困难点在哪？' },
  { step: 8, title: '克服', subtitle: 'Overcoming', question: '英雄如何克服障碍？（关键行动）' },
  { step: 9, title: '新生', subtitle: 'Aftermath', question: '任务完成后，生活变成了什么样？' },
  { step: 10, title: '使命', subtitle: 'The Mission', question: '他的使命是什么？如何分享经验？' },
];

// 卡牌数据接口（SAGA 卡只有图像，无文字）
interface CardData {
  id: string;
  imageUrl: string;
}

// 故事日志接口
interface StoryEntry {
  step: number;
  card: CardData;
  question: string;
  userAnswer: string;
}

// 游戏阶段
type GameStage = 'intro' | 'playing' | 'generating' | 'summary' | 'reflection' | 'blessing';

// 对话消息
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Mode C: 英雄之旅 (The Hero's Journey)
 * 基于 SAGA 卡与 Joseph Campbell 神话学理论的 10 步骤结构化叙事玩法
 */
export default function HeroJourneyPage() {
  // 基础状态
  const [provider, setProvider] = useState<AIProvider>('doubao');
  
  // 游戏状态
  const [stage, setStage] = useState<GameStage>('intro');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [storyLog, setStoryLog] = useState<StoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 对话状态
  const [aiQuestion, setAiQuestion] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // 总结状态
  const [epicSummary, setEpicSummary] = useState('');
  
  // 收尾对话状态
  const [reflectionMessages, setReflectionMessages] = useState<ChatMessage[]>([]);
  const [reflectionInput, setReflectionInput] = useState('');
  const [blessing, setBlessing] = useState('');
  
  // 卡片预览状态
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  
  // 保存功能
  const [savePreviewUrl, setSavePreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // 为当前步骤抽卡（内联 AI 问题获取逻辑）
  const drawCardForStep = useCallback(async (step: number) => {
    setIsLoading(true);
    
    try {
      // 使用 SAGA 英雄之旅卡组
      const usedIds = storyLog.map(entry => parseInt(entry.card.id));
      const card = getSagaCard(usedIds);
      
      setCurrentCard({
        id: card.id.toString(),
        imageUrl: card.imageUrl,
      });
      
      // 获取 AI 问题（传入卡牌图像让 AI 看见）
      setIsAiThinking(true);
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '（用户抽到了这张卡，请根据卡牌画面提问）' }],
            provider,
            mode: 'hero',
            step,
            imageUrl: card.imageUrl, // 传递卡牌图像
            storyLog: storyLog.map(entry => ({
              step: entry.step,
              answer: entry.userAnswer,
            })),
          }),
        });

        if (!response.ok) throw new Error('获取问题失败');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        let question = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          question += decoder.decode(value, { stream: true });
          setAiQuestion(question);
        }
      } catch (error) {
        console.error('获取问题失败:', error);
        // 使用默认问题
        const stepDef = HERO_STEPS.find(s => s.step === step);
        setAiQuestion(stepDef?.question || '请描述你看到的画面...');
      } finally {
        setIsAiThinking(false);
      }
    } catch (error) {
      console.error('抽卡失败:', error);
      toast.error('抽卡失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [storyLog, provider]);

  // 开始游戏
  const startJourney = useCallback(() => {
    setStage('playing');
    setCurrentStep(1);
    drawCardForStep(1);
  }, [drawCardForStep]);

  // 提交用户回答
  const submitAnswer = useCallback(async () => {
    if (!inputValue.trim() || !currentCard) return;
    
    const stepDef = HERO_STEPS.find(s => s.step === currentStep);
    
    // 记录到故事日志
    const newEntry: StoryEntry = {
      step: currentStep,
      card: currentCard,
      question: stepDef?.question || aiQuestion,
      userAnswer: inputValue.trim(),
    };
    
    setStoryLog(prev => [...prev, newEntry]);
    setInputValue('');
    
    // 检查是否完成所有步骤
    if (currentStep >= 10) {
      // 进入总结生成阶段
      setStage('generating');
      await generateEpicSummary([...storyLog, newEntry]);
    } else {
      // 进入下一步
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setCurrentCard(null);
      setAiQuestion('');
      drawCardForStep(nextStep);
    }
  }, [inputValue, currentCard, currentStep, storyLog, aiQuestion, drawCardForStep]);

  // 跳过当前步骤
  const skipStep = useCallback(() => {
    if (!currentCard) return;
    
    const stepDef = HERO_STEPS.find(s => s.step === currentStep);
    
    // 记录跳过的步骤
    const newEntry: StoryEntry = {
      step: currentStep,
      card: currentCard,
      question: stepDef?.question || aiQuestion,
      userAnswer: '（英雄选择了沉默）',
    };
    
    setStoryLog(prev => [...prev, newEntry]);
    
    toast('英雄有时候也会沉默。让我们继续看下一步...', {
      icon: '🤫',
    });
    
    if (currentStep >= 10) {
      setStage('generating');
      generateEpicSummary([...storyLog, newEntry]);
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setCurrentCard(null);
      setAiQuestion('');
      drawCardForStep(nextStep);
    }
  }, [currentCard, currentStep, storyLog, aiQuestion, drawCardForStep]);

  // 生成英雄传记（只生成故事部分）
  const generateEpicSummary = useCallback(async (finalLog: StoryEntry[]) => {
    setIsAiThinking(true);
    
    try {
      const storyContext = finalLog.map(entry => {
        const stepDef = HERO_STEPS.find(s => s.step === entry.step);
        return `【${stepDef?.title}】${entry.userAnswer}`;
      }).join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: storyContext }],
          provider,
          mode: 'hero',
          step: 11, // 生成故事
          storyLog: finalLog.map(entry => ({
            step: entry.step,
            answer: entry.userAnswer,
          })),
        }),
      });

      if (!response.ok) throw new Error('生成失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let summary = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        summary += decoder.decode(value, { stream: true });
        setEpicSummary(summary);
      }
      
      // 显示故事，让用户有时间回顾和保存
      setStage('summary');
    } catch (error) {
      console.error('生成总结失败:', error);
      toast.error('生成英雄传记失败');
      setEpicSummary('这位英雄的故事，将由你自己书写...');
      setStage('summary');
    } finally {
      setIsAiThinking(false);
    }
  }, [provider]);

  // 开始反思对话
  const startReflection = useCallback(async () => {
    setStage('reflection');
    setIsAiThinking(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '（用户看完了英雄传记，请开始反思对话）' }],
          provider,
          mode: 'hero',
          step: 12, // 反思阶段
          storyLog: storyLog.map(entry => ({
            step: entry.step,
            answer: entry.userAnswer,
          })),
        }),
      });

      if (!response.ok) throw new Error('获取问题失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let question = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        question += decoder.decode(value, { stream: true });
      }
      
      setReflectionMessages([{ role: 'assistant', content: question }]);
    } catch (error) {
      console.error('开始反思失败:', error);
      setReflectionMessages([{ 
        role: 'assistant', 
        content: '这位英雄的旅程，有没有让你想起自己生命中的某段经历？在创造这个故事的过程中，你有什么感受或发现？' 
      }]);
    } finally {
      setIsAiThinking(false);
    }
  }, [provider, storyLog]);

  // 发送反思对话
  const sendReflection = useCallback(async () => {
    if (!reflectionInput.trim()) return;
    
    const userMessage = reflectionInput.trim();
    setReflectionInput('');
    const newMessages = [...reflectionMessages, { role: 'user' as const, content: userMessage }];
    setReflectionMessages(newMessages);
    setIsAiThinking(true);
    
    // 计算用户消息轮次
    const userTurnCount = newMessages.filter(m => m.role === 'user').length;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          provider,
          mode: 'hero',
          step: 12, // 反思阶段
          turnCount: userTurnCount, // 传入轮次信息
          storyLog: storyLog.map(entry => ({
            step: entry.step,
            answer: entry.userAnswer,
          })),
        }),
      });

      if (!response.ok) throw new Error('对话失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let reply = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
      }
      
      setReflectionMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('对话失败:', error);
      setReflectionMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '我听到了你的分享... 谢谢你的坦诚。点击下方的"结束对话"按钮，让我为你送上祝福。' 
      }]);
    } finally {
      setIsAiThinking(false);
    }
  }, [reflectionInput, reflectionMessages, provider, storyLog]);

  // 进入祝福阶段
  const goToBlessing = useCallback(async () => {
    setStage('blessing');
    setIsAiThinking(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '（请送上最后的祝福）' }],
          provider,
          mode: 'hero',
          step: 13, // 祝福阶段
          storyLog: storyLog.map(entry => ({
            step: entry.step,
            answer: entry.userAnswer,
          })),
        }),
      });

      if (!response.ok) throw new Error('生成祝福失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let blessingText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        blessingText += decoder.decode(value, { stream: true });
        setBlessing(blessingText);
      }
    } catch (error) {
      console.error('生成祝福失败:', error);
      setBlessing('愿你也能像这位英雄一样，勇敢地书写自己的传奇。每个人心中都有一位英雄，而你，正是那位英雄。Om.');
    } finally {
      setIsAiThinking(false);
    }
  }, [provider, storyLog]);

  // 保存英雄史诗
  const saveEpic = useCallback(async () => {
    if (storyLog.length === 0) {
      toast.error('没有可保存的故事');
      return;
    }

    setIsSaving(true);
    toast.loading('正在生成英雄史诗...', { id: 'saving' });

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 画布尺寸
      canvas.width = 400;
      canvas.height = 900;

      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#0f0f23');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 标题
      ctx.fillStyle = '#c9a959';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('英雄之旅', canvas.width / 2, 40);
      
      ctx.fillStyle = '#8b8b9e';
      ctx.font = '12px sans-serif';
      ctx.fillText("The Hero's Journey", canvas.width / 2, 58);

      // 加载图片函数
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          if (src.startsWith('http') && !src.startsWith(window.location.origin)) {
            img.crossOrigin = 'anonymous';
          }
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('图片加载失败'));
          img.src = src.startsWith('data:') || src.startsWith('http') 
            ? src 
            : `${window.location.origin}${src}`;
        });
      };

      // 绘制 10 张卡片网格 (5x2)
      const gridStartY = 80;
      const cardWidth = 70;
      const cardHeight = 90;
      const gap = 8;
      const cols = 5;

      for (let i = 0; i < storyLog.length; i++) {
        const entry = storyLog[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 20 + col * (cardWidth + gap);
        const y = gridStartY + row * (cardHeight + gap + 15);

        try {
          const img = await loadImg(entry.card.imageUrl);
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, cardWidth, cardHeight, 6);
          ctx.clip();
          ctx.drawImage(img, x, y, cardWidth, cardHeight);
          ctx.restore();
        } catch {
          ctx.fillStyle = '#2a2a3e';
          ctx.fillRect(x, y, cardWidth, cardHeight);
        }

        // 步骤标签
        ctx.fillStyle = '#c9a959';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(HERO_STEPS[i]?.title || '', x + cardWidth / 2, y + cardHeight + 12);
      }

      // 故事背景
      const storyY = gridStartY + 2 * (cardHeight + gap + 15) + 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(20, storyY, 360, canvas.height - storyY - 40, 12);
      ctx.fill();

      // 故事标题
      ctx.fillStyle = '#c9a959';
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'left';
      ctx.fillText('📜 英雄传记', 30, storyY + 25);

      // 故事文本换行
      ctx.fillStyle = '#edf2f4';
      ctx.font = '12px sans-serif';
      const maxWidth = 340;
      const lineHeight = 18;
      let textY = storyY + 50;
      
      const words = epicSummary.split('');
      let line = '';
      
      for (const char of words) {
        const testLine = line + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, 30, textY);
          line = char;
          textY += lineHeight;
          if (textY > canvas.height - 50) break;
        } else {
          line = testLine;
        }
      }
      if (line && textY <= canvas.height - 50) {
        ctx.fillText(line, 30, textY);
      }

      // 页脚
      ctx.fillStyle = '#8b8b9e';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Om Card · ${new Date().toLocaleDateString('zh-CN')}`, canvas.width / 2, canvas.height - 15);

      setSavePreviewUrl(canvas.toDataURL('image/png'));
      toast.success('英雄史诗生成成功！', { id: 'saving' });
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试', { id: 'saving' });
    } finally {
      setIsSaving(false);
    }
  }, [storyLog, epicSummary]);

  // 重新开始
  const restart = useCallback(() => {
    setStage('intro');
    setCurrentStep(1);
    setCurrentCard(null);
    setStoryLog([]);
    setAiQuestion('');
    setInputValue('');
    setEpicSummary('');
    setReflectionMessages([]);
    setReflectionInput('');
    setBlessing('');
    setPreviewCard(null);
    setSavePreviewUrl(null);
  }, []);

  // 当前步骤定义
  const currentStepDef = HERO_STEPS.find(s => s.step === currentStep);

  return (
    <main className="relative min-h-dvh om-gradient-bg om-stars flex flex-col">
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
            英雄之旅
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
          {/* 介绍页 */}
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c9a959]/20 to-[#c9a959]/5 flex items-center justify-center mb-6 border border-[#c9a959]/20"
              >
                <span className="text-4xl">⚔️</span>
              </motion.div>
              
              <h2 className="text-2xl font-serif text-[#edf2f4] mb-3">
                每个人心中都有一位英雄
              </h2>
              <p className="text-[#8b8b9e] text-sm leading-relaxed mb-8 max-w-sm">
                通过 10 张卡牌，我们将一起探索你内心深处的英雄故事。<br/>
                这是一段属于你的神话之旅。
              </p>
              
              <div className="space-y-3 mb-8 text-left">
                {HERO_STEPS.slice(0, 5).map((step, i) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#c9a959]/10 flex items-center justify-center text-[#c9a959] text-xs">
                      {step.step}
                    </span>
                    <span className="text-[#8b8b9e]">{step.title}</span>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[#8b8b9e] text-xs pl-9"
                >
                  ... 还有 5 个章节等待揭晓
                </motion.div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={startJourney}
                className="px-8 py-3 rounded-full bg-[#c9a959] text-[#0f0f23] font-medium hover:bg-[#b8942d] transition-colors flex items-center gap-2"
              >
                开启旅程
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* 游戏进行中 */}
          {stage === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* 进度条 */}
              <div className="mb-3 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#c9a959] text-sm font-serif">
                    第 {currentStep} 章：{currentStepDef?.title}
                  </span>
                  <span className="text-[#8b8b9e] text-xs">
                    {currentStep}/10
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#c9a959]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* 已抽取卡片历史（上方展示） */}
              {storyLog.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-shrink-0 mb-3"
                >
                  <p className="text-[#8b8b9e] text-xs mb-2">📖 故事进程</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {storyLog.map((entry, i) => (
                      <motion.div
                        key={entry.step}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex-shrink-0 cursor-pointer group"
                        onClick={() => setPreviewCard({ id: entry.card.id, imageUrl: entry.card.imageUrl })}
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 group-hover:border-[#c9a959]/50 transition-colors">
                          <img
                            src={entry.card.imageUrl}
                            alt={HERO_STEPS[i]?.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] text-[#8b8b9e] text-center mt-1 truncate w-12">
                          {HERO_STEPS[i]?.title}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 当前卡牌区域 */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <motion.div
                      className="w-16 h-16 border-2 border-[#c9a959] border-t-transparent rounded-full mx-auto mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-[#8b8b9e] text-sm">正在抽取第 {currentStep} 张卡...</p>
                  </motion.div>
                ) : currentCard && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-[180px] cursor-pointer"
                    onClick={() => setPreviewCard(currentCard)}
                  >
                    <CompositeCard
                      word={{ en: '', cn: '' }}
                      imageUrl={currentCard.imageUrl}
                      imageOnly={true}
                    />
                    <p className="text-[10px] text-[#8b8b9e] text-center mt-2">点击放大查看</p>
                  </motion.div>
                )}
              </div>

              {/* AI 问题 */}
              {currentCard && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0"
                >
                  <p className="text-[#8b8b9e] text-xs mb-1">📜 神话记录者</p>
                  <p className="text-[#edf2f4] text-sm leading-relaxed">
                    {isAiThinking ? (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        正在思考问题...
                      </motion.span>
                    ) : (
                      aiQuestion || currentStepDef?.question
                    )}
                  </p>
                </motion.div>
              )}

              {/* 输入区域 */}
              {currentCard && !isAiThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 flex-shrink-0"
                >
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="描述你看到的画面..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-[#edf2f4] text-sm placeholder:text-[#8b8b9e]/50 resize-none focus:outline-none focus:border-[#c9a959]/50"
                    rows={2}
                  />
                  
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={skipStep}
                      className="px-4 py-2 rounded-full border border-white/10 text-[#8b8b9e] text-sm hover:border-[#c9a959]/30 transition-colors flex items-center gap-2"
                    >
                      <SkipForward className="w-4 h-4" />
                      跳过
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={!inputValue.trim()}
                      className="flex-1 py-2 rounded-full bg-[#c9a959] text-[#0f0f23] text-sm font-medium hover:bg-[#b8942d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      继续旅程
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 生成中 */}
          {stage === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                className="w-16 h-16 border-2 border-[#c9a959] border-t-transparent rounded-full mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <h2 className="text-xl font-serif text-[#edf2f4] mb-3">
                正在书写英雄传记...
              </h2>
              <p className="text-[#8b8b9e] text-sm max-w-sm">
                {epicSummary ? epicSummary.slice(0, 50) + '...' : '神话记录者正在整理你的故事...'}
              </p>
            </motion.div>
          )}

          {/* 总结页（显示故事，用户可选择是否反思） */}
          {stage === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-auto"
              ref={summaryRef}
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-serif text-[#c9a959] mb-2">
                  🏆 英雄传记
                </h2>
                <p className="text-[#8b8b9e] text-xs">你的神话之旅已完成</p>
              </div>

              {/* 10 张卡片网格 */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {storyLog.map((entry, i) => (
                  <motion.div
                    key={entry.step}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer"
                    onClick={() => setPreviewCard(entry.card)}
                  >
                    <img
                      src={entry.card.imageUrl}
                      alt={HERO_STEPS[i]?.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>

              {/* 故事文本 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4"
              >
                <p className="text-[#edf2f4] text-sm leading-relaxed whitespace-pre-wrap">
                  {epicSummary}
                </p>
              </motion.div>

              {/* 反思邀请 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="p-4 bg-gradient-to-br from-[#c9a959]/10 to-transparent rounded-2xl border border-[#c9a959]/20 mb-4"
              >
                <p className="text-[#c9a959] text-xs mb-2">📜 神话记录者</p>
                <p className="text-[#edf2f4] text-sm leading-relaxed">
                  这位英雄的故事已经写完了。如果你愿意，我们可以聊聊——这段旅程让你想到了什么？
                </p>
              </motion.div>

              {/* 操作按钮 */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex flex-col gap-3 mt-auto pb-safe"
              >
                <div className="flex gap-3">
                  <button
                    onClick={saveEpic}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-full border border-[#c9a959]/30 text-[#c9a959] text-sm hover:bg-[#c9a959]/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {isSaving ? '生成中...' : '保存图片'}
                  </button>
                  <button
                    onClick={startReflection}
                    className="flex-1 py-3 rounded-full bg-[#c9a959] text-[#0f0f23] text-sm font-medium hover:bg-[#b8942d] transition-colors"
                  >
                    💬 开始对话
                  </button>
                </div>
                <button
                  onClick={goToBlessing}
                  className="py-2 text-[#8b8b9e] text-xs hover:text-[#edf2f4] transition-colors"
                >
                  跳过对话，直接结束 →
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* 反思对话阶段 */}
          {stage === 'reflection' && (
            <motion.div
              key="reflection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* 顶部：卡片缩略图 */}
              <div className="flex-shrink-0 mb-3">
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {storyLog.map((entry, i) => (
                    <div
                      key={entry.step}
                      className="w-8 h-10 flex-shrink-0 rounded overflow-hidden cursor-pointer"
                      onClick={() => setPreviewCard(entry.card)}
                    >
                      <img
                        src={entry.card.imageUrl}
                        alt={HERO_STEPS[i]?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 故事摘要（可折叠） */}
              <div className="flex-shrink-0 mb-3 p-3 bg-white/5 rounded-xl border border-white/10 max-h-24 overflow-y-auto">
                <p className="text-[#8b8b9e] text-xs leading-relaxed line-clamp-4">
                  {epicSummary}
                </p>
              </div>

              {/* 对话区域 */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {reflectionMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl ${
                      msg.role === 'assistant'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-[#c9a959]/20 ml-8'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <p className="text-[#c9a959] text-xs mb-1">📜 神话记录者</p>
                    )}
                    <p className="text-[#edf2f4] text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </motion.div>
                ))}
                {isAiThinking && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <motion.p
                      className="text-[#8b8b9e] text-sm"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      正在思考...
                    </motion.p>
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="flex-shrink-0 space-y-3">
                <textarea
                  value={reflectionInput}
                  onChange={(e) => setReflectionInput(e.target.value)}
                  placeholder="分享你的感受..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-[#edf2f4] text-sm placeholder:text-[#8b8b9e]/50 resize-none focus:outline-none focus:border-[#c9a959]/50"
                  rows={2}
                />
                <div className="flex gap-3">
                  <button
                    onClick={goToBlessing}
                    className="px-4 py-2 rounded-full border border-white/10 text-[#8b8b9e] text-sm hover:border-[#c9a959]/30 transition-colors"
                  >
                    结束对话
                  </button>
                  <button
                    onClick={sendReflection}
                    disabled={!reflectionInput.trim() || isAiThinking}
                    className="flex-1 py-2 rounded-full bg-[#c9a959] text-[#0f0f23] text-sm font-medium hover:bg-[#b8942d] transition-colors disabled:opacity-50"
                  >
                    发送
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 祝福阶段 */}
          {stage === 'blessing' && (
            <motion.div
              key="blessing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-auto"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-serif text-[#c9a959] mb-2">
                  ✨ 旅程完成
                </h2>
              </div>

              {/* 10 张卡片网格 */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {storyLog.map((entry, i) => (
                  <motion.div
                    key={entry.step}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer"
                    onClick={() => setPreviewCard(entry.card)}
                  >
                    <img
                      src={entry.card.imageUrl}
                      alt={HERO_STEPS[i]?.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>

              {/* 故事文本 */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-4 max-h-32 overflow-y-auto">
                <p className="text-[#8b8b9e] text-xs leading-relaxed">
                  {epicSummary}
                </p>
              </div>

              {/* 祝福语 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-gradient-to-br from-[#c9a959]/10 to-transparent rounded-2xl border border-[#c9a959]/20 mb-4"
              >
                {isAiThinking ? (
                  <motion.p
                    className="text-[#c9a959] text-sm text-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    正在送上祝福...
                  </motion.p>
                ) : (
                  <p className="text-[#edf2f4] text-sm leading-relaxed text-center">
                    {blessing}
                  </p>
                )}
              </motion.div>

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-auto pb-safe">
                <button
                  onClick={restart}
                  className="px-4 py-3 rounded-full border border-white/10 text-[#8b8b9e] text-sm hover:border-[#c9a959]/30 transition-colors"
                >
                  重新开始
                </button>
                <button
                  onClick={saveEpic}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-full bg-[#c9a959] text-[#0f0f23] text-sm font-medium hover:bg-[#b8942d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isSaving ? '生成中...' : '保存英雄史诗'}
                </button>
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
        title="保存英雄史诗"
      />

      {/* 卡片放大预览模态框 */}
      <AnimatePresence>
        {previewCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setPreviewCard(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-[320px]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewCard.imageUrl}
                alt="卡片预览"
                className="w-full rounded-xl shadow-2xl"
              />
              <p className="text-center text-[#8b8b9e] text-xs mt-4">点击空白处关闭</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#c9a959]/5 to-transparent pointer-events-none" />
    </main>
  );
}
