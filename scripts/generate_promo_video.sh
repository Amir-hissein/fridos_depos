#!/usr/bin/env bash
# ============================================================
#  Fridos AI — Générateur de vidéo promotionnelle
#  Usage : ./scripts/generate_promo_video.sh [IMAGE_PATH]
#  Sortie : ./output/fridos_promo_*.mp4
# ============================================================
set -e

GREEN='\033[0;32m'; TEAL='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
print_step() { echo -e "${TEAL}▶ $1${RESET}"; }
print_ok()   { echo -e "${GREEN}✅ $1${RESET}"; }
print_warn() { echo -e "${YELLOW}⚠️  $1${RESET}"; }
print_err()  { echo -e "${RED}❌ $1${RESET}"; exit 1; }

# ── Vérification FFmpeg ──────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then print_err "FFmpeg non trouvé. Installe-le : brew install ffmpeg"; fi
FFMPEG_VER=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
print_ok "FFmpeg $FFMPEG_VER détecté"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE="${1:-$SCRIPT_DIR/fridos_ai_real_branding.png}"
OUTPUT_DIR="$PROJECT_DIR/output"
mkdir -p "$OUTPUT_DIR"

W_PORT=1080; H_PORT=1920
W_SQ=1080;   H_SQ=1080
W_LAND=1920; H_LAND=1080
DURATION=12; FPS=30; FADE_DUR=1.0
TOTAL_FRAMES=$((DURATION * FPS))

if [ ! -f "$IMAGE" ]; then
  print_warn "Image non trouvée : $IMAGE"
  echo "  Usage : $0 /chemin/vers/image.png"
  print_err "Spécifie le chemin de l'image."
fi
print_ok "Image : $IMAGE"; echo ""

# ── Fonction vidéo simple (Ken Burns + Fade) ─────────────────
generate_video() {
  local OUTPUT="$1" W="$2" H="$3" NAME="$4"
  print_step "Génération $NAME (${W}x${H}) — ${DURATION}s..."
  local FADE_OUT; FADE_OUT=$(echo "$DURATION $FADE_DUR" | awk '{printf "%.1f",$1-$2}')
  ffmpeg -y -loop 1 -framerate $FPS -i "$IMAGE" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},zoompan=z='min(zoom+0.0008,1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${TOTAL_FRAMES}:s=${W}x${H}:fps=${FPS},fade=t=in:st=0:d=${FADE_DUR}:color=black,fade=t=out:st=${FADE_OUT}:d=${FADE_DUR}:color=black,format=yuv420p" \
    -c:v libx264 -preset slow -crf 18 -t $DURATION -movflags +faststart -pix_fmt yuv420p \
    "$OUTPUT" 2>&1 | grep -E "^frame=.*Lsize" | tail -1
  [ -f "$OUTPUT" ] && print_ok "$NAME → $(basename "$OUTPUT") ($(du -sh "$OUTPUT" | cut -f1))" || print_err "Échec $NAME"
}

# ── Fonction vidéo avec texte via Python+FFmpeg ───────────────
generate_video_with_text() {
  local OUTPUT="$1" W="$2" H="$3" NAME="$4"
  print_step "Génération $NAME avec texte (${W}x${H})..."

  # Étape 1 : Python génère l'image avec texte
  local IMG_WITH_TEXT="$OUTPUT_DIR/_tmp_text_overlay.png"
  python3 << PYEOF
from PIL import Image, ImageDraw, ImageFont
import sys

img = Image.open("$IMAGE").convert("RGBA")
img = img.resize(($W, $H), Image.LANCZOS)
draw = ImageDraw.Draw(img)

def get_font(size):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
    ]
    for p in paths:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

# Titre "Fridos AI" en haut
font_big = get_font(int($W * 0.065))
title = "Fridos AI"
bbox = draw.textbbox((0, 0), title, font=font_big)
tw = bbox[2] - bbox[0]
x = ($W - tw) // 2
y = int($H * 0.07)
draw.text((x+2, y+2), title, font=font_big, fill=(0,0,0,153))
draw.text((x, y), title, font=font_big, fill=(255,255,255,255))

# Tagline en bas
font_med = get_font(int($W * 0.038))
tag = "Scan. Calculate. Eat Smart."
bbox2 = draw.textbbox((0,0), tag, font=font_med)
tw2 = bbox2[2]-bbox2[0]
x2 = ($W - tw2) // 2
y2 = int($H * 0.875)
draw.text((x2+1, y2+1), tag, font=font_med, fill=(0,0,0,178))
draw.text((x2, y2), tag, font=font_med, fill=(255,255,255,255))

# Sous-titre teal
font_sml = get_font(int($W * 0.028))
sub = "AI-powered nutrition tracking"
bbox3 = draw.textbbox((0,0), sub, font=font_sml)
tw3 = bbox3[2]-bbox3[0]
x3 = ($W - tw3) // 2
y3 = int($H * 0.925)
draw.text((x3+1, y3+1), sub, font=font_sml, fill=(0,0,0,127))
draw.text((x3, y3), sub, font=font_sml, fill=(20,184,166,255))

out = img.convert("RGB")
out.save("$IMG_WITH_TEXT")
print("Image avec texte générée ✓")
PYEOF

  if [ ! -f "$IMG_WITH_TEXT" ]; then print_err "Erreur génération image texte Python"; fi

  # Étape 2 : FFmpeg applique Ken Burns + Fade sur l'image avec texte
  local FADE_OUT; FADE_OUT=$(echo "$DURATION $FADE_DUR" | awk '{printf "%.1f",$1-$2}')
  ffmpeg -y -loop 1 -framerate $FPS -i "$IMG_WITH_TEXT" \
    -vf "zoompan=z='min(zoom+0.0007,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${TOTAL_FRAMES}:s=${W}x${H}:fps=${FPS},fade=t=in:st=0:d=1.2:color=black,fade=t=out:st=${FADE_OUT}:d=1.2:color=black,format=yuv420p" \
    -c:v libx264 -preset slow -crf 18 -t $DURATION -movflags +faststart -pix_fmt yuv420p \
    "$OUTPUT" 2>&1 | grep -E "^frame=.*Lsize" | tail -1

  rm -f "$IMG_WITH_TEXT"
  [ -f "$OUTPUT" ] && print_ok "$NAME → $(basename "$OUTPUT") ($(du -sh "$OUTPUT" | cut -f1))" || print_err "Échec $NAME"
}

# ═══════════════════════════════════════════════════════════════
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   🎬  Fridos AI — Video Generator             ║"
printf "║   Durée: %ss  •  FPS: %s  •  Qualité: CRF 18   ║\n" "$DURATION" "$FPS"
echo "╚═══════════════════════════════════════════════╝"
echo ""

generate_video "$OUTPUT_DIR/fridos_promo_portrait.mp4"  $W_PORT $H_PORT "Portrait 9:16"
generate_video "$OUTPUT_DIR/fridos_promo_square.mp4"    $W_SQ   $H_SQ   "Carré 1:1"
generate_video "$OUTPUT_DIR/fridos_promo_landscape.mp4" $W_LAND $H_LAND "Paysage 16:9"
generate_video_with_text "$OUTPUT_DIR/fridos_promo_portrait_text.mp4" $W_PORT $H_PORT "Portrait+Texte"

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   ✅  Génération terminée !                    ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "📁 Fichiers dans : $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null | awk '{printf "   %-50s %s\n",$9,$5}'
echo ""
echo "💡 Plateformes :"
echo "   • Portrait 9:16  → Reels, TikTok, YouTube Shorts"
echo "   • Carré   1:1   → Instagram Feed, Twitter/X"
echo "   • Paysage 16:9  → YouTube, LinkedIn, Site web"
echo "   • +Texte        → Titres 'Fridos AI' animés en overlay"
echo ""
echo "🎵 Ajouter une musique :"
echo "   ffmpeg -i \"$OUTPUT_DIR/fridos_promo_portrait.mp4\" -i musique.mp3 \\"
echo "          -c:v copy -c:a aac -shortest \"$OUTPUT_DIR/fridos_avec_musique.mp4\""
echo ""
