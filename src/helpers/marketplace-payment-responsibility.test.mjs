import assert from "node:assert/strict";
import {
  getDerivedPaymentResponsibility,
  getMarketplacePaymentVisibility,
} from "./marketplace-payment-responsibility.js";

assert.equal(getDerivedPaymentResponsibility({ fully_catered_event: true }), "COORDINATOR");
assert.deepEqual(
  getMarketplacePaymentVisibility({ catered_vip_section_enabled: true, ga_food_sales_allowed: true }),
  { responsibility: "BOTH", showVendorFee: true, showBudget: true, showPaymentDeadline: true },
);
assert.deepEqual(
  getMarketplacePaymentVisibility({}),
  { responsibility: "VENDOR", showVendorFee: true, showBudget: false, showPaymentDeadline: true },
);

console.log("admin marketplace payment responsibility tests passed");
