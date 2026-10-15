#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST="$SCRIPT_DIR/dist"

echo "==> Remove dist/"
rm -rf "$DIST"

echo "==> Remove intermediate MCPB"
rm -f "$SCRIPT_DIR/mcpb/mcpb.mcpb"

echo "==> Remove temp plugin"
rm -f /tmp/axio360.plugin

echo ""
echo "Clean. Run ./build.sh then ./package.sh to rebuild."
