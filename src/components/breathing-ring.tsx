'use client';

import { motion } from 'framer-motion';

interface BreathingRingProps {
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function BreathingRing({ isLoading, onClick, disabled }: BreathingRingProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="relative flex items-center justify-center focus:outline-none"
      aria-label="抽取卡牌"
    >
      {/* 外层光晕 */}
      <motion.div
        className="absolute w-56 h-56 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(201, 169, 89, 0.15) 0%, transparent 70%)',
        }}
        animate={isLoading ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        } : {
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: isLoading ? 1.5 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 中层呼吸环 */}
      <motion.div
        className="absolute w-44 h-44 rounded-full border-2"
        style={{
          borderColor: 'rgba(201, 169, 89, 0.4)',
          boxShadow: '0 0 30px rgba(201, 169, 89, 0.2)',
        }}
        animate={isLoading ? {
          scale: [1, 1.15, 1],
          borderColor: ['rgba(201, 169, 89, 0.4)', 'rgba(201, 169, 89, 0.8)', 'rgba(201, 169, 89, 0.4)'],
        } : {
          scale: [1, 1.05, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: isLoading ? 1.2 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 内层核心圆 */}
      <motion.div
        className="relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid rgba(201, 169, 89, 0.6)',
          boxShadow: '0 0 40px rgba(201, 169, 89, 0.3), inset 0 0 20px rgba(0,0,0,0.5)',
        }}
        whileHover={!isLoading && !disabled ? { 
          scale: 1.05,
          boxShadow: '0 0 60px rgba(201, 169, 89, 0.5), inset 0 0 20px rgba(0,0,0,0.5)',
        } : {}}
        whileTap={!isLoading && !disabled ? { scale: 0.95 } : {}}
        animate={isLoading ? {
          rotate: 360,
        } : {}}
        transition={isLoading ? {
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        } : {
          duration: 0.2,
        }}
      >
        {/* 中心文字/符号 */}
        <motion.div
          className="text-center"
          animate={isLoading ? {
            opacity: [0.5, 1, 0.5],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl text-[#c9a959]">☯</span>
              <span className="text-xs text-[#8b8b9e]">感应中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span 
                className="text-3xl font-serif"
                style={{ 
                  color: '#c9a959',
                  fontFamily: "'Cormorant Garamond', serif",
                  textShadow: '0 0 10px rgba(201, 169, 89, 0.5)'
                }}
              >
                ॐ
              </span>
              <span className="text-xs text-[#8b8b9e] tracking-widest">抽 牌</span>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* 装饰性粒子 */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#c9a959]"
          style={{
            opacity: 0.4,
          }}
          animate={{
            x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
            y: [0, Math.sin(i * 60 * Math.PI / 180) * 100],
            opacity: [0.4, 0, 0.4],
            scale: [1, 0.5, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </button>
  );
}
