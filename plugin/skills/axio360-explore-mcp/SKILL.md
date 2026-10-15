---
name: axio360-explore-mcp
description: |
  Explore Axio360 assessments, scores, and risk models using the Axio360 MCP server. Use when the user asks to "show my assessments", "what's my risk score", "list assessment models", "who am I connected as", or any question about their Axio360 assessment data. Requires the Axio360 MCPB to be installed.
tools:
  - mcp__axio360__who_am_i
  - mcp__axio360__list_assessments
  - mcp__axio360__get_assessment
  - mcp__axio360__get_assessment_scores
  - mcp__axio360__update_assessment
  - mcp__axio360__create_assessment
  - mcp__axio360__list_assessment_models
  - mcp__axio360__get_assessment_model
---

# Axio360 Assessment Explorer (MCP)

Use the Axio360 MCP tools to answer the user's question about their assessments, scores, and models. Always fetch live data.

## Workflow

- For broad questions ("show me my assessments"), call `list_assessments` and summarize results in a table.
- For specific assessment details, call `get_assessment` then `get_assessment_scores`.
- For questions about methodology or scoring, call `list_assessment_models` or `get_assessment_model`.
- If the user asks who they are connected as, call `who_am_i`.
- To change an assessment name, description, or practice responses, call `update_assessment` (confirm the change with the user first).
- To create a new assessment, call `list_assessment_models` if needed for `modelUUID`, then `create_assessment` (confirm with the user first).

## Response format

- Lead with a plain-language summary.
- Present scores as a table when there are multiple dimensions.
- If a score is missing, say so — do not omit it silently.
- Offer to drill into scenarios or generate a report when relevant.
