#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Documented region codes → API base URL. Unknown short names fall back to us.
// Undocumented: paste a full http(s) MCP URL in Region, or set AXIO360_MCP_URL.
const AXIO_BASES = {
  us: "https://api.axio.com",
  ca: "https://ca-api.axio.com",
  eu: "https://eu-api.axio.com",
};
const AXIO_ALIASES = { usa: "us", "united states": "us", canada: "ca", europe: "eu", eur: "eu" };
const REGION_LABELS = { us: "United States", ca: "Canada", eu: "Europe" };

const rawEnvInput = (process.env.AXIO360_ENV || "").trim();
const urlOverride = (process.env.AXIO360_MCP_URL || "").trim();

let resolvedEnv;
let AXIO_MCP_URL;
let isCustomEndpoint;

if (urlOverride) {
  // AXIO360_MCP_URL wins over Region.
  AXIO_MCP_URL = urlOverride;
  resolvedEnv = "custom";
  isCustomEndpoint = true;
} else if (/^https?:\/\//i.test(rawEnvInput)) {
  AXIO_MCP_URL = rawEnvInput;
  resolvedEnv = "custom";
  isCustomEndpoint = true;
} else {
  const rawEnv = (rawEnvInput || "us").toLowerCase();
  resolvedEnv = AXIO_BASES[rawEnv] ? rawEnv : (AXIO_ALIASES[rawEnv] || "us");
  if (!AXIO_BASES[rawEnv] && !AXIO_ALIASES[rawEnv] && rawEnvInput !== "") {
    console.error(`[axio360] Unknown region "${rawEnvInput}"; defaulting to US.`);
  }
  AXIO_MCP_URL = `${AXIO_BASES[resolvedEnv]}/api/mcp`;
  isCustomEndpoint = false;
}

console.error(`[axio360] region=${resolvedEnv} url=${AXIO_MCP_URL}`);

const token = process.env.AXIO360_API_TOKEN;

const REGION_NAME = isCustomEndpoint ? "Custom" : (REGION_LABELS[resolvedEnv] ?? resolvedEnv);
const REGION_DESC = isCustomEndpoint
  ? "custom endpoint"
  : `${REGION_NAME} region (${resolvedEnv})`;

// Server-local tool (not proxied upstream) — always answers even when the token is
// unauthorized or the endpoint is unreachable, so users can confirm where they're pointed.
const CONNECTION_INFO_TOOL = {
  name: "connection_info",
  description:
    "Report which Axio360 region or endpoint this connection targets. Works even when the token is not authorized.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
};

const SERVER_INSTRUCTIONS = isCustomEndpoint
  ? `This Axio360 connection targets a custom endpoint at ${AXIO_MCP_URL}. ` +
    `When you present Axio360 data or generate a report, state that it came from a custom endpoint. ` +
    `If a tool call returns "Unauthorized", the API token most likely does not match this endpoint — ` +
    `tell the user to confirm their token was issued for this host (or adjust the Region setting).`
  : `This Axio360 connection targets the ${REGION_DESC}, at ${AXIO_MCP_URL}. ` +
    `When you present Axio360 data or generate a report, state which region it came from. ` +
    `If a tool call returns "Unauthorized", the API token most likely does not match this region — ` +
    `tell the user to confirm their token was issued for the ${REGION_NAME} region (or adjust the Region setting).`;

async function axioPost(body) {
  const res = await fetch(AXIO_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, ...body }),
  });

  const text = await res.text();
  const dataLine = text.split("\n").find((l) => l.startsWith("data: "));
  if (!dataLine) throw new Error(`Unexpected response: ${text.slice(0, 200)}`);
  return JSON.parse(dataLine.slice(6));
}

// ── Prompts (skills) ──────────────────────────────────────────────────────────

const PROMPTS = [
  {
    name: "axio360-explore",
    description: "Explore assessments, scores, and risk models from Axio360",
    instructions: `You are exploring Axio360 assessment data using live MCP tools.

Use the available Axio360 tools to answer the user's question. Always fetch live data.

Workflow:
- For broad questions, call list_assessments and summarize results in a table.
- For specific details, call get_assessment then get_assessment_scores.
- For methodology questions, call list_assessment_models or get_assessment_model.
- Call who_am_i if the user asks who they are connected as.
- Call connection_info if the user asks which region they are connected to.

Response format:
- Lead with a plain-language summary.
- Present scores as a table when there are multiple dimensions.
- If a score is missing, say so — do not omit it silently.
- Offer to drill into scenarios or generate a report when relevant.`,
  },
  {
    name: "axio360-scenarios",
    description: "Analyze cyber risk scenarios, loss curves, and impact distributions from Axio360",
    instructions: `You are analyzing Axio360 cyber risk scenarios using live MCP tools.

Use the available Axio360 tools to answer the user's question. Always fetch live data.

Workflow:
- Start with list_scenario_collections, then get_scenario_collection_scenarios to see what exists.
- For a specific scenario, pull whichever data is needed:
  - get_scenario_estimated_values → dollar estimates
  - get_scenario_impact_distribution → probability distribution
  - get_scenario_loss_exceedance_curve → loss exceedance thresholds
  - get_scenario_quadrant_breakdown → likelihood vs impact positioning
- For portfolio-level analysis, use get_collection_loss_exceedance_curve.
- To explore benchmark scenarios, use list_catalog_scenarios.

Response format:
- Use plain business language — avoid jargon unless asked.
- For loss exceedance curves: "There is a 10% chance of losses exceeding $X."
- For quadrant breakdowns, explain what each quadrant means in terms of priority.
- When comparing multiple scenarios, use a table.
- Suggest next steps when patterns or outliers are notable.`,
  },
  {
    name: "axio360-report",
    description: "Generate a stakeholder-ready cyber risk report from Axio360 data",
    arguments: [
      {
        name: "audience",
        description: "Target audience: board, ciso, or risk-committee",
        required: false,
      },
    ],
    instructions: `You are generating a stakeholder-ready cyber risk report using live Axio360 MCP tools.

First, identify the audience (board/executive, CISO/security leadership, or risk committee). If not specified, ask.

Fetch this data:
1. list_assessments → get_assessment + get_assessment_scores for the most recent assessment
2. list_scenario_collections → get_scenario_collection_scenarios for the relevant collection
3. get_scenario_estimated_values + get_scenario_loss_exceedance_curve for the top 3–5 scenarios by estimated loss
4. get_collection_loss_exceedance_curve for portfolio-level exposure

Write the report with these sections (omit sections not relevant to the audience):
- **Executive Summary** — 2–3 sentences on risk posture with top financial exposure figure
- **Assessment Overview** — scores by domain with plain-language interpretation
- **Key Risk Scenarios** — top 3–5 by estimated loss, plain-language descriptions
- **Financial Exposure** — "10% chance of losses exceeding $X"
- **Recommendations** — 3–5 prioritized actions based on high-impact, lower-maturity areas

Formatting rules:
- Use markdown headings and tables.
- Express dollars in millions or billions (e.g. "$4.2M", "$1.1B").
- Spell out acronyms on first use.
- If the user asks for bullets, email, or slide format, restructure accordingly.`,
  },
];

// ── Server ────────────────────────────────────────────────────────────────────

async function main() {
  let upstreamTools = [];
  try {
    const { result } = await axioPost({ method: "tools/list", params: {} });
    upstreamTools = result?.tools ?? [];
  } catch (err) {
    process.stderr.write(`Warning: could not load tools from Axio360: ${err.message}\n`);
  }

  const server = new Server(
    { name: "axio360", version: "1.5.0" },
    { capabilities: { tools: {}, prompts: {} }, instructions: SERVER_INSTRUCTIONS }
  );

  // Tools — connection_info is served locally; everything else proxies upstream.
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [CONNECTION_INFO_TOOL, ...upstreamTools],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "connection_info") {
      const summary = isCustomEndpoint
        ? `Connected to a custom Axio360 endpoint.\nEndpoint: ${AXIO_MCP_URL}`
        : `Connected to the Axio360 ${REGION_DESC}.\nEndpoint: ${AXIO_MCP_URL}`;
      return {
        content: [{ type: "text", text: summary }],
      };
    }

    const { result, error } = await axioPost({
      method: "tools/call",
      params: { name, arguments: args ?? {} },
    });

    if (error) {
      return {
        content: [{ type: "text", text: `Axio360 error: ${error.message}` }],
        isError: true,
      };
    }

    return result;
  });

  // Prompts — skills as slash commands
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS.map(({ name, description, arguments: args }) => ({
      name,
      description,
      arguments: args,
    })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS.find((p) => p.name === request.params.name);
    if (!prompt) throw new Error(`Unknown prompt: ${request.params.name}`);

    const audience = request.params.arguments?.audience;
    const regionBanner =
      `You are connected to the Axio360 ${REGION_DESC}. ` +
      `State this region when you present results.\n\n`;
    const base = audience
      ? `${prompt.instructions}\n\nTarget audience: ${audience}`
      : prompt.instructions;
    const instructions = regionBanner + base;

    return {
      description: prompt.description,
      messages: [{ role: "user", content: { type: "text", text: instructions } }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
