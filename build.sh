#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCPB_DIR="$SCRIPT_DIR/axio360-mcpb"
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
NODE_OPTIONS= mcpb sign axio360-mcpb.mcpb --cert "$CERT" --key "$KEY"

echo "==> Patch ZIP EOCD comment length"
python3 - <<'EOF'
import struct, sys
with open("axio360-mcpb.mcpb", "rb") as f:
    data = bytearray(f.read())
pos = data.rfind(b"PK\x05\x06")
if pos == -1:
    sys.exit("ERROR: ZIP EOCD not found")
extra = len(data) - pos - 22
struct.pack_into("<H", data, pos + 20, extra)
with open("axio360-mcpb.mcpb", "wb") as f:
    f.write(data)
print(f"  comment_len patched to {extra}")
EOF

echo "==> Copy to dist/"
cp axio360-mcpb.mcpb "$DIST/axio360.mcpb"

echo ""
echo "Done: $DIST/axio360.mcpb"
