import assert from "node:assert/strict";
import { normalizeEventVendorNeedsForPayload } from "./marketplace-event-vendor-needs.js";

const payload = normalizeEventVendorNeedsForPayload([
  {
    _id: "66af8a7f5fc9f1443b000001",
    id: "client-only-id",
    __v: 3,
    vendor_type: "MERCHANDISE",
    type_description: "Apparel",
    quantity: 1,
    fee: 25,
    created_at: "2026-08-24T00:00:00.000Z",
  },
]);

assert.deepEqual(payload, [{
  vendor_type: "MERCHANDISE",
  type_description: "Apparel",
  quantity: 1,
  fee: 25,
}]);
assert.deepEqual(Object.keys(payload[0]).sort(), ["fee", "quantity", "type_description", "vendor_type"]);

console.log("admin marketplace event vendor-needs payload tests passed");
