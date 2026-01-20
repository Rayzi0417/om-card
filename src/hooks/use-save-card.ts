'use client';

import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface SaveCardState {
  isGenerating: boolean;
  previewUrl: string | null;
  error: string | null;
}

interface UseSaveCardReturn {
  state: SaveCardState;
  generatePreview: (element: HTMLElement | null) => Promise<void>;
  clearPreview: () => void;
}

/**
 * useSaveCard Hook
 * 
 * 由于移动端（特别是 iOS Safari）限制脚本自动下载，
 * 采用"预览模式"策略：
 * 1. 将 DOM 转换为 Base64 图片
 * 2. 弹出模态框展示生成好的图片
 * 3. 提示用户"长按图片保存到相册"
 */
export function useSaveCard(): UseSaveCardReturn {
  const [state, setState] = useState<SaveCardState>({
    isGenerating: false,
    previewUrl: null,
    error: null,
  });

  const generatePreview = useCallback(async (element: HTMLElement | null) => {
    if (!element) {
      setState(prev => ({ ...prev, error: '未找到要保存的元素' }));
      toast.error('未找到要保存的元素');
      return;
    }

    setState({ isGenerating: true, previewUrl: null, error: null });
    toast.loading('正在生成图片...', { id: 'generating' });

    try {
      // 先将元素移到可见位置以确保正确渲染
      const originalStyle = element.style.cssText;
      element.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        z-index: -9999;
        opacity: 0;
      `;

      // 等待一帧确保样式应用
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 配置 toPng 选项
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#1a1a2e',
        skipFonts: true, // 跳过字体以避免问题
        fetchRequestInit: {
          mode: 'cors',
          credentials: 'omit',
        },
        filter: (node) => {
          // 过滤掉可能导致问题的元素
          if (node instanceof Element) {
            const tagName = node.tagName?.toLowerCase();
            if (tagName === 'script' || tagName === 'noscript') {
              return false;
            }
          }
          return true;
        },
      });

      // 恢复原始样式
      element.style.cssText = originalStyle;

      setState({
        isGenerating: false,
        previewUrl: dataUrl,
        error: null,
      });
      toast.success('图片生成成功！', { id: 'generating' });
    } catch (err) {
      console.error('生成图片失败:', err);
      
      // 尝试备用方案：使用 Canvas 手动绘制
      try {
        const fallbackUrl = await generateFallbackImage(element);
        if (fallbackUrl) {
          setState({
            isGenerating: false,
            previewUrl: fallbackUrl,
            error: null,
          });
          toast.success('图片生成成功！', { id: 'generating' });
          return;
        }
      } catch (fallbackErr) {
        console.error('备用方案也失败:', fallbackErr);
      }
      
      setState({
        isGenerating: false,
        previewUrl: null,
        error: '生成图片失败，请重试',
      });
      toast.error('生成图片失败，请重试', { id: 'generating' });
    }
  }, []);

  const clearPreview = useCallback(() => {
    setState({
      isGenerating: false,
      previewUrl: null,
      error: null,
    });
  }, []);

  return {
    state,
    generatePreview,
    clearPreview,
  };
}

/**
 * 备用方案：使用 Canvas 手动绘制简化版图片
 */
async function generateFallbackImage(element: HTMLElement): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 设置画布尺寸
    canvas.width = 400;
    canvas.height = 600;

    // 绘制背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制标题
    ctx.fillStyle = '#c9a959';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('舒服 VS. 不舒服', canvas.width / 2, 40);

    ctx.fillStyle = '#8b8b9e';
    ctx.font = '12px sans-serif';
    ctx.fillText('一体两面的洞见', canvas.width / 2, 60);

    // 查找图片元素并绘制
    const images = element.querySelectorAll('img');
    let xOffset = 60;
    
    for (let i = 0; i < Math.min(images.length, 2); i++) {
      const img = images[i] as HTMLImageElement;
      
      // 绘制区域标签
      ctx.fillStyle = i === 0 ? '#818cf8' : '#fbbf24';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        i === 0 ? '🌙 不舒服区' : '☀️ 舒服区',
        xOffset + 60,
        100
      );

      // 绘制图片边框
      ctx.strokeStyle = i === 0 ? '#6366f1' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(xOffset, 115, 120, 150);

      // 尝试绘制图片
      try {
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, xOffset, 115, 120, 150);
        } else {
          // 图片未加载，绘制占位符
          ctx.fillStyle = '#2a2a3e';
          ctx.fillRect(xOffset + 1, 116, 118, 148);
          ctx.fillStyle = '#8b8b9e';
          ctx.font = '12px sans-serif';
          ctx.fillText('卡牌', xOffset + 60, 195);
        }
      } catch {
        // 绘制占位符
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(xOffset + 1, 116, 118, 148);
      }

      xOffset += 160;
    }

    // 绘制底部信息
    ctx.fillStyle = '#8b8b9e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Om Card · ${new Date().toLocaleDateString('zh-CN')}`, canvas.width / 2, canvas.height - 20);

    return canvas.toDataURL('image/png', 1);
  } catch (err) {
    console.error('备用方案绘制失败:', err);
    return null;
  }
}

/**
 * 生成双卡并排图片（用于 Mode B）
 */
export async function generateDualCardImage(
  comfortElement: HTMLElement | null,
  discomfortElement: HTMLElement | null
): Promise<string | null> {
  if (!comfortElement || !discomfortElement) {
    return null;
  }

  try {
    // 分别生成两张卡片的图片
    const [comfortUrl, discomfortUrl] = await Promise.all([
      toPng(comfortElement, { quality: 1, pixelRatio: 2, backgroundColor: '#faf8f5' }),
      toPng(discomfortElement, { quality: 1, pixelRatio: 2, backgroundColor: '#faf8f5' }),
    ]);

    // 使用 Canvas 合并两张图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 加载两张图片
    const [comfortImg, discomfortImg] = await Promise.all([
      loadImage(comfortUrl),
      loadImage(discomfortUrl),
    ]);

    // 设置 Canvas 尺寸（两张卡片并排 + 间距）
    const gap = 40;
    const padding = 60;
    const labelHeight = 80;
    canvas.width = comfortImg.width + discomfortImg.width + gap + padding * 2;
    canvas.height = Math.max(comfortImg.height, discomfortImg.height) + padding * 2 + labelHeight;

    // 填充背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制标签
    ctx.fillStyle = '#c9a959';
    ctx.font = 'bold 24px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    
    // 舒适区标签
    ctx.fillText('🟢 舒适区', padding + comfortImg.width / 2, padding + 30);
    // 不舒服区标签
    ctx.fillText('🔴 不舒服区', padding + comfortImg.width + gap + discomfortImg.width / 2, padding + 30);

    // 绘制卡片
    ctx.drawImage(comfortImg, padding, padding + labelHeight);
    ctx.drawImage(discomfortImg, padding + comfortImg.width + gap, padding + labelHeight);

    return canvas.toDataURL('image/png', 1);
  } catch (err) {
    console.error('生成双卡图片失败:', err);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
