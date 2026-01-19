'use client';

import { motion } from 'framer-motion';
import { ModeSelector } from '@/components/mode-selector';
import { SettingsDrawer } from '@/components/settings-drawer';
import { useState } from 'react';
import type { AIProvider } from '@/types';

/**
 * Om Card 首页 - 玩法选择
 */
export default function Home() {
  const [provider, setProvider] = useState<AIProvider>('google');

  return (
    <main className="relative min-h-dvh om-gradient-bg om-stars overflow-hidden">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#c9a959]/5 to-transparent pointer-events-none" />
      
      {/* 头部 */}
      <header className="relative z-10 flex items-center justify-between p-4 pt-safe">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 
            className="text-2xl font-serif text-[#c9a959] tracking-wider"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Om Card
          </h1>
          <p className="text-xs text-[#8b8b9e] mt-1">潜意识投射工具</p>
        </motion.div>
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

      {/* 介绍区域 */}
      <section className="relative z-10 px-4 pt-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            {/* 装饰性图标 */}
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c9a959]/20 to-[#c9a959]/5 flex items-center justify-center"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(201, 169, 89, 0.1)',
                  '0 0 40px rgba(201, 169, 89, 0.2)',
                  '0 0 20px rgba(201, 169, 89, 0.1)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-2xl">☯</span>
            </motion.div>
            
            <h2 className="text-lg text-[#edf2f4] font-serif mb-2">
              探索内心的镜子
            </h2>
            <p className="text-sm text-[#8b8b9e] leading-relaxed">
              基于 OH Cards 学术方法论，通过随机图文组合<br/>
              映射潜意识，发现内心深处的声音
            </p>
          </div>
        </motion.div>
      </section>

      {/* 玩法选择 */}
      <section className="relative z-10 px-4 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <h3 className="text-sm text-[#8b8b9e] mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#c9a959]/30" />
            选择玩法
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#c9a959]/30" />
          </h3>
          
          <ModeSelector />
        </motion.div>
      </section>

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
