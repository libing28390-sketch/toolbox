# ToolBox - Developer Tools Platform 


一个现代化的在线工具箱网站，提供开发者常用的各种工具，支持中英文切换。

## 🎯 功能特性

### 开发者工具
- **代码工具**: JSON/XML 格式化、代码美化、代码压缩
- **编码工具**: URL 编码/解码、Base64 转换、MD5/SHA 哈希、UUID 生成
- **时间工具**: Unix 时间戳转换、时区转换、倒计时
- **颜色工具**: 色值转换（HEX/RGB/HSL）、调色板生成、对比度检查

### 文本处理
- **文本转换**: 大小写转换、繁简体转换、表情符号转换
- **数据统计**: 字数统计、密度分析、重复值检测
- **正则表达式**: Regex 测试工具、提取/替换工具

### 数据处理
- **数据转换**: CSV 转 JSON、Excel 预览、Markdown 编辑
- **数据生成**: Mock 数据生成、随机数/密码生成、API 测试
- **数据可视化**: JSON Tree、数据表分析

### 网络工具
- **IP 查询**: IP 地址查询、WHOIS 查询、DNS 查询

## 🚀 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **国际化**: next-intl (中文/英文支持)
- **图标**: Lucide React
- **工具库**: crypto-js, uuid, marked

## 📦 项目结构

```
src/
├── app/
│   ├── [locale]/          # 国际化路由
│   │   ├── layout.tsx     # 国际化布局
│   │   └── page.tsx       # 主页面
│   └── globals.css
├── components/
│   ├── Header.tsx         # 头部导航组件
│   ├── ToolGrid.tsx       # 工具列表组件
│   └── ToolPanel.tsx      # 工具面板组件
├── i18n/
│   ├── request.ts         # i18n 请求配置
│   ├── routing.ts         # i18n 路由配置
│   └── messages/
│       ├── en.json        # 英文翻译
│       └── zh.json        # 中文翻译
├── lib/
│   └── tools.ts           # 工具函数库
└── data/
    └── tools.ts           # 工具数据定义
```

## 🛠️ 开发指南

### 安装依赖
```bash
npm install
```

### 运行开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果

### 编译生产版本
```bash
npm run build
npm run start
```

### ESLint 检查
```bash
npm run lint
```

## 🌐 国际化支持

项目支持中英文切换：
- **英文**: http://localhost:3000/en
- **中文**: http://localhost:3000/zh

语言切换器位于页面顶部右侧。

## 📝 添加新工具

1. 在 `src/data/tools.ts` 中添加工具定义
2. 在 `src/i18n/messages/en.json` 和 `zh.json` 中添加翻译
3. 在 `src/lib/tools.ts` 中实现工具逻辑
4. 在 `src/components/ToolPanel.tsx` 中添加工具处理

## 🎨 样式定制

使用 Tailwind CSS 进行样式定制，配置文件自动从 `tailwind.config.ts` 加载。

## 📱 响应式设计

项目采用 Mobile First 方法，支持所有设备尺寸：
- 移动设备 (< 640px)
- 平板 (640px - 1024px)
- 桌面 (> 1024px)

## 🚢 部署

项目可以部署到：
- Vercel (推荐)
- Netlify
- Docker
- 其他支持 Node.js 的平台

## 📄 许可证

MIT
