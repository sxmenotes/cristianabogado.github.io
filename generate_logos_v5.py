#!/usr/bin/env python3
"""
generate_logos_v5.py
Procesa las fotos de Muñoz Parejas Abogados (IMG_3097, IMG_3098, IMG_3099)
y genera la matriz completa de 12 logotipos con transparencia de alta fidelidad.
"""
import os
import cv2
import numpy as np
from PIL import Image

BASE_DIR = "/Users/samuelvalenzuela/Desktop/WEB DEVELOP/CRISTIAN ABOGADO"
OUT_DIR  = os.path.join(BASE_DIR, "assets", "logos")
os.makedirs(OUT_DIR, exist_ok=True)

IMG_COMPLETO   = os.path.join(BASE_DIR, "IMG_3097.jpg")
IMG_HORIZONTAL = os.path.join(BASE_DIR, "IMG_3098.jpg")
IMG_ISOLOGO    = os.path.join(BASE_DIR, "IMG_3099.jpg")

def extract_alpha(img_path):
    """
    Extrae la imagen RGBA eliminando el fondo azul oscuro mediante proyección ortogonal,
    aplica descontaminación cromática para evitar halos azules en fondos claros,
    y filtra ruido aislado.
    """
    bgr = cv2.imread(img_path)
    arr = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float64)
    H, W, _ = arr.shape
    
    # Muestrear esquinas para el color del fondo azul marino
    corners = np.concatenate([
        arr[0:40, 0:40].reshape(-1, 3),
        arr[0:40, -40:].reshape(-1, 3),
        arr[-40:, 0:40].reshape(-1, 3),
        arr[-40:, -40:].reshape(-1, 3)
    ])
    bg_color = corners.mean(axis=0)
    bg_dir = bg_color / np.linalg.norm(bg_color)
    
    # Distancia ortogonal respecto al eje de color del fondo
    proj = arr[:,:,0]*bg_dir[0] + arr[:,:,1]*bg_dir[1] + arr[:,:,2]*bg_dir[2]
    perp_R = arr[:,:,0] - proj * bg_dir[0]
    perp_G = arr[:,:,1] - proj * bg_dir[1]
    perp_B = arr[:,:,2] - proj * bg_dir[2]
    perp_dist = np.sqrt(perp_R**2 + perp_G**2 + perp_B**2)
    
    # Medida de calidez (el dorado tiene R > B y G > B)
    warmth = (arr[:,:,0] - arr[:,:,2]) + (arr[:,:,1] - arr[:,:,2])
    val = np.maximum.reduce([arr[:,:,0], arr[:,:,1], arr[:,:,2]])
    
    # Rampa suave de alfa
    t_low = 8.0
    t_high = 22.0
    alpha = np.clip((perp_dist - t_low) / (t_high - t_low), 0.0, 1.0)
    
    # Suprimir sombras frías o muy oscuras (sombras proyectadas en el papel)
    warmth_suppress = np.clip((warmth - 2.0) / 14.0, 0.0, 1.0)
    val_suppress = np.clip((val - 28.0) / 18.0, 0.0, 1.0)
    alpha = alpha * warmth_suppress * val_suppress
    
    # Curva smoothstep para transiciones suaves de antialiasing
    alpha = alpha * alpha * (3.0 - 2.0 * alpha)
    
    # Descontaminación de bordes (un-premultiplying el fondo azul marino)
    fg = arr.copy()
    mask = alpha > 0.05
    for c in range(3):
        fg_c = (arr[:,:,c] - (1.0 - alpha) * bg_color[c]) / np.maximum(alpha, 0.05)
        fg[:,:,c] = np.where(mask, np.clip(fg_c, 0, 255), arr[:,:,c])
    
    out_rgba = np.zeros((H, W, 4), dtype=np.uint8)
    out_rgba[:,:,:3] = np.clip(fg, 0, 255).astype(np.uint8)
    out_rgba[:,:,3] = (alpha * 255.0).astype(np.uint8)
    
    # Filtrar componentes conectados muy pequeños (< 15 px) para eliminar ruido residual
    binary = (out_rgba[:,:,3] > 20).astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    noise_mask = np.zeros((H, W), dtype=bool)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] < 15:
            noise_mask[labels == i] = True
    
    out_rgba[noise_mask, 3] = 0
    return Image.fromarray(out_rgba)

def autocrop(img, pad=20):
    arr = np.array(img)
    a = arr[:,:,3]
    rows = np.any(a > 10, axis=1)
    cols = np.any(a > 10, axis=0)
    if not rows.any(): return img
    r0, r1 = np.where(rows)[0][[0, -1]]
    c0, c1 = np.where(cols)[0][[0, -1]]
    iw, ih = img.size
    return img.crop((max(0, c0 - pad), max(0, r0 - pad),
                     min(iw, c1 + pad + 1), min(ih, r1 + pad + 1)))

def mono(img, rgb=(0, 0, 0)):
    arr = np.array(img).copy()
    arr[:,:,0] = rgb[0]
    arr[:,:,1] = rgb[1]
    arr[:,:,2] = rgb[2]
    return Image.fromarray(arr)

def main():
    print("▶ Procesando imágenes de entrada...")
    rgba_3097 = extract_alpha(IMG_COMPLETO)
    rgba_3098 = extract_alpha(IMG_HORIZONTAL)
    rgba_3099 = extract_alpha(IMG_ISOLOGO)
    
    W3097, H3097 = rgba_3097.size
    
    # 1. Isologo (IMG_3099 con recuadro)
    isologo_color = autocrop(rgba_3099, pad=20)
    
    # 1b. Isologo sin recuadro (Monograma MP de IMG_3097)
    isologo_sin_marco = autocrop(rgba_3097.crop((0, 0, W3097, 430)), pad=20)
    
    # 2. Logotipo (Texto "MUÑOZ PAREJAS ABOGADOS" de IMG_3097)
    logotipo_color = autocrop(rgba_3097.crop((0, 460, W3097, H3097)), pad=20)
    
    # 3. Logo Horizontal completo (IMG_3098)
    horizontal_color = autocrop(rgba_3098, pad=25)
    
    # 4. Logo Completo vertical (IMG_3097)
    completo_color = autocrop(rgba_3097, pad=25)
    
    # Matriz de guardado
    outputs = {
        # Color
        "01_isologo_color": isologo_color,
        "01b_isologo_sin_marco_color": isologo_sin_marco,
        "02_logotipo_color": logotipo_color,
        "03_horizontal_color": horizontal_color,
        "04_logo_completo_color": completo_color,
        
        # Negro
        "05_isologo_negro": mono(isologo_color, (0, 0, 0)),
        "05b_isologo_sin_marco_negro": mono(isologo_sin_marco, (0, 0, 0)),
        "06_logotipo_negro": mono(logotipo_color, (0, 0, 0)),
        "07_horizontal_negro": mono(horizontal_color, (0, 0, 0)),
        "08_logo_completo_negro": mono(completo_color, (0, 0, 0)),
        
        # Blanco
        "09_isologo_blanco": mono(isologo_color, (255, 255, 255)),
        "09b_isologo_sin_marco_blanco": mono(isologo_sin_marco, (255, 255, 255)),
        "10_logotipo_blanco": mono(logotipo_color, (255, 255, 255)),
        "11_horizontal_blanco": mono(horizontal_color, (255, 255, 255)),
        "12_logo_completo_blanco": mono(completo_color, (255, 255, 255)),
    }
    
    print("\n▶ Guardando matriz en assets/logos/:")
    for name, img in outputs.items():
        out_path = os.path.join(OUT_DIR, f"{name}.png")
        img.save(out_path, "PNG", optimize=True)
        print(f"  ✓ {name}.png ({img.width}x{img.height})")
    
    print("\n✅ ¡Todos los logotipos han sido procesados y guardados con éxito!")

if __name__ == "__main__":
    main()
