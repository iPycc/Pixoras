# Pixoras

把 PNG、JPEG、WebP 图片在浏览器中转换为可编辑的拼豆图纸。图片不会上传服务器，作品保存在 IndexedDB。

## 开发

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## 项目树

```text
frontend/
├─ app/                 # 页面、布局、全局主题
├─ components/
│  ├─ app/             # 应用壳、导航、主题、标志
│  └─ ui/              # shadcn / Base UI 基础组件
├─ features/
│  ├─ upload/          # 图片入口
│  ├─ generate/        # 生成参数
│  ├─ editor/          # 画布、工具、色板
│  ├─ export/          # 导出界面
│  ├─ projects/        # 本地作品
│  └─ onboarding/      # 首次生成后的编辑器引导
├─ data/               # Perler、Hama 色卡
├─ lib/
│  ├─ color/           # Lab 与 CIEDE2000
│  ├─ pattern/         # 转换与编辑算法
│  ├─ db.ts            # IndexedDB
│  ├─ export.ts        # PNG、SVG、CSV
│  ├─ image.ts         # 图片解码与调整
│  ├─ rle.ts           # 网格压缩
│  └─ worker.ts        # Worker 调度与回退
├─ types/              # 业务类型
├─ workers/            # 图片转换 Worker
└─ tests/              # 核心单元测试
```

命名规则：文件名保持短小并直接表达职责；页面功能放 `features`，可复用业务逻辑放 `lib`，通用界面组件放 `components/ui`。

## 默认边界

- 支持现代 Chrome、Edge、Firefox、Safari 和移动 WebView，不支持 IE。
- 色卡中的屏幕 RGB 是近似值，制作前应与实体豆校色。
- 首版不含账号、云同步、AI 抠图、PDF 和付费功能。
