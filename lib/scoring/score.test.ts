import assert from "node:assert/strict";
import test from "node:test";
import { distanceScore, finalScore, haversineKm } from "./score.ts";

test("a perfect pin scores 10000 before modifiers", () => {
  assert.equal(distanceScore(0, 0), 10000);
});

test("closer guesses score higher until the curve rounds to zero", () => {
  const distances = [0, 1, 10, 25, 50, 100, 250, 500, 1000, 2000, 4000];
  const scores = distances.map((distance) => distanceScore(distance, 0));
  for (let index = 1; index < scores.length; index += 1) {
    assert.ok(
      scores[index] < scores[index - 1],
      `${distances[index]} km scored ${scores[index]}, expected less than ${scores[index - 1]}`,
    );
  }
});

test("the same modifiers keep a closer guess ahead", () => {
  const close = finalScore({
    distanceKm: 10,
    toleranceKm: 0,
    cluesUsed: 3,
    difficulty: "hard",
  });
  const far = finalScore({
    distanceKm: 800,
    toleranceKm: 0,
    cluesUsed: 3,
    difficulty: "hard",
  });
  assert.ok(close.distanceScore > far.distanceScore);
  assert.ok(close.score > far.score);
});

test("fewer clues raise the multiplier", () => {
  const bold = finalScore({
    distanceKm: 40,
    toleranceKm: 0,
    cluesUsed: 1,
    difficulty: "medium",
  });
  const cautious = finalScore({
    distanceKm: 40,
    toleranceKm: 0,
    cluesUsed: 5,
    difficulty: "medium",
  });
  assert.equal(bold.clueMultiplier, 1);
  assert.equal(cautious.clueMultiplier, 0.6);
  assert.ok(bold.score > cautious.score);
});

test("approximate targets treat the tolerance radius as a direct hit", () => {
  assert.equal(distanceScore(30, 40), distanceScore(0, 0));
  assert.ok(distanceScore(50, 40) < distanceScore(0, 0));
});

test("haversine distance is symmetric and zero at the same point", () => {
  const berlin = { latitude: 52.52, longitude: 13.405 };
  const warsaw = { latitude: 52.2297, longitude: 21.0122 };
  assert.equal(haversineKm(berlin, berlin), 0);
  assert.ok(Math.abs(haversineKm(berlin, warsaw) - haversineKm(warsaw, berlin)) < 0.001);
  assert.ok(haversineKm(berlin, warsaw) > 500);
  assert.ok(haversineKm(berlin, warsaw) < 540);
});
