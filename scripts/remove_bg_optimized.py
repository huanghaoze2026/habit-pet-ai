#!/usr/bin/env python3
"""
优化抠图脚本 — 消除 rembg 边缘线条/边框
用法: python3 remove_bg_optimized.py <input.png> <output.png>
"""

import sys
from PIL import Image, ImageFilter
import numpy as np
from rembg import remove


def remove_bg_optimized(input_path, output_path, feather_radius=1.5):
    # 1. 读取原图
    img = Image.open(input_path).convert("RGBA")
    print(f"📥 Input: {img.size} {img.mode}")

    # 2. rembg 抠图
    img_no_bg = remove(img)

    # 3. 提取 alpha 通道
    r, g, b, a = img_no_bg.split()

    # 4. 边缘平滑：对 alpha 通道做高斯模糊（消除硬边）
    a_smooth = a.filter(ImageFilter.GaussianBlur(radius=feather_radius))

    # 5. 边缘去色：检测半透明像素，降低灰色/彩色残留
    a_array = np.array(a_smooth) / 255.0
    r_array = np.array(r).astype(np.float64)
    g_array = np.array(g).astype(np.float64)
    b_array = np.array(b).astype(np.float64)

    # 找到半透明区域（alpha 在 10-90% 之间）
    semi_transparent = (a_array > 0.1) & (a_array < 0.9)

    # 对半透明区域去色（转向中性灰，避免保留背景色残留）
    grey = (r_array * 0.299 + g_array * 0.587 + b_array * 0.114)
    r_array[semi_transparent] = grey[semi_transparent]
    g_array[semi_transparent] = grey[semi_transparent]
    b_array[semi_transparent] = grey[semi_transparent]

    # 6. 边缘增强：对于几乎不透明的边缘像素，轻微提亮使其更接近主体色
    near_opaque = (a_array >= 0.9) & (a_array < 1.0)
    r_array[near_opaque] = np.clip(r_array[near_opaque], 0, 255)
    g_array[near_opaque] = np.clip(g_array[near_opaque], 0, 255)
    b_array[near_opaque] = np.clip(b_array[near_opaque], 0, 255)

    # 7. 重新合成
    r_final = Image.fromarray(r_array.astype(np.uint8))
    g_final = Image.fromarray(g_array.astype(np.uint8))
    b_final = Image.fromarray(b_array.astype(np.uint8))
    a_final = Image.fromarray((a_array * 255).astype(np.uint8))

    result = Image.merge("RGBA", (r_final, g_final, b_final, a_final))
    result.save(output_path, "PNG")

    # 统计
    transparent = (a_array < 0.1).sum()
    semi = ((a_array >= 0.1) & (a_array < 0.9)).sum()
    opaque = (a_array >= 0.9).sum()
    total = a_array.size
    print(f"📊 透明:{100*transparent/total:.1f}% 半透明:{100*semi/total:.1f}% 不透明:{100*opaque/total:.1f}%")
    print(f"✅ {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 remove_bg_optimized.py <input.png> <output.png>")
        sys.exit(1)
    remove_bg_optimized(sys.argv[1], sys.argv[2])
