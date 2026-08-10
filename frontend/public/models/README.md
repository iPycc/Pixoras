# Subject extraction model

`u2netp.onnx` is the compact U-2-Net portrait/object segmentation checkpoint
distributed by the rembg project. Pixoras loads it only after the user enables
“仅保留图片主体”; inference runs locally through ONNX Runtime Web.

- Upstream model: https://github.com/xuebinqin/U-2-Net
- ONNX distribution: https://github.com/danielgatis/rembg/releases/tag/v0.0.0
- SHA-256: `309C8469258DDA742793DCE0EBEA8E6DD393174F89934733ECC8B14C76F4DDD8`
- Model license: Apache-2.0 (`U-2-Net-LICENSE.txt`)
- Distribution project license: MIT (`rembg-LICENSE.txt`)
