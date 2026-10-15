#!/usr/bin/env node
// mcpb sign appends a PKCS7 comment without updating the ZIP end-of-central-directory
// comment length. Write that length back so Claude Desktop can open the bundle.
// Uses only Node built-ins.

const { readFileSync, writeFileSync } = require("node:fs");

const file = process.argv[2];
if (!file || process.argv.length !== 3) {
  console.error("usage: patch-mcpb-comment.js <file.mcpb>");
  process.exit(1);
}

const data = readFileSync(file);
const pos = data.lastIndexOf(Buffer.from("PK\x05\x06"));
if (pos === -1) {
  console.error("ERROR: ZIP EOCD not found");
  process.exit(1);
}

const extra = data.length - pos - 22;
if (extra < 0 || extra > 0xffff) {
  console.error(`ERROR: ZIP comment length ${extra} does not fit in 16 bits`);
  process.exit(1);
}

const out = Buffer.from(data);
out.writeUInt16LE(extra, pos + 20);
writeFileSync(file, out);
console.log(`  comment_len patched to ${extra}`);
