import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const repository = await readFile(
  new URL("../app/(main)/marketplace-repository/page.tsx", import.meta.url),
  "utf8",
);
const vendors = await readFile(
  new URL("../app/(main)/marketplace-vendors/page.tsx", import.meta.url),
  "utf8",
);
const service = await readFile(
  new URL("../services/marketplace-api-service.ts", import.meta.url),
  "utf8",
);

assert.match(repository, /setViewingEvent\(event\)/);
assert.match(repository, /marketplace-event-details-title/);
assert.match(repository, /> Edit/);
assert.match(repository, /Cancel Event/);
assert.match(repository, /Close Event/);
assert.match(vendors, /Pending Activation/);
assert.match(vendors, /Request Reactivation/);
assert.match(vendors, /Resend Reactivation/);
assert.doesNotMatch(vendors, /disabled=\{terminal\.reactivation_required\}/);
assert.match(service, /"PENDING_ACTIVATION" \| "ACTIVE" \| "HISTORICAL"/);

console.log("Marketplace admin operations control tests passed");
