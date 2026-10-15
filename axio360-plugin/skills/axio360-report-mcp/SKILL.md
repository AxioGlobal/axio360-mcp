---
name: axio360-report-mcp
description: |
  Generate stakeholder-ready cyber risk reports from live Axio360 data using the Axio360 MCP server. Use when the user asks to "generate a report", "summarize my risk posture", "write an executive summary", "create a board report", "explain my cyber risk to leadership", or "export findings for stakeholders". Requires the Axio360 MCPB to be installed.
tools:
  - mcp__axio360__list_assessments
  - mcp__axio360__get_assessment
  - mcp__axio360__get_assessment_scores
  - mcp__axio360__list_scenario_collections
  - mcp__axio360__get_scenario_collection_scenarios
  - mcp__axio360__get_scenario
  - mcp__axio360__get_scenario_estimated_values
  - mcp__axio360__get_scenario_loss_exceedance_curve
  - mcp__axio360__get_collection_loss_exceedance_curve
---

# Axio360 Report Generator (MCP)

Use the Axio360 MCP tools to fetch live data and compose a stakeholder-ready report.

## Workflow

### Step 1 — Identify the audience

Ask or infer from context:
- **Board / executive** — financial exposure, top scenarios, strategic recommendations. No technical detail.
- **CISO / security leadership** — scores, scenario breakdowns, trend observations.
- **Risk committee** — detailed loss curves, scenario comparisons, methodology notes.

### Step 2 — Fetch the data

1. `list_assessments` → `get_assessment` + `get_assessment_scores` for the most recent or specified assessment
2. `list_scenario_collections` → `get_scenario_collection_scenarios` for the relevant collection
3. `get_scenario_estimated_values` + `get_scenario_loss_exceedance_curve` for the top 3–5 scenarios by estimated loss
4. `get_collection_loss_exceedance_curve` for portfolio-level exposure

### Step 3 — Write the report

Include these sections, omitting any not relevant to the audience:

- **Executive Summary** — 2–3 sentences on risk posture with top financial exposure figure
- **Assessment Overview** — scores by domain/category with plain-language interpretation
- **Key Risk Scenarios** — top 3–5 by estimated loss, plain-language descriptions
- **Financial Exposure** — "10% chance of losses exceeding $X"
- **Recommendations** — 3–5 prioritized actions based on high-impact, lower-maturity areas

## Formatting rules

- Use markdown headings and tables.
- Express dollar figures in millions or billions (e.g. "$4.2M", "$1.1B").
- Spell out acronyms on first use.
- If the user asks for bullets, email, or slide format, restructure accordingly.
