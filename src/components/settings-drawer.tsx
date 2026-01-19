'use client';

import { Settings, ExternalLink, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import type { AIProvider, DeckStyle } from '@/types';

interface SettingsDrawerProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  deckStyle?: DeckStyle;
  onDeckStyleChange?: (style: DeckStyle) => void;
}

export function SettingsDrawer({ 
  provider, 
  onProviderChange,
  deckStyle = 'abstract',
  onDeckStyleChange
}: SettingsDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#8b8b9e] hover:text-[#edf2f4] hover:bg-white/5"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="bg-[#0f0f23] border-t border-[#c9a959]/20">
        <DrawerHeader className="border-b border-white/5 pb-4">
          <DrawerTitle className="text-[#edf2f4] font-serif flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#c9a959]" />
            设置
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-6 space-y-6">
          {/* 卡组风格选择 */}
          {onDeckStyleChange && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#edf2f4]">卡组风格</h3>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${deckStyle === 'figurative' ? 'text-[#c9a959]' : 'text-[#8b8b9e]'}`}>
                    具象
                  </span>
                  <Switch
                    checked={deckStyle === 'abstract'}
                    onCheckedChange={(checked) => 
                      onDeckStyleChange(checked ? 'abstract' : 'figurative')
                    }
                    className="data-[state=checked]:bg-[#c9a959]"
                  />
                  <span className={`text-sm ${deckStyle === 'abstract' ? 'text-[#c9a959]' : 'text-[#8b8b9e]'}`}>
                    抽象
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI 模型选择 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#edf2f4]">AI 模型</h3>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#edf2f4]">
                  {provider === 'google' ? 'Google Gemini' : '字节跳动豆包'}
                </span>
                <span className="text-xs text-[#8b8b9e]">
                  {provider === 'google' 
                    ? '更强的创意与理解能力' 
                    : '国内访问更稳定'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs ${provider === 'google' ? 'text-[#c9a959]' : 'text-[#8b8b9e]'}`}>
                  Gemini
                </span>
                <Switch
                  checked={provider === 'doubao'}
                  onCheckedChange={(checked) => 
                    onProviderChange(checked ? 'doubao' : 'google')
                  }
                  className="data-[state=checked]:bg-[#c9a959]"
                />
                <span className={`text-xs ${provider === 'doubao' ? 'text-[#c9a959]' : 'text-[#8b8b9e]'}`}>
                  豆包
                </span>
              </div>
            </div>
          </div>

          {/* 关于 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#edf2f4]">关于</h3>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#edf2f4]">Om Card</span>
                  <span className="text-xs text-[#8b8b9e]">v1.1.2</span>
                </div>
                <p className="text-xs text-[#8b8b9e] leading-relaxed">
                  一款遵循学术规范的数字化心理投射工具，基于 OH Cards 原理。
                </p>
              </div>

              <a
                href="https://www.oh-cards-institute.org/methods/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#c9a959]/30 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[#edf2f4]">OH Cards Institute</span>
                  <span className="text-xs text-[#8b8b9e]">了解 OH 卡的学术背景</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[#8b8b9e]" />
              </a>
            </div>
          </div>

          {/* 致谢 */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-center text-xs text-[#8b8b9e] flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-[#c9a959]" />
              <span>致敬 Ely Raman 与 OH Cards 原创团队</span>
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
