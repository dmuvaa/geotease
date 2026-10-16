import assert from "node:assert/strict";
import test from "node:test";
import { proximityMark, proximityOf, showsSettlementArea } from "./proximity.ts";

test("within 100 km is a close city area", () => {
  assert.equal(proximityOf(100), "close");
  assert.equal(proximityMark(36), "🟩");
  assert.equal(showsSettlementArea(100, "city"), true);
  assert.equal(showsSettlementArea(100, "town"), true);
  assert.equal(showsSettlementArea(99, "mountain"), false);
  assert.equal(showsSettlementArea(101, "city"), false);
});

test("farther guesses step through the share colors", () => {
  assert.equal(proximityMark(500), "🟨");
  assert.equal(proximityMark(2000), "🟧");
  assert.equal(proximityMark(2001), "🟥");
});
