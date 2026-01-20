'use client';

import { motion } from 'framer-motion';
import { Clock, User, Sparkles, Map, Infinity, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface PlayMode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: { icon: React.ReactNode; text: string }[];
  status: 'active' | 'coming_soon';
  href: string;
}

const PLAY_MODES: PlayMode[] = [
  {
    id: 'single',
    title: '当下映照',
    subtitle: 'The Daily Mirror',
    description: '抽取一组图文，觉察当下的潜意识状态。',
    tags: [
      { icon: <User className="w-3 h-3" />, text: '1人' },
      { icon: <Clock className="w-3 h-3" />, text: '5分钟' },
    ],
    status: 'active',
    href: '/play/single',
  },
  {
    id: 'flip',
    title: '舒服区与不舒服区',
    subtitle: 'The Paradox Flip',
    description: '二元对立整合。打破惯性，在不舒服中寻找资源。',
    tags: [
      { icon: <User className="w-3 h-3" />, text: '1人' },
      { icon: <RefreshCw className="w-3 h-3" />, text: '3选2' },
      { icon: <Clock className="w-3 h-3" />, text: '深度整合' },
    ],
    status: 'active',
    href: '/play/flip',
  },
  {
    id: 'journey',
    title: '英雄之旅',
    subtitle: "The Hero's Journey",
    description: '过去、现在、未来。探索生命故事的流向。',
    tags: [
      { icon: <User className="w-3 h-3" />, text: '1人' },
      { icon: <Clock className="w-3 h-3" />, text: '15分钟' },
      { icon: <Map className="w-3 h-3" />, text: '3张牌' },
    ],
    status: 'coming_soon',
    href: '#',
  },
  {
    id: 'freeflow',
    title: '自由联想',
    subtitle: 'Free Flow',
    description: '无限制抽牌，适合资深玩家深度探索。',
    tags: [
      { icon: <User className="w-3 h-3" />, text: '1人' },
      { icon: <Infinity className="w-3 h-3" />, text: '无限' },
    ],
    status: 'coming_soon',
    href: '#',
  },
];

interface ModeSelectorProps {
  className?: string;
}

export function ModeSelector({ className = '' }: ModeSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {PLAY_MODES.map((mode, index) => (
        <ModeCard key={mode.id} mode={mode} index={index} />
      ))}
    </div>
  );
}

function ModeCard({ mode, index }: { mode: PlayMode; index: number }) {
  const isActive = mode.status === 'active';
  
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2 }}
      className={`
        relative p-5 rounded-2xl border transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-br from-[#1a1a2e] to-[#0f0f23] border-[#c9a959]/30 hover:border-[#c9a959]/60 hover:shadow-[0_0_30px_rgba(201,169,89,0.15)] cursor-pointer' 
          : 'bg-[#1a1a2e]/50 border-white/5 opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Coming Soon 标签 */}
      {!isActive && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] text-[#8b8b9e] bg-white/5 px-2 py-1 rounded-full">
            即将推出
          </span>
        </div>
      )}
      
      {/* 标题区 */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${isActive ? 'bg-[#c9a959]/10' : 'bg-white/5'}
        `}>
          <Sparkles className={`w-5 h-5 ${isActive ? 'text-[#c9a959]' : 'text-[#8b8b9e]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-serif ${isActive ? 'text-[#edf2f4]' : 'text-[#8b8b9e]'}`}>
            {mode.title}
          </h3>
          <p className="text-xs text-[#8b8b9e]">{mode.subtitle}</p>
        </div>
      </div>
      
      {/* 描述 */}
      <p className={`text-sm mb-4 ${isActive ? 'text-[#8b8b9e]' : 'text-[#8b8b9e]/60'}`}>
        {mode.description}
      </p>
      
      {/* 标签 */}
      <div className="flex flex-wrap gap-2">
        {mode.tags.map((tag, i) => (
          <span 
            key={i}
            className={`
              inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
              ${isActive ? 'bg-white/5 text-[#8b8b9e]' : 'bg-white/3 text-[#8b8b9e]/50'}
            `}
          >
            {tag.icon}
            {tag.text}
          </span>
        ))}
      </div>
      
      {/* Active 模式的箭头指示 */}
      {isActive && (
        <motion.div 
          className="absolute right-5 top-1/2 -translate-y-1/2 text-[#c9a959]"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
  
  if (isActive) {
    return <Link href={mode.href}>{content}</Link>;
  }
  
  return content;
}
