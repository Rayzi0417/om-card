# Om Card 🎴

一款遵循学术规范的数字化心理投射工具，基于 OH Cards 原理。

## 功能

- 🎨 AI 生成水彩风格投射卡牌
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
