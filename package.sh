#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST="$SCRIPT_DIR/dist"
mkdir -p "$DIST"

echo "==> Build plugin"
rm -f /tmp/axio360.plugin
cd "$SCRIPT_DIR/axio360-plugin"
zip -r /tmp/axio360.plugin . -x "*.DS_Store" > /dev/null
cp /tmp/axio360.plugin "$DIST/axio360.plugin"

echo ""
echo "Done: $DIST/axio360.plugin"
