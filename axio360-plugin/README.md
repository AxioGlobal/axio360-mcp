# Axio360 Plugin for Claude

Connect Claude to your Axio360 account to explore cyber risk assessments, analyze scenarios, and generate stakeholder-ready reports — all powered by live data.

## What you can do

- **Explore assessments** — Ask "show my assessments" or "what's my risk score" to browse assessment data, scores, and methodology. You can also create assessments or update name, description, or practice responses when asked.
- **Analyze scenarios** — Ask "show my risk scenarios" or "what's the loss curve for ransomware" to explore scenario collections, impact distributions, and financial exposure. You can also create collections, add catalog scenarios, and update metadata or estimated values when asked.
- **Generate reports** — Ask "generate an executive summary of my cyber risk" or "create a board report" to get a formatted, audience-appropriate report from your live data.

## Setup

### 1. Get your API token

Log in to Axio360 and generate a personal API token under **Account Settings → API Access**.

### 2. Install the plugin

Open Claude Cowork, go to Plugins, and install this `.plugin` file.

### 3. Connect your account

Just tell Claude: **"Set up my Axio360 token"**

Claude will ask you to paste your token, save it automatically, and confirm your account is connected. No terminal or technical steps required.

> **Advanced**: If you prefer to set the token manually, add `AXIO360_API_TOKEN` to the `env` section of `~/.claude/settings.json`. You can also set `AXIO360_ENV` there to select a region — `ca` or `eu` (defaults to `us`; not case-sensitive).

## Skills

| Skill | Trigger phrases |
|-------|----------------|
| axio360-setup | "set up my Axio360 token", "connect to Axio360" |
| axio360-explore | "show my assessments", "what's my risk score", "list models" |
| axio360-scenarios | "show my scenarios", "loss curve for X", "impact distribution" |
| axio360-report | "generate a report", "executive summary", "board report" |

## Requirements

- An active Axio360 account with API access
- Claude Cowork (desktop)
