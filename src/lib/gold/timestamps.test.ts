import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { requirePgTimestamptz, toPgTimestamptz } from "./timestamps.ts";

describe("toPgTimestamptz", () => {
  it("converts JS Date.toString() into ISO that Postgres accepts", () => {
    const js = "Thu Sep 10 2026 01:45:24 GMT+0000 (Coordinated Universal Time)";
    const iso = toPgTimestamptz(js);
    assert.equal(iso, "2026-09-10T01:45:24.000Z");
  });

  it("keeps ISO strings as ISO", () => {
    const iso = "2026-09-10T01:45:24.000Z";
    assert.equal(toPgTimestamptz(iso), iso);
  });

  it("uses Date.toISOString, never Date.toString", () => {
    const d = new Date("2026-09-10T01:45:24.000Z");
    assert.equal(toPgTimestamptz(d), "2026-09-10T01:45:24.000Z");
    assert.notEqual(toPgTimestamptz(d), String(d));
  });

  it("returns null for empty values", () => {
    assert.equal(toPgTimestamptz(null), null);
    assert.equal(toPgTimestamptz(""), null);
    assert.equal(toPgTimestamptz("not a date"), null);
  });

  it("accepts unix seconds and milliseconds", () => {
    const iso = "2026-09-10T01:45:24.000Z";
    const ms = Date.parse(iso);
    assert.equal(toPgTimestamptz(ms), iso);
    assert.equal(toPgTimestamptz(ms / 1000), iso);
  });

  it("requirePgTimestamptz always returns ISO", () => {
    assert.match(requirePgTimestamptz(undefined), /^\d{4}-\d{2}-\d{2}T/);
  });
});
