import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./external-web-link.js", import.meta.url),
  "utf8",
);
const pageSource = await readFile(
  new URL("../app/(main)/marketplace-vendors/page.tsx", import.meta.url),
  "utf8",
);
const { normalizeExternalWebLink } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`,
);

assert.equal(
  normalizeExternalWebLink("facebook.com/RoundDaCorner"),
  "https://facebook.com/RoundDaCorner",
  "a legacy protocol-less Facebook value produces an external URL, not an admin-relative route",
);
assert.equal(normalizeExternalWebLink("https://localhost"), null);
assert.equal(normalizeExternalWebLink("https://vendor"), null);
assert.equal(normalizeExternalWebLink("http://10.0.0.4"), null);
assert.equal(normalizeExternalWebLink("https://vendor:secret@example.com"), null);
assert.equal(normalizeExternalWebLink("javascript:alert(1)"), null);
assert.equal(normalizeExternalWebLink("https://www.instagram.com/rounddacorner"), "https://www.instagram.com/rounddacorner");
assert.match(pageSource, /normalizeExternalWebLink\(link\)/);
assert.match(pageSource, /href=\{href\}/);

console.log("Admin external web link helper tests passed.");
