'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface SavePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

/**
 * 保存预览模态框
 * 
 * 移动端策略：展示生成的图片，提示用户长按保存
 * 电脑端：可以右键保存或点击下载按钮
 */
export function SavePreviewModal({
  isOpen,
  imageUrl,
  onClose,
  title = '保存卡片'
}: SavePreviewModalProps) {
  if (!imageUrl) return null;

  // 下载图片
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `om-card-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#1a1a2e] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#c9a959]">
                <Download className="w-5 h-5" />
                <span className="font-serif">{title}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors text-[#8b8b9e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 图片预览 - 使用原生 img 标签以支持右键保存 */}
            <div className="p-4">
              <div className="relative w-full rounded-xl overflow-hidden bg-[#faf8f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Card preview"
                  className="w-full h-auto"
                  style={{ maxHeight: '60vh', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* 操作按钮和提示 */}
            <div className="px-4 pb-6">
              {/* 下载按钮 */}
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-[#c9a959] text-[#0f0f23] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#d4b76a] transition-colors mb-4"
              >
                <Download className="w-5 h-5" />
                下载图片
              </button>
              
              {/* 提示文案 */}
              <div className="text-center">
                <p className="text-[#8b8b9e] text-sm mb-1">
                  📱 移动端可长按图片保存到相册
                </p>
                <p className="text-[#8b8b9e]/60 text-xs">
                  💻 电脑端可右键图片"另存为"
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
