import assert from "node:assert/strict";
import test from "node:test";

import { formatSocialContentCreative, formatSocialContentCta } from "./social-media-content.js";

test("formats the persisted CTA type and text without deriving copy", () => {
  assert.equal(formatSocialContentCta({ type: "LINK", text: "Find vendors near you" }), "LINK — Find vendors near you");
  assert.equal(formatSocialContentCta({ type: "LINK", text: "Create your vendor schedule" }), "LINK — Create your vendor schedule");
  assert.equal(formatSocialContentCta(null), "—");
});

test("maps persisted creative fields without transforming creative values", () => {
  assert.deepEqual(formatSocialContentCreative({
    required: true,
    type: "VIDEO",
    direction: "A vendor plans the week beside their food truck.",
    source: "OPENAI",
    assetUrl: "https://assets.example/creative.mp4",
    altText: "Vendor planning beside a food truck",
  }), {
    required: "Yes",
    type: "VIDEO",
    direction: "A vendor plans the week beside their food truck.",
    source: "OPENAI",
    assetUrl: "https://assets.example/creative.mp4",
    altText: "Vendor planning beside a food truck",
    missingRequiredDirection: false,
  });
});

test("keeps empty creative values visible and flags a required missing direction", () => {
  assert.deepEqual(formatSocialContentCreative({ required: true, type: "VIDEO" }), {
    required: "Yes",
    type: "VIDEO",
    direction: "—",
    source: "—",
    assetUrl: "—",
    altText: "—",
    missingRequiredDirection: true,
  });
});
