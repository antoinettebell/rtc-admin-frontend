import assert from "node:assert/strict";
import { mergeMarketplaceEventWithAdminDraft } from "./marketplace-admin-event-draft.js";

const event = {
  event_name: "Regression event",
  vendor_fee_payment_deadline: "2026-08-25T17:30:00.000Z",
  dessert_caterer_needed: false,
};

const staleDraft = {
  vendor_fee_payment_deadline: "2026-08-25",
  dessert_caterer_needed: true,
};

const merged = mergeMarketplaceEventWithAdminDraft(event, staleDraft);

assert.equal(merged.vendor_fee_payment_deadline, event.vendor_fee_payment_deadline);
assert.equal(merged.dessert_caterer_needed, true);

console.log("marketplace admin event draft tests passed");
