import assert from "node:assert/strict";
import test from "node:test";
import { isMapLevel, labelTierCaption, labelTierFor, mapLevelFromChallenge } from "./labels.ts";

test("harder rounds keep the globe to country codes", () => {
  assert.equal(labelTierFor("expert"), "initials");
  assert.equal(labelTierFor("hard"), "initials");
  assert.equal(labelTierFor(null), "initials");
  assert.equal(labelTierCaption("initials"), "Country codes");
});

test("a chosen map level overrides an expert round", () => {
  assert.equal(mapLevelFromChallenge("expert"), "hard");
  assert.equal(mapLevelFromChallenge("easy"), "easy");
  assert.equal(labelTierFor("easy"), "towns");
});

test("only public difficulty choices are accepted", () => {
  assert.equal(isMapLevel("easy"), true);
  assert.equal(isMapLevel("expert"), false);
  assert.equal(isMapLevel(null), false);
});

test("easier rounds reveal more place names", () => {
  assert.equal(labelTierFor("medium"), "major");
  assert.equal(labelTierFor("easy"), "towns");
  assert.equal(labelTierCaption("major"), "Major cities");
  assert.equal(labelTierCaption("towns"), "Cities and towns");
});
