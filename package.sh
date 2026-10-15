#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST="$SCRIPT_DIR/dist"
OUT="$DIST/axio360-pilot.zip"

mkdir -p "$DIST"

if [[ ! -f "$DIST/axio360.mcpb" ]]; then
  echo "ERROR: dist/axio360.mcpb not found. Run ./build.sh first."
  exit 1
fi

echo "==> Build plugin"
rm -f /tmp/axio360.plugin
cd "$SCRIPT_DIR/axio360-plugin"
zip -r /tmp/axio360.plugin . -x "*.DS_Store" > /dev/null
cp /tmp/axio360.plugin "$DIST/axio360.plugin"

echo "==> Render GETTING_STARTED.pdf"
if ! command -v pandoc >/dev/null; then
  echo "ERROR: pandoc not found. Install with: brew install pandoc"
  exit 1
fi
if ! command -v typst >/dev/null; then
  echo "ERROR: typst not found (pandoc PDF engine). Install with: brew install typst"
  exit 1
fi
# NODE_OPTIONS= clears the hook-injected temp file that breaks node-based tooling (see build.sh).
# --resource-path points pandoc at the repo root so the ./images/* links in the
# markdown resolve correctly regardless of the current working directory (we cd'd
# into axio360-plugin above).
NODE_OPTIONS= pandoc "$SCRIPT_DIR/GETTING_STARTED.md" \
  -f markdown-implicit_figures \
  -o "$DIST/GETTING_STARTED.pdf" \
  --pdf-engine=typst \
  --resource-path="$SCRIPT_DIR" \
  -H "$SCRIPT_DIR/pdf-header.typ"

echo "==> Assemble pilot ZIP"
cd "$DIST"
rm -f "$OUT"
zip "$OUT" axio360.mcpb axio360.plugin GETTING_STARTED.pdf

echo ""
echo "Done: $OUT"
