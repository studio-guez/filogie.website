#!/usr/bin/env bash
#
# Convert every raster image in public/images to WebP.
#
# Source images in public/images are assumed to already be @2x (retina) assets.
# For each source image this produces two WebP files, meant to be used
# directly in <picture>/srcset markup without going through Glide:
#
#   <name>.webp       - 2x version (same pixel dimensions as the source)
#   <name>@1x.webp    - 1x version (half width/height of the source)
#
# Usage:
#   ./scripts/convert-images-to-webp.sh [directory] [quality]
#
#   directory   Path to scan for images (default: public/images)
#   quality     WebP quality 0-100 (default: 82)
#
# Requires ImageMagick's `convert` binary on the host (not inside Sail).

set -euo pipefail

DIR="${1:-public/images}"
QUALITY="${2:-82}"

if ! command -v convert >/dev/null 2>&1; then
    echo "Error: ImageMagick's 'convert' command was not found on this host." >&2
    exit 1
fi

if [ ! -d "$DIR" ]; then
    echo "Error: directory '$DIR' does not exist." >&2
    exit 1
fi

shopt -s nullglob nocaseglob

count=0

for src in "$DIR"/*.jpg "$DIR"/*.jpeg "$DIR"/*.png; do
    [ -e "$src" ] || continue

    filename="$(basename "$src")"
    name="${filename%.*}"

    webp_2x="$DIR/${name}.webp"
    webp_1x="$DIR/${name}@1x.webp"

    echo "Converting $filename"

    convert "$src" -strip -quality "$QUALITY" "$webp_2x"
    convert "$src" -strip -resize 50% -quality "$QUALITY" "$webp_1x"

    count=$((count + 1))
done

echo "Done. Converted $count image(s) in $DIR."
