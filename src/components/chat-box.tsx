'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AIProvider } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  imageContext?: string;
  imageUrl?: string;
  provider: AIProvider;
}

export function ChatBox({ isOpen, onClose, imageContext, imageUrl, provider }: ChatBoxProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息
  const sendMessage = useCallback(async (userMessage: string, isInit = false) => {
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };

    const updatedMessages = isInit ? [newUserMessage] : [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          imageContext,
          provider,
        }),
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          
          // 直接设置完整文本，避免重复
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = fullText;
            }
            return [...newMessages];
          });
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '抱歉，对话出现了问题。' },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [messages, imageContext, provider, scrollToBottom]);

  // 初始消息
  useEffect(() => {
    if (isOpen && !initialized && imageContext) {
      setInitialized(true);
      sendMessage('我抽到了一张卡牌，请引导我探索。', true);
    }
  }, [isOpen, initialized, imageContext, sendMessage]);

  // 重置
  useEffect(() => {
    if (!imageContext) {
      setInitialized(false);
      setMessages([]);
      setInput('');
    }
  }, [imageContext]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f23]">
      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/60 hover:text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="h-full flex flex-col md:flex-row">
        {/* 左侧：卡牌 */}
        <div className="flex-shrink-0 flex items-center justify-center p-6 md:w-1/2 md:h-full bg-gradient-to-b md:bg-gradient-to-r from-[#1a1a2e] to-[#0f0f23]">
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div 
                className="w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-[#c9a959]/30"
                style={{ boxShadow: '0 0 60px rgba(201, 169, 89, 0.2)' }}
              >
                <img src={imageUrl} alt="卡牌" className="w-full h-full object-cover" />
              </div>
              {imageContext && (
                <p className="text-center text-sm text-[#8b8b9e] mt-4">{imageContext}</p>
              )}
            </motion.div>
          )}
        </div>

        {/* 右侧：对话 */}
        <div className="flex-1 flex flex-col min-h-0 md:w-1/2">
          {/* 标题 */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
            <h2 className="text-lg text-[#c9a959] font-serif">☯ 心灵对话</h2>
          </div>

          {/* 消息列表 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#c9a959] text-[#0f0f23] rounded-br-md'
                        : 'bg-white/5 border border-white/10 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-[#c9a959] rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <form onSubmit={onSubmit} className="flex-shrink-0 p-4 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="分享你的感受..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-[#edf2f4] placeholder:text-[#8b8b9e] focus:outline-none focus:border-[#c9a959]/50"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 rounded-full bg-[#c9a959] hover:bg-[#b8942d] text-[#0f0f23] disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
