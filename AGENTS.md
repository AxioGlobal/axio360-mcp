# AGENTS.md

Instructions for AI agents working in this repository.

## What this repo is

Two Claude extensions that connect Claude to the Axio360 cyber risk platform:

- **`mcpb/`** — A Claude Desktop/Cowork extension (`.mcpb`). A local Node.js MCP server that proxies the Axio360 HTTP MCP endpoint via stdio. Includes MCP prompts for explore/scenarios/report workflows.
- **`plugin/`** — A Claude Cowork plugin (`.plugin`). Skill-based workflows using `mcp__axio360__*` tools — requires the MCPB to be installed.

Built artifacts go to `dist/` (gitignored). Run `./build.sh` then `./package.sh` to produce them.

## Repository structure

```text
mcpb/
  manifest.json          # MCPB manifest — tools, prompts, user_config, compatibility
  server/
    index.js             # Node.js MCP server (proxy + prompts)
    package.json
    node_modules/        # gitignored; must be present before mcpb pack

plugin/
  .claude-plugin/
    plugin.json          # Plugin manifest
  .mcp.json              # Empty mcpServers (plugin uses MCPB tools, not direct curl)
  skills/
    axio360-explore-mcp/SKILL.md
    axio360-scenarios-mcp/SKILL.md
    axio360-report-mcp/SKILL.md

VERSION                  # Release line (1.0.0). Each release increments the patch
build.sh                 # Build the MCPB → dist/axio360.mcpb
package.sh               # Build the plugin → dist/axio360.plugin
clean.sh                 # Remove dist/ and intermediate build artifacts
scripts/resolve-version.sh
scripts/stamp-version.js
scripts/patch-mcpb-comment.js
.github/workflows/release.yml
dist/                    # All built artifacts (gitignored)
```

## API

The Axio360 MCP endpoint is region-based: `https://<prefix>api.axio.com/api/mcp`. It uses MCP-over-HTTP (streamable HTTP transport): POST with `Content-Type: application/json`, `Authorization: Bearer <token>`, `Accept: application/json, text/event-stream`. Responses are SSE — extract the `data:` line and parse as JSON-RPC.

The region is chosen at install time via the **Region** user_config field, passed to the server as `AXIO360_ENV` and resolved to a base URL by the `AXIO_BASES` map in `server/index.js`:

| `AXIO360_ENV` | Base URL |
| --------------- | ---------- |
| `us` (default) | `https://api.axio.com` |
| `ca` | `https://ca-api.axio.com` |
| `eu` | `https://eu-api.axio.com` |

Matching is case-insensitive; unknown or blank values fall back to `us`. A full `http(s)` URL may be entered in Region as an undocumented MCP endpoint override (use the full path, including `/api/mcp`). `AXIO360_MCP_URL` takes precedence over Region when set.

The token is a JWT issued by Axio360 (Account Settings → API Access). **Do not validate the JWT's `exp` claim** — pass it to the API as-is and trust the API's response.

## Building

### Prerequisites

```bash
# Install mcpb CLI
npm install -g @anthropic-ai/mcpb

# Install server dependencies (only needed after clone or package.json changes)
cd mcpb/server && npm install && cd ../..

# Generate signing cert (repo root, not committed)
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=Axio/O=Axio/C=US" -addext "extendedKeyUsage=codeSigning"
```

### Build the MCPB

```bash
./build.sh
# → dist/axio360.mcpb
```

Runs: `mcpb pack` → `mcpb sign` → ZIP EOCD patch → `dist/axio360.mcpb`

### Build the plugin

```bash
./package.sh
# → dist/axio360.plugin
```

Zips `plugin/` into `dist/axio360.plugin`. Run `./build.sh` separately for `dist/axio360.mcpb`.

### Clean

```bash
./clean.sh
```

Removes `dist/`, the intermediate `mcpb/mcpb.mcpb`, and the temp `/tmp/axio360.plugin`. Run before a fresh build if you want to be sure no stale artifacts remain.

## Releases

`.github/workflows/release.yml` builds `axio360.mcpb` and `axio360.plugin` on every pull request (artifacts on the workflow run) and publishes a GitHub Release when that pull request is merged to `main`.

Versions restart at `1.0.0` (`VERSION`). Each release increments the patch by 1: `1.0.0`, then `1.0.1`, then `1.0.2`. Set `VERSION` to `1.1.0` or `2.0.0` to open the next release line; the next publish uses that version, and later publishes increment its patch. CI stamps the release version into `manifest.json`, `plugin.json`, and the MCP server before packaging. Leave those files at the `VERSION` value in git.

Signing uses repository secrets `MCPB_SIGNING_CERT` and `MCPB_SIGNING_KEY` (PEM). When they are unset, CI signs with a one-off self-signed certificate.

## Known issues / workarounds

- **NODE_OPTIONS conflict**: Claude Code hooks inject `NODE_OPTIONS` pointing to a temp file that doesn't exist, which breaks the `mcpb` CLI. Both scripts prefix commands with `NODE_OPTIONS=` to clear it. If running mcpb manually, prefix the same way: `NODE_OPTIONS= mcpb pack`.
- **mcpb sign ZIP bug (v2.1.2)**: `mcpb sign` appends the PKCS7 signature but does not update the ZIP end-of-central-directory comment length field. `build.sh` runs `scripts/patch-mcpb-comment.js` after signing to fix this. Without it, Claude Desktop shows "Invalid comment length" when opening the file.
- **mcpb verify broken (v2.1.2)**: `mcpb verify` reports "not signed" even after successful signing. Ignore it — signing works. Confirm by checking the file size increases after signing and that the `MCPB_SIG_END` marker is present.

## MCPB server details

`server/index.js` does three things:

1. **Tool proxy** — On startup, calls `tools/list` on the upstream HTTP MCP endpoint and registers those tools dynamically. Every `tools/call` is forwarded upstream and the result returned as-is.
2. **Prompts** — Registers three MCP prompts (`axio360-explore`, `axio360-scenarios`, `axio360-report`) that appear as slash commands in Claude Desktop/Cowork.
3. **Auth** — Reads `AXIO360_API_TOKEN` from the environment (injected from `user_config` by Claude Desktop).

## Plugin skill details

Skills use `mcp__axio360__*` tools provided by the installed MCPB. They do not make direct curl calls. All three skills require the MCPB to be installed and authenticated.

## Key conventions

- Do not validate JWT expiration client-side anywhere in this codebase.
- `node_modules/` must be present inside `mcpb/server/` before running `mcpb pack`.
- The `.mcp.json` in the plugin has an empty `mcpServers` object by design.
- All built artifacts belong in `dist/` — do not place `.mcpb`, `.plugin`, or `.zip` files at the repo root.
