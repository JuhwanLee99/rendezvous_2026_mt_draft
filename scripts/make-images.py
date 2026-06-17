#!/usr/bin/env python3
"""로고(src/assets/logo.png)에서 파비콘/애플터치아이콘/OG 이미지를 생성.
사용: python3 scripts/make-images.py  (의존: Pillow)"""
from PIL import Image, ImageDraw, ImageFont
import os

logo = Image.open("src/assets/logo.png").convert("RGBA")
os.makedirs("public", exist_ok=True)
NAVY = (30, 75, 142)  # #1E4B8E
WHITE = (255, 255, 255)


def fit(img, box):
    im = img.copy()
    im.thumbnail((box, box), Image.LANCZOS)
    return im


# 1) favicon (32, 64) — 투명 배경 그대로
for size, name in [(32, "favicon.png"), (64, "favicon-64.png")]:
    fit(logo, size).resize((size, size), Image.LANCZOS).save(f"public/{name}")

# 2) apple-touch-icon (180) — iOS 는 투명을 검정으로 채우므로 흰 배경 합성
ati = Image.new("RGB", (180, 180), WHITE)
lg = fit(logo, 168)
ati.paste(lg, ((180 - lg.width) // 2, (180 - lg.height) // 2), lg)
ati.save("public/apple-touch-icon.png")

# 3) og-image (1200x630) — 네이비 배경 + 로고 + 타이틀 (카카오톡/SNS 공유 카드)
og = Image.new("RGB", (1200, 630), NAVY)
d = ImageDraw.Draw(og)
lg = fit(logo, 300)
og.paste(lg, ((1200 - lg.width) // 2, 70), lg)


def load_font(size):
    for p, idx in [
        ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 0),
        ("/System/Library/Fonts/Supplemental/AppleGothic.ttf", 0),
        ("/Library/Fonts/Arial Unicode.ttf", 0),
    ]:
        try:
            return ImageFont.truetype(p, size, index=idx)
        except Exception:
            continue
    return None


def centered(text, font, y, fill):
    if not font:
        return
    w = d.textlength(text, font=font)
    d.text(((1200 - w) / 2, y), text, font=font, fill=fill)


centered("Rendezvous 청백전 드래프트", load_font(64), 410, WHITE)
centered("실시간 선수 드래프트 · 현장 중계", load_font(34), 500, (205, 224, 245))
og.save("public/og-image.png")

print("done:", [f for f in os.listdir("public") if f.endswith(".png")])
