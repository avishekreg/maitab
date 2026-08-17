#!/usr/bin/env python3
"""Generate official mAITab M+ gradient badge icons for web + Android."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
VIOLET = (124, 58, 237)  # violet-600
CYAN = (6, 182, 212)  # cyan-500


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def gradient_square(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = lerp(VIOLET, CYAN, t)
    return img


def rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, img.size[0] - 1, img.size[1] - 1), radius=radius, fill=255
    )
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def circle(img: Image.Image) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, img.size[0] - 1, img.size[1] - 1), fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def draw_mplus(img: Image.Image) -> Image.Image:
    size = img.size[0]
    canvas = img.convert("RGBA")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype(FONT, size=int(size * 0.42))
    text = "M+"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    return canvas


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def main() -> None:
    master = draw_mplus(gradient_square(1024))
    rounded_master = rounded(master, radius=230)
    round_master = circle(master)

    public = ROOT / "public"
    icons = public / "icons"
    save_png(rounded_master.resize((512, 512), Image.Resampling.LANCZOS), icons / "icon-512.png")
    save_png(rounded_master.resize((192, 192), Image.Resampling.LANCZOS), icons / "icon-192.png")
    save_png(rounded_master.resize((180, 180), Image.Resampling.LANCZOS), public / "apple-touch-icon.png")
    save_png(rounded_master.resize((32, 32), Image.Resampling.LANCZOS), ROOT / "app" / "icon.png")

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [rounded_master.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
    public.joinpath("favicon.ico").parent.mkdir(parents=True, exist_ok=True)
    ico_images[0].save(
        public / "favicon.ico",
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_images[1:],
    )

    densities = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    fg_sizes = {
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432,
    }
    android = ROOT / "android" / "app" / "src" / "main" / "res"
    for name, size in densities.items():
        folder = android / f"mipmap-{name}"
        save_png(rounded_master.resize((size, size), Image.Resampling.LANCZOS), folder / "ic_launcher.png")
        save_png(round_master.resize((size, size), Image.Resampling.LANCZOS), folder / "ic_launcher_round.png")
        fg = Image.new("RGBA", (fg_sizes[name], fg_sizes[name]), (0, 0, 0, 0))
        inner = int(fg_sizes[name] * 0.62)
        badge = rounded_master.resize((inner, inner), Image.Resampling.LANCZOS)
        off = (fg_sizes[name] - inner) // 2
        fg.paste(badge, (off, off), badge)
        save_png(fg, folder / "ic_launcher_foreground.png")

    print("generated mAITab brand icons")


if __name__ == "__main__":
    main()
