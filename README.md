# Axio360 for Claude

Connect Claude to your Axio360 account for cyber risk exploration, scenario analysis, and stakeholder reporting — powered by live data.

## What's included

| Package | For | Install |
| --- | --- | --- |
| `axio360.mcpb` | Claude Desktop | Double-click |
| `axio360.plugin` | Claude Cowork | Drag into Cowork |

Both packages expose the same capabilities; they're built for different Claude interfaces.

## What you can do

- **Explore assessments** — "Show my assessments", "What's my risk score", "List assessment models"
- **Analyze scenarios** — "Show my risk scenarios", "What's the loss curve for ransomware", "Compare my top scenarios"
- **Generate reports** — "Generate a board report", "Write an executive summary of my cyber risk"

## Getting your API token

1. Log in to Axio360
2. Go to **Account Settings → API Access**
3. Generate a personal API token

## Installing on Claude Desktop (MCPB)

1. Download `axio360.mcpb`
2. Double-click it — Claude Desktop opens an install dialog
3. Enter your API token in the **API Token** field
4. Click **Install**
5. Restart Claude Desktop

After restarting, all 16 Axio360 tools are available. Three slash commands are also registered:

| Command | What it does |
| --- | --- |
| `/axio360-explore` | Loads assessment exploration guidance |
| `/axio360-scenarios` | Loads scenario analysis guidance |
| `/axio360-report` | Loads report generation guidance (optional: `audience=board\|ciso\|risk-committee`) |

## Installing on Claude Cowork (Plugin)

1. Download `axio360.plugin`
2. Open Claude Cowork → Plugins → Install → select the file
3. In a new session, say **"Set up my Axio360 connection"** and paste your token when prompted
4. The token is stored for the session — you'll need to paste it again in future sessions

## Development

Built artifacts go to `dist/` (gitignored). Run `./build.sh` then `./package.sh`.

### Prerequisites

- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **mcpb CLI** — `npm install -g @anthropic-ai/mcpb`
- **Python 3** — for the ZIP patch step (pre-installed on macOS)
- **pandoc** + **typst** — for `package.sh` PDF rendering (`brew install pandoc typst`)

### Clone and install

```bash
git clone <repo-url>
cd claude-mcp
cd axio360-mcpb/server && npm install && cd ../..
```

### Build the MCPB

```bash
./build.sh
# → dist/axio360.mcpb
```

Runs pack → sign → ZIP patch → copy to `dist/`.

> **Signing certificates** — `cert.pem` and `key.pem` are not committed. For local development, generate a self-signed cert:
>
> ```bash
> openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
>   -subj "/CN=Axio/O=Axio/C=US" -addext "extendedKeyUsage=codeSigning"
> ```
>
> `build.sh` will print this command and exit if the certs are missing.

### Assemble the pilot package

```bash
./package.sh
# → dist/axio360-pilot.zip  (axio360.mcpb, axio360.plugin, GETTING_STARTED.pdf)
```

Requires `dist/axio360.mcpb` — run `./build.sh` first.

### Clean build artifacts

```bash
./clean.sh
```

Removes `dist/` and intermediate artifacts so the next build starts clean.

## Requirements

- An active Axio360 account with API access
- Claude Desktop (for `.mcpb`) or Claude Cowork (for `.plugin`)
