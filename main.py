from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import re
import subprocess
import tempfile
import time
import urllib.request
import warnings
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool

warnings.filterwarnings("ignore", message="Core Pydantic V1 functionality")

from volcenginesdkarkruntime import Ark

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
if not os.getenv("ARK_API_KEY"):
    # Keeps the current local setup working while credentials are moved to root .env.
    load_dotenv(ROOT / "frontend" / ".env")

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_RESULT_BYTES = 60 * 1024 * 1024
RATE_WINDOW_SECONDS = 60
RATE_LIMIT = 4
DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f]")
DATA_URL = re.compile(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+")
ARK_KEY = re.compile(r"ark-[A-Za-z0-9-]{16,}")

logger = logging.getLogger("pixoras.ai")
rate_buckets: dict[str, tuple[int, float]] = {}
rate_lock = asyncio.Lock()


app = FastAPI(
    title="Pixoras AI Service",
    version="1.0.0",
    redirect_slashes=False,
)
allowed_origins = tuple(
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Pixoras-Model"],
)


@app.middleware("http")
async def protect_origin(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        origin = request.headers.get("origin")
        if origin and origin not in allowed_origins:
            return JSONResponse({"message": "请求来源无效"}, status_code=403)
    return await call_next(request)


@app.exception_handler(HTTPException)
async def http_error(_: Request, error: HTTPException):
    return JSONResponse(
        {"message": str(error.detail)},
        status_code=error.status_code,
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, __: RequestValidationError):
    return JSONResponse(
        {"message": "图片请求参数不完整"},
        status_code=400,
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.get("/health")
async def health():
    return {
        "configured": bool(os.getenv("ARK_API_KEY")),
        "model": os.getenv(
            "ARK_IMAGE_MODEL", "doubao-seedream-5-0-pro-260628"
        ),
        "status": "ok",
    }


@app.post("/api/ai/illustrate")
async def illustrate(
    request: Request,
    image: UploadFile = File(...),
    target_size: int = Form(58, alias="targetSize"),
):
    await enforce_rate_limit(client_address(request))
    if not os.getenv("ARK_API_KEY"):
        raise HTTPException(503, "AI 插画服务尚未配置")

    content_type = (image.content_type or "").lower()
    if content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(400, "仅支持 PNG、JPEG 或 WebP 图片")

    contents = await image.read(MAX_UPLOAD_BYTES + 1)
    await image.close()
    if not contents or len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "图片大小必须在 25MB 以内")
    if not matches_image_signature(contents, content_type):
        raise HTTPException(400, "图片内容与文件格式不一致")

    prompt = illustration_prompt(
        target_size=target_size,
    )
    try:
        result = await run_in_threadpool(
            generate_and_download,
            contents,
            content_type,
            prompt,
        )
    except Exception as error:
        detail = clean_diagnostic(str(error), 300)
        request_id = clean_diagnostic(
            str(getattr(error, "request_id", "")), 120
        )
        logger.exception(
            "Ark image generation failed",
            extra={"request_id": request_id or None},
        )
        suffix = f"（Request ID {request_id}）" if request_id else ""
        message = detail or "AI 插画生成失败，请稍后重试"
        raise HTTPException(502, f"{message}{suffix}") from error

    return Response(
        result[0],
        media_type=result[1],
        headers={
            "Cache-Control": "no-store, max-age=0",
            "X-Pixoras-Model": result[2],
        },
    )


@lru_cache(maxsize=1)
def ark_client():
    return Ark(
        base_url=os.getenv(
            "ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3"
        ),
        api_key=os.environ["ARK_API_KEY"],
        timeout=180.0,
        max_retries=0,
    )


def generate_and_download(
    image_bytes: bytes,
    content_type: str,
    prompt: str,
) -> tuple[bytes, str, str]:
    model = os.getenv(
        "ARK_IMAGE_MODEL", "doubao-seedream-5-0-pro-260628"
    )
    data_url = (
        f"data:{content_type};base64,"
        f"{base64.b64encode(image_bytes).decode('ascii')}"
    )
    payload = {
        "model": model,
        "prompt": prompt,
        "image": data_url,
        "size": "2K",
        "output_format": "png",
        "response_format": "b64_json",
        "watermark": False,
    }
    if os.name == "nt":
        return generate_with_windows_transport(payload, model)
    return generate_with_ark_sdk(payload, model)


def generate_with_ark_sdk(
    payload: dict[str, object], model: str
) -> tuple[bytes, str, str]:
    response = ark_client().images.generate(
        **payload,
    )
    result = response.data[0]
    encoded = getattr(result, "b64_json", None)
    if encoded:
        generated = base64.b64decode(encoded, validate=True)
        if not generated or len(generated) > MAX_RESULT_BYTES:
            raise RuntimeError("AI 服务返回的图片大小无效")
        return generated, image_mime(generated), getattr(response, "model", None) or model
    image_url = getattr(result, "url", None)
    if not image_url or not image_url.startswith("https://"):
        raise RuntimeError("AI 服务没有返回有效图片地址")

    download = urllib.request.Request(
        image_url,
        headers={"Accept": "image/*", "User-Agent": "Pixoras/1.0"},
    )
    with urllib.request.urlopen(download, timeout=60) as remote:
        generated = remote.read(MAX_RESULT_BYTES + 1)
        response_type = remote.headers.get_content_type()
    if not generated or len(generated) > MAX_RESULT_BYTES:
        raise RuntimeError("AI 服务返回的图片大小无效")
    detected_type = image_mime(generated)
    if response_type not in {"image/png", "image/jpeg", "image/webp"}:
        response_type = detected_type
    return generated, response_type, getattr(response, "model", None) or model


def generate_with_windows_transport(
    payload: dict[str, object], model: str
) -> tuple[bytes, str, str]:
    script = ROOT / "ark_transport.ps1"
    if not script.is_file():
        raise RuntimeError("缺少 Windows 方舟传输脚本 ark_transport.ps1")

    with tempfile.TemporaryDirectory(prefix="pixoras-ark-") as directory:
        temporary = Path(directory)
        input_path = temporary / "request.json"
        output_path = temporary / "image.bin"
        metadata_path = temporary / "metadata.json"
        input_path.write_text(
            json.dumps(payload, ensure_ascii=False), encoding="utf-8"
        )
        process = subprocess.run(
            [
                os.getenv("POWERSHELL_BIN", "powershell.exe"),
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(script),
                "-InputPath",
                str(input_path),
                "-OutputPath",
                str(output_path),
                "-MetadataPath",
                str(metadata_path),
            ],
            capture_output=True,
            check=False,
            env=os.environ.copy(),
            timeout=240,
        )
        if process.returncode != 0:
            detail = process.stderr.decode("utf-8", errors="replace").strip()
            if not detail:
                detail = process.stdout.decode("utf-8", errors="replace").strip()
            raise RuntimeError(detail or "Windows 方舟请求失败")
        if not output_path.is_file() or not metadata_path.is_file():
            raise RuntimeError("Windows 方舟请求没有返回图片")

        generated = output_path.read_bytes()
        if not generated or len(generated) > MAX_RESULT_BYTES:
            raise RuntimeError("AI 服务返回的图片大小无效")
        metadata = json.loads(metadata_path.read_text(encoding="utf-8-sig"))
        response_type = str(metadata.get("content_type") or image_mime(generated))
        if response_type not in {"image/png", "image/jpeg", "image/webp"}:
            response_type = image_mime(generated)
        return generated, response_type, str(metadata.get("model") or model)


def illustration_prompt(
    *,
    target_size: int,
) -> str:
    size = max(29, min(200, round(target_size or 58)))
    return "\n".join(
        [
            "任务是参考照片重画Q版像素角色，不是给整张照片添加像素化滤镜。",
            "识别照片中的全部主要人物；如果没有人物，则识别全部主要宠物或动物。"
            "人物数量和身份必须准确，不能增加、删除、融合或交换人物特征。",
            "彻底删除原照片的场景和非主体元素，包括桌子、椅子、食物、墙面、地面、"
            "从画面边缘伸入的手、拍摄手机及其他路人。只保留主要人物、宠物，以及他们正在手持的"
            "有辨识度物品。",
            "把所有主要人物重新排版到白色正方形画布中央，人物之间并排、互不遮挡。"
            "整体人物组合占画布宽高的80%到90%，四周只保留少量均匀留白，不能让人物缩在远处。",
            "将每个人重绘成2到3头身的chibi/Q版像素角色。头部约占单个人物高度的40%到50%，"
            "适度放大头部、眼睛和有辨识度的面部特征，身体和四肢简洁但姿势关系清楚。",
            "每张脸都必须明确画出左右眼、眉毛、鼻子、嘴巴、脸部轮廓和发际线，不能出现空白脸。"
            "眼睛使用清晰的深色轮廓、瞳孔和小面积高光；鼻子和嘴巴使用独立且可辨认的像素色块。",
            "保留每个人的发型、发色、脸型、表情、服装颜色、配饰和手持物等身份特征，"
            "让熟悉原图的人能够区分并认出每个角色。",
            f"按最终约{size}×{size}格拼豆图纸的可读性设计角色。使用清晰方形像素、"
            "单像素宽的深色轮廓和明确的阶梯边缘；五官和轮廓优先于衣服上的微小装饰。",
            "保留丰富但有组织的颜色层级。皮肤、头发和服装分别使用连续的纯色像素块表现高光、"
            "中间色和阴影，不得把脸部简化成一整块肤色。",
            "背景必须为纯白色。不要绘制环境、地面、投影、光晕、边框、文字或装饰物。",
            "允许用分级的纯色像素块表达衣褶、材质和光影，但禁止照片纹理、随机噪点、颗粒、"
            "抖动、半色调、扫描线、平滑渐变、反光光斑和光晕。",
            "不要添加网格线、伪拼豆纹理、真实拼豆、色号或任何文字。",
            "当前图片必须保持干净、平整、无纹理。输出单张完整图片。",
        ]
    )


async def enforce_rate_limit(client: str):
    now = time.monotonic()
    async with rate_lock:
        count, reset_at = rate_buckets.get(client, (0, now + RATE_WINDOW_SECONDS))
        if reset_at <= now:
            count, reset_at = 0, now + RATE_WINDOW_SECONDS
        if count >= RATE_LIMIT:
            raise HTTPException(429, "AI 生成请求过于频繁，请稍后再试")
        rate_buckets[client] = (count + 1, reset_at)


def client_address(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return forwarded or (request.client.host if request.client else "local")


def clean_diagnostic(value: str, max_length: int) -> str:
    value = CONTROL_CHARACTERS.sub(" ", value)
    value = DATA_URL.sub("[image]", value)
    value = ARK_KEY.sub("[redacted]", value)
    value = re.sub(r"https?://\S+", "[url]", value)
    return value.strip()[:max_length]


def matches_image_signature(contents: bytes, content_type: str) -> bool:
    if content_type == "image/png":
        return contents.startswith(b"\x89PNG")
    if content_type == "image/jpeg":
        return contents.startswith(b"\xff\xd8")
    if content_type == "image/webp":
        return contents.startswith(b"RIFF") and contents[8:12] == b"WEBP"
    return False


def image_mime(contents: bytes) -> str:
    if contents.startswith(b"\xff\xd8"):
        return "image/jpeg"
    if contents.startswith(b"RIFF") and contents[8:12] == b"WEBP":
        return "image/webp"
    return "image/png"
