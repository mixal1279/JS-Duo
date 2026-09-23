import struct
import zlib
import math
import os
import base64

def create_png(width, height, get_pixel_fn, supersample=1):
    raw_data = bytearray()
    ss = supersample
    inv_ss2 = 1.0 / (ss * ss)
    for y in range(height):
        raw_data.append(0) # Filter type None
        for x in range(width):
            if ss == 1:
                r, g, b, a = get_pixel_fn(x + 0.5, y + 0.5, width, height)
                raw_data.extend([int(r), int(g), int(b), int(a)])
            else:
                total_r = total_g = total_b = total_a = 0
                for sy in range(ss):
                    for sx in range(ss):
                        sub_x = x + (sx + 0.5) / ss
                        sub_y = y + (sy + 0.5) / ss
                        r, g, b, a = get_pixel_fn(sub_x, sub_y, width, height)
                        total_r += r
                        total_g += g
                        total_b += b
                        total_a += a
                raw_data.extend([
                    min(255, max(0, int(total_r * inv_ss2 + 0.5))),
                    min(255, max(0, int(total_g * inv_ss2 + 0.5))),
                    min(255, max(0, int(total_b * inv_ss2 + 0.5))),
                    min(255, max(0, int(total_a * inv_ss2 + 0.5)))
                ])
    
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        crc = zlib.crc32(tag + data) & 0xffffffff
        return c + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_data), 9)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

def cat_art_shader(nx, ny):
    # Renders the neon cat art given normalized coords nx, ny in [-1.0, 1.0]
    # Base background: Deep Cyber Space (#080B14 to #18142A)
    dist_center = math.hypot(nx, ny - 0.05)
    r = 8 + max(0, int(22 * (1.0 - min(1.0, dist_center))))
    g = 11 + max(0, int(15 * (1.0 - min(1.0, dist_center))))
    b = 20 + max(0, int(35 * (1.0 - min(1.0, dist_center))))
    a = 255

    # Glowing purple/cyan ring behind cat head
    ring_dist = abs(math.hypot(nx, ny + 0.08) - 0.58)
    if ring_dist < 0.07:
        glow = 1.0 - (ring_dist / 0.07)
        r = min(255, int(r + 140 * glow))
        g = min(255, int(g + 60 * glow))
        b = min(255, int(b + 220 * glow))

    # Books (Bottom Left: nx ~ -0.65 to -0.15, ny ~ 0.35 to 0.70)
    # Book 1 (Cyan)
    if -0.65 < nx < -0.15 and 0.48 < ny < 0.68:
        r, g, b = 14, 32, 58
        if abs(ny - 0.48) < 0.03 or abs(ny - 0.68) < 0.03 or abs(nx - -0.65) < 0.03:
            r, g, b = 6, 182, 212
        if 0.56 < ny < 0.60 and -0.55 < nx < -0.25:
            r, g, b = 56, 189, 248

    # Book 2 (Purple)
    if -0.60 < nx < -0.18 and 0.34 < ny < 0.50:
        r, g, b = 35, 20, 60
        if abs(ny - 0.34) < 0.03 or abs(ny - 0.50) < 0.03 or abs(nx - -0.60) < 0.03:
            r, g, b = 217, 70, 239
        if 0.40 < ny < 0.44 and -0.52 < nx < -0.28:
            r, g, b = 244, 114, 182

    # Floating Terminal (Top-Right: nx ~ 0.35 to 0.75, ny ~ -0.62 to -0.25)
    if 0.35 < nx < 0.75 and -0.62 < ny < -0.25:
        r, g, b = 21, 27, 51
        if abs(nx - 0.35) < 0.03 or abs(nx - 0.75) < 0.03 or abs(ny - -0.62) < 0.03 or abs(ny - -0.25) < 0.03:
            r, g, b = 59, 130, 246
        if -0.54 < ny < -0.50 and 0.42 < nx < 0.68:
            r, g, b = 96, 165, 250
        elif -0.46 < ny < -0.42 and 0.42 < nx < 0.62:
            r, g, b = 56, 189, 248
        elif -0.38 < ny < -0.34 and 0.42 < nx < 0.55:
            r, g, b = 167, 139, 250

    # Mini Terminal 2 (Prompt > _ at nx ~ 0.42 to 0.78, ny ~ -0.18 to 0.12)
    if 0.42 < nx < 0.78 and -0.18 < ny < 0.12:
        r, g, b = 15, 22, 41
        if abs(nx - 0.42) < 0.03 or abs(nx - 0.78) < 0.03 or abs(ny - -0.18) < 0.03 or abs(ny - 0.12) < 0.03:
            r, g, b = 6, 182, 212
        if (-0.08 < ny < 0.02) and (0.50 < nx < 0.58):
            arrow_ny = abs(ny - (-0.03)) * 10
            if abs((nx - 0.52) * 10 - arrow_ny) < 0.2:
                r, g, b = 34, 211, 238
        if 0.00 < ny < 0.03 and 0.62 < nx < 0.72:
            r, g, b = 34, 211, 238

    # Cat Silhouette & Head
    cat_head = math.hypot(nx * 1.15, (ny + 0.05) * 1.25)
    in_left_ear = (nx > -0.50 and nx < -0.15 and ny > -0.65 and ny < -0.20 and (nx + 0.32)*1.5 + (ny + 0.35) < 0)
    in_right_ear = (nx > 0.15 and nx < 0.50 and ny > -0.65 and ny < -0.20 and -(nx - 0.32)*1.5 + (ny + 0.35) < 0)
    is_cat_body = (cat_head < 0.48) or in_left_ear or in_right_ear or (abs(nx) < 0.42 and 0.1 < ny < 0.55)

    if is_cat_body:
        r, g, b = 8, 11, 20
        # Gradient neon outline around cat
        if abs(cat_head - 0.48) < 0.045 or in_left_ear or in_right_ear:
            blend = min(1.0, max(0.0, (nx + 0.5)))
            r = int(217 * (1.0 - blend) + 6 * blend)
            g = int(70 * (1.0 - blend) + 182 * blend)
            b = int(239 * (1.0 - blend) + 212 * blend)

    # Cat Glowing Eyes
    # Left Eye (Neon Pink/Magenta)
    left_eye_dist = math.hypot((nx + 0.18) * 1.6, (ny + 0.10) * 2.8)
    if left_eye_dist < 0.12:
        r, g, b = 244, 114, 182
    elif left_eye_dist < 0.22:
        fade = (0.22 - left_eye_dist) / 0.10
        r = min(255, int(r + 200 * fade))
        g = min(255, int(g + 80 * fade))
        b = min(255, int(b + 180 * fade))

    # Right Eye (Neon Cyan)
    right_eye_dist = math.hypot((nx - 0.18) * 1.6, (ny + 0.10) * 2.8)
    if right_eye_dist < 0.12:
        r, g, b = 34, 211, 238
    elif right_eye_dist < 0.22:
        fade = (0.22 - right_eye_dist) / 0.10
        r = min(255, int(r + 40 * fade))
        g = min(255, int(g + 180 * fade))
        b = min(255, int(b + 220 * fade))

    # Laptop Screen (Angled towards viewer)
    if -0.15 < nx < 0.72 and 0.18 < ny < 0.68:
        r, g, b = 22, 30, 54
        # Cyan screen bezel
        if abs(nx - -0.15) < 0.035 or abs(nx - 0.72) < 0.035 or abs(ny - 0.18) < 0.035 or abs(ny - 0.68) < 0.035:
            r, g, b = 34, 211, 238

        # Code symbols: < / >
        # <
        if 0.06 < nx < 0.22 and 0.34 < ny < 0.54:
            sym_dist = abs(abs(ny - 0.44) * 1.8 - (0.20 - nx))
            if sym_dist < 0.045:
                r, g, b = 103, 232, 249
        # /
        if 0.22 < nx < 0.36 and 0.30 < ny < 0.58:
            slash_dist = abs((nx - 0.29) * 1.8 + (ny - 0.44))
            if slash_dist < 0.045:
                r, g, b = 56, 189, 248
        # >
        if 0.36 < nx < 0.52 and 0.34 < ny < 0.54:
            sym_dist2 = abs(abs(ny - 0.44) * 1.8 - (nx - 0.38))
            if sym_dist2 < 0.045:
                r, g, b = 103, 232, 249

    # Laptop Base / Keyboard Deck
    if -0.32 < nx < 0.76 and 0.65 < ny < 0.88:
        r, g, b = 11, 14, 27
        if abs(ny - 0.88) < 0.03 or abs(nx - -0.32) < 0.03 or abs(nx - 0.76) < 0.03:
            r, g, b = 59, 130, 246

    return r, g, b, a

def full_icon_shader(x, y, w, h):
    nx = (x / (w - 1)) * 2.0 - 1.0
    ny = (y / (h - 1)) * 2.0 - 1.0

    # Squircle boundary
    squircle_val = (abs(nx) ** 4.2) + (abs(ny) ** 4.2)
    
    r, g, b, a = cat_art_shader(nx, ny)

    # Outer Squircle neon border glow
    if 0.76 < squircle_val < 0.98:
        blend_b = (nx + 1.0) / 2.0
        r = int(157 * (1.0 - blend_b) + 0 * blend_b)
        g = int(78 * (1.0 - blend_b) + 245 * blend_b)
        b = int(221 * (1.0 - blend_b) + 212 * blend_b)

    # Edge anti-aliasing
    if squircle_val > 1.02:
        a = 0
    elif squircle_val > 0.96:
        fade = (1.02 - squircle_val) / 0.06
        a = int(255 * fade)

    return r, g, b, a

def round_icon_shader(x, y, w, h):
    nx = (x / (w - 1)) * 2.0 - 1.0
    ny = (y / (h - 1)) * 2.0 - 1.0

    dist = math.hypot(nx, ny)
    r, g, b, a = cat_art_shader(nx, ny)

    # Outer round neon border glow
    if 0.82 < dist < 0.98:
        blend_b = (nx + 1.0) / 2.0
        r = int(157 * (1.0 - blend_b) + 0 * blend_b)
        g = int(78 * (1.0 - blend_b) + 245 * blend_b)
        b = int(221 * (1.0 - blend_b) + 212 * blend_b)

    # Circular mask anti-aliasing
    if dist > 1.0:
        a = 0
    elif dist > 0.96:
        fade = (1.0 - dist) / 0.04
        a = int(255 * fade)

    return r, g, b, a

def adaptive_foreground_shader(x, y, w, h):
    # In adaptive icons, canvas is 108dp. Safe zone is inner 72dp (radius 0.667).
    # Scale coordinates by 1.38 so the full cat art comfortably fits the 72dp safe zone!
    nx = ((x / (w - 1)) * 2.0 - 1.0) * 1.38
    ny = ((y / (h - 1)) * 2.0 - 1.0) * 1.38

    if abs(nx) > 1.05 or abs(ny) > 1.05:
        # Background space outside
        return 8, 11, 20, 255

    r, g, b, a = cat_art_shader(nx, ny)

    # Squircle border inside foreground
    squircle_val = (abs(nx) ** 4.2) + (abs(ny) ** 4.2)
    if 0.76 < squircle_val < 0.98:
        blend_b = (nx + 1.0) / 2.0
        r = int(157 * (1.0 - blend_b) + 0 * blend_b)
        g = int(78 * (1.0 - blend_b) + 245 * blend_b)
        b = int(221 * (1.0 - blend_b) + 212 * blend_b)

    return r, g, b, 255

def main():
    print("Generating icons...")
    
    # 1. Square Launcher Icons (ic_launcher.png)
    launcher_sizes = {
        "android/app/src/main/res/mipmap-mdpi/ic_launcher.png": 48,
        "android/app/src/main/res/mipmap-hdpi/ic_launcher.png": 72,
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png": 96,
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png": 144,
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png": 192,
        "public/favicon.png": 192,
        "public/favicon-512.png": 512,
    }
    for path, dim in launcher_sizes.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = create_png(dim, dim, full_icon_shader, supersample=2)
        with open(path, "wb") as f:
            f.write(data)
        print(f"Created {path} ({dim}x{dim})")

    # 2. Round Launcher Icons (ic_launcher_round.png)
    round_sizes = {
        "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png": 48,
        "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png": 72,
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png": 96,
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png": 144,
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png": 192,
    }
    for path, dim in round_sizes.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = create_png(dim, dim, round_icon_shader, supersample=2)
        with open(path, "wb") as f:
            f.write(data)
        print(f"Created {path} ({dim}x{dim})")

    # 3. Adaptive Foreground Icons (ic_launcher_foreground.png)
    # mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432
    fg_sizes = {
        "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png": 108,
        "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png": 162,
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png": 216,
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png": 324,
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png": 432,
    }
    for path, dim in fg_sizes.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = create_png(dim, dim, adaptive_foreground_shader, supersample=2)
        with open(path, "wb") as f:
            f.write(data)
        print(f"Created {path} ({dim}x{dim})")

    # 4. Generate SVG that embeds the PNG so any browser/viewer gets exact neon cat
    with open("public/favicon-512.png", "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>
'''
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Updated public/favicon.svg with embedded neon cat image")

if __name__ == "__main__":
    main()
