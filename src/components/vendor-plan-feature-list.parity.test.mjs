import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { VENDOR_PLAN_TIERS } = require("../../../rtc-backend/src/helper/vendor-plan-helper.js");
const source = await readFile(new URL("./vendor-plan-feature-list.tsx", import.meta.url), "utf8");

for (const [key, tier] of Object.entries({
  BASIC: VENDOR_PLAN_TIERS.SUB_BASIC,
  PLATINUM: VENDOR_PLAN_TIERS.SUB_PLATINUM,
  ELITE: VENDOR_PLAN_TIERS.SUB_ELITE,
})) {
  const block = source.slice(source.indexOf(`${key}: [`), source.indexOf("],", source.indexOf(`${key}: [`)) + 2);
  const rendered = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(rendered, tier.details, `${key} Admin benefits must exactly match the backend order`);
}

assert.doesNotMatch(source, /Marketplace ordering|Preorder ordering|QR ordering|Basic reporting|Advanced reporting|Customizable reporting|Ability to highlight dishes|No \$\{/);
console.log("Admin/backend vendor plan benefit parity tests passed.");
