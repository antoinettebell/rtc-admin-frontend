import assert from "node:assert/strict";
import test from "node:test";

import { formatSocialContentCta } from "./social-media-content.js";

test("formats the persisted CTA type and text without deriving copy", () => {
  assert.equal(formatSocialContentCta({ type: "LINK", text: "Find vendors near you" }), "LINK — Find vendors near you");
  assert.equal(formatSocialContentCta({ type: "LINK", text: "Create your vendor schedule" }), "LINK — Create your vendor schedule");
  assert.equal(formatSocialContentCta(null), "—");
});
