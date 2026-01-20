# Om Card 🎴

一款遵循学术规范的数字化心理投射工具，基于 OH Cards 原理。

## 版本 V2.0

### 玩法一：当下映照 (The Daily Mirror)
- 🎴 三种卡组：经典（88张原版OH卡）、抽象（AI生成）、具象（AI生成）
- 🔍 卡牌放大查看功能
- 💾 Canvas 绘制保存图片（支持所有卡组）
- 💬 AI 引导师对话探索

### 玩法二：舒服 VS. 不舒服 (Paradox Flip)
- 🎯 拖拽分配卡牌到舒服区/不舒服区
- 🔄 卡牌位置交换动画，重新框架思考
- 🔍 对话中随时放大查看卡牌
- 📸 生成咨询记录长图保存

## 功能特性

- 🎨 AI 生成水彩风格投射卡牌（铅笔速写 + 水彩晕染风格）
- 💬 AI 引导师陪伴探索（遵循 OH 卡礼仪）
- 📱 移动端优先，支持 PWA
- 🔄 支持豆包/Google 双模型

## 部署

### 环境变量

在 Vercel 中配置以下环境变量：

```
# 豆包 API Key（推荐，国内可用）
ARK_API_KEY=your-ark-api-key

# Google API Key（可选，需要科学上网）
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/om-card)

## 本地开发

```bash
npm install
npm run dev
```

## 致谢

- [OH Cards Institute](https://www.oh-cards-institute.org/) - OH 卡学术规范
- 字节跳动豆包 - AI 能力支持
