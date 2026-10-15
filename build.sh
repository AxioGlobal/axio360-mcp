#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCPB_DIR="$SCRIPT_DIR/mcpb"
CERT="$SCRIPT_DIR/cert.pem"
KEY="$SCRIPT_DIR/key.pem"
DIST="$SCRIPT_DIR/dist"
mkdir -p "$DIST"

if [[ ! -f "$CERT" || ! -f "$KEY" ]]; then
  echo "ERROR: cert.pem / key.pem not found in repo root."
  echo "Generate with:"
  echo "  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \\"
  echo "    -subj '/CN=Axio/O=Axio/C=US' -addext 'extendedKeyUsage=codeSigning'"
  exit 1
fi

echo "==> Pack"
cd "$MCPB_DIR"
NODE_OPTIONS= mcpb pack

echo "==> Sign"
NODE_OPTIONS= mcpb sign mcpb.mcpb --cert "$CERT" --key "$KEY"

echo "==> Patch ZIP EOCD comment length"
NODE_OPTIONS= node "$SCRIPT_DIR/scripts/patch-mcpb-comment.js" mcpb.mcpb

echo "==> Copy to dist/"
cp mcpb.mcpb "$DIST/axio360.mcpb"

echo ""
echo "Done: $DIST/axio360.mcpb"
