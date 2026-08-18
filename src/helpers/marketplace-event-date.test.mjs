import assert from "node:assert/strict";
import {
  formatMarketplaceCalendarDate,
  normalizeMarketplaceCalendarDateInput,
  normalizeMarketplaceZonedDateInput,
} from "./marketplace-event-date.js";

assert.equal(
  normalizeMarketplaceCalendarDateInput("2026-08-18T00:00:00.000Z"),
  "2026-08-18",
);
assert.equal(
  formatMarketplaceCalendarDate("2026-08-18T00:00:00.000Z"),
  "08/18/2026",
);
assert.equal(
  normalizeMarketplaceZonedDateInput(
    "2026-08-18T03:00:00.000Z",
    "America/New_York",
  ),
  "2026-08-17",
);

console.log("admin marketplace event-date tests passed");
