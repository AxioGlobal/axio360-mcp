---
name: axio360-scenarios-mcp
description: |
  Analyze cyber risk scenarios in Axio360 using the Axio360 MCP server, including loss exceedance curves, impact distributions, estimated values, and quadrant breakdowns. Use when the user asks to "show my scenarios", "what's the loss curve for", "analyze my cyber risk scenarios", "show impact distribution", "compare scenarios", or any question about scenario-level risk data. Requires the Axio360 MCPB to be installed.
tools:
  - mcp__axio360__list_scenario_collections
  - mcp__axio360__get_scenario_collection
  - mcp__axio360__get_scenario_collection_scenarios
  - mcp__axio360__update_scenario_collection
  - mcp__axio360__create_scenario_collection
  - mcp__axio360__list_catalog_scenarios
  - mcp__axio360__get_scenario
  - mcp__axio360__update_scenario
  - mcp__axio360__create_scenario_from_catalog
  - mcp__axio360__get_scenario_estimated_values
  - mcp__axio360__update_estimated_value
  - mcp__axio360__get_scenario_impact_distribution
  - mcp__axio360__get_scenario_loss_exceedance_curve
  - mcp__axio360__get_scenario_quadrant_breakdown
  - mcp__axio360__get_collection_loss_exceedance_curve
---

# Axio360 Scenario Analyst (MCP)

Use the Axio360 MCP tools to help the user understand their cyber risk scenarios. Always fetch live data.

## Workflow

- Start with `list_scenario_collections`, then `get_scenario_collection_scenarios` to see what's available.
- For a specific scenario, pull whichever data the user needs:
  - `get_scenario_estimated_values` — dollar-value estimates
  - `get_scenario_impact_distribution` — probability distribution of impact levels
  - `get_scenario_loss_exceedance_curve` — how likely losses exceed given thresholds
  - `get_scenario_quadrant_breakdown` — likelihood vs. impact positioning
- For portfolio-level loss curves, use `get_collection_loss_exceedance_curve`.
- To explore catalog scenarios (benchmarks), use `list_catalog_scenarios`.
- To change data (confirm with the user first):
  - `update_scenario_collection` — collection title/description/metadata
  - `update_scenario` — title, description, or susceptibility
  - `update_estimated_value` — min/expected/max amounts for an attribute ID from `get_scenario_estimated_values`
- To create data (confirm with the user first):
  - `create_scenario_collection` — new collection with optional metadata
  - `create_scenario_from_catalog` — add a catalog scenario into a collection (`list_catalog_scenarios` for IDs)

## Response format

- Use plain business language — avoid jargon unless asked.
- For loss exceedance curves: "There is a 10% chance of losses exceeding $X."
- For quadrant breakdowns, explain what each quadrant means in terms of priority.
- When comparing multiple scenarios, use a table.
- Suggest next steps when patterns or outliers are notable.
