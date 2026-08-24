import assert from "node:assert/strict";
import {
  buildMarketplacePaymentDeadline,
  formatMarketplacePaymentDeadlineTimeInput,
} from "./marketplace-payment-deadline.js";

const original = "2026-08-25T22:30:00.000Z";
const originalTime = formatMarketplacePaymentDeadlineTimeInput(original);

assert.equal(
  buildMarketplacePaymentDeadline({
    date: "2026-08-25",
    time: originalTime,
    original,
    originalDate: "2026-08-25",
    originalTime,
  }),
  original,
  "an unchanged Admin deadline preserves its exact stored timestamp",
);
assert.equal(
  buildMarketplacePaymentDeadline({ date: "2026-08-25", time: "14:30" }),
  new Date(2026, 7, 25, 14, 30, 0, 0).toISOString(),
  "an Admin-selected date and time produces a full timestamp",
);

console.log("admin marketplace payment deadline tests passed");
