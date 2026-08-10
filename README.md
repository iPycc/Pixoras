# Pixoras

把 PNG、JPEG、WebP 图片转换为可编辑的拼豆图纸。普通转换和作品存储保留在浏览器本地；只有用户保持“像素化”开关并主动确认生成时，原始图片才会通过本地 Python 服务发送至火山引擎 Seedream。

## 开发

先在项目根目录准备 Python 服务。建议使用 Python 3.12 或 3.13：

```powershell
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

在新的终端启动前端：

```powershell
Set-Location frontend
pnpm dev
```

打开 `http://localhost:3000`。后端健康检查地址为 `http://localhost:8000/health`。

AI 插画需要在根目录 `.env` 中配置轮换后的 `ARK_API_KEY`。密钥仅由 `main.py` 读取，不要放进 `frontend` 或添加 `NEXT_PUBLIC_` 前缀。前端默认调用当前主机的 8000 端口；跨域部署时在 `frontend/.env.local` 设置 `NEXT_PUBLIC_AI_API_BASE`，并在根目录 `.env` 的 `ALLOWED_ORIGINS` 中登记前端来源。

## 项目树

```text
main.py                   # FastAPI 与 Seedream 单图生单图服务
requirements.txt          # Python 服务依赖
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
│  ├─ pixelate.ts      # 无纹理方形像素块重采样
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
- 不含账号、云同步、PDF 和付费功能。
- 上传后先在浏览器本地检查主体区域，仅用于推荐拼豆尺寸；选择 AI 像素化时会把原图发送给本地 Python 服务。
- Python 服务把图片编码为官方接口需要的 Base64 Data URL，固定要求 Seedream 删除原场景，把全部主体重排为占满画布、五官清晰的 Q 版像素角色。
- AI 返回后只清除与画布边缘连通的白背景，不再运行第二次语义抠图。像素强度滑杆完全在本地运行：数值越大，方形色块越大、细节越少；默认值 1 保留最多细节。
- AI 像素角色进入拼豆时使用无平滑的最近邻采样，并默认采用 MARD 120 色；用户仍可在生成设置中切换品牌和色数。
- 确认像素强度后才进入裁剪、图纸尺寸和拼豆颜色映射流程；关闭“像素化”则跳过 AI 和像素效果。
- Seedream 5.0 Pro 使用单张图片字符串输入并只生成一张图片，不启用组图或流式参数；生成结果使用官方 `b64_json` 返回方式，避免临时图片 URL 下载超时。
