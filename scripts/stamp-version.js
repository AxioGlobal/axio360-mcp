#!/usr/bin/env node
// Write the CI version into the MCPB manifest, plugin manifest, and server.
// Uses only Node built-ins so this script has no package.json of its own.

const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = join(__dirname, "..");
const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;

const manifestPath = join(ROOT, "axio360-mcpb", "manifest.json");
const pluginPath = join(ROOT, "axio360-plugin", ".claude-plugin", "plugin.json");
const serverPath = join(ROOT, "axio360-mcpb", "server", "index.js");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function replaceOnce(file, pattern, version) {
  const text = readFileSync(file, "utf8");
  if (!pattern.test(text)) {
    fail(`${file}: expected to stamp one version, updated 0`);
  }
  const next = text.replace(pattern, (_match, prefix, suffix) => `${prefix}${version}${suffix}`);
  writeFileSync(file, next);
}

function requireCommittedBase() {
  const expected = readFileSync(join(ROOT, "VERSION"), "utf8").trim();
  const manifest = readJson(manifestPath);
  const plugin = readJson(pluginPath);
  const server = readFileSync(serverPath, "utf8");
  const problems = [];
  if (manifest.version !== expected) problems.push(`manifest.json is ${manifest.version}`);
  if (plugin.version !== expected) problems.push(`plugin.json is ${plugin.version}`);
  if (!server.includes(`version: "${expected}"`)) problems.push("server/index.js does not match");
  if (problems.length > 0) {
    fail(`Committed package versions must match VERSION (${expected}): ${problems.join("; ")}`);
  }
}

function main() {
  const version = process.argv[2];
  if (!version || process.argv.length !== 3) {
    fail(`usage: ${process.argv[1]} <version>`);
  }
  if (!VERSION_RE.test(version)) {
    fail(`refusing to stamp unrecognized version ${JSON.stringify(version)}`);
  }

  requireCommittedBase();

  replaceOnce(manifestPath, /("version"\s*:\s*")[^"]*(")/, version);
  replaceOnce(pluginPath, /("version"\s*:\s*")[^"]*(")/, version);
  replaceOnce(serverPath, /(name:\s*"axio360",\s*version:\s*")[^"]*(")/, version);

  const manifest = readJson(manifestPath);
  const plugin = readJson(pluginPath);
  if (manifest.version !== version || plugin.version !== version) {
    fail("stamped JSON did not parse back to the requested version");
  }
  if (manifest.manifest_version !== "0.3") {
    fail("manifest_version was overwritten while stamping");
  }
}

main();
