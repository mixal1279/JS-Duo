import test from "node:test";
import assert from "node:assert/strict";
import { dailyScheduleStatus, isValidReminderTime } from "../src/index.js";

const record = (overrides = {}) => ({
  preferences: { enabled: true, time: "18:00", timezone: "Europe/Warsaw", ...overrides },
  lastDailyDate: "",
});

test("validates reminder time strictly as 24-hour HH:mm", () => {
  for (const value of ["00:00", "09:05", "18:00", "23:59"]) {
    assert.equal(isValidReminderTime(value), true, value);
  }
  for (const value of ["", "9:05", "24:00", "23:60", "99:99", "18:0", "18:000", null, 1800]) {
    assert.equal(isValidReminderTime(value), false, String(value));
  }
});

test("daily reminder is eligible at the target minute in the configured timezone", () => {
  const status = dailyScheduleStatus(record(), new Date("2026-10-26T17:00:00.000Z"));
  assert.equal(status.localDate, "2026-10-26");
  assert.equal(status.localTime, "18:00");
  assert.equal(status.targetTime, "18:00");
  assert.equal(status.eligible, true);
  assert.equal(status.minutesSinceTarget, 0);
});

test("daily reminder remains eligible 14 minutes after target, but not at 15", () => {
  const at14 = dailyScheduleStatus(record(), new Date("2026-10-26T17:14:00.000Z"));
  const at15 = dailyScheduleStatus(record(), new Date("2026-10-26T17:15:00.000Z"));
  assert.equal(at14.localTime, "18:14");
  assert.equal(at14.eligible, true);
  assert.equal(at14.minutesSinceTarget, 14);
  assert.equal(at15.localTime, "18:15");
  assert.equal(at15.eligible, false);
  assert.equal(at15.minutesSinceTarget, 15);
});

test("does not qualify a reminder already sent on the same local date", () => {
  const status = dailyScheduleStatus(
    { ...record(), lastDailyDate: "2026-10-26" },
    new Date("2026-10-26T17:05:00.000Z"),
  );
  assert.equal(status.alreadySentToday, true);
  assert.equal(status.eligible, false);
});

test("falls back to 18:00 for malformed stored times", () => {
  for (const time of ["99:99", "24:00", "18:60", "9:00"]) {
    const status = dailyScheduleStatus(record({ time }), new Date("2026-10-26T17:05:00.000Z"));
    assert.equal(status.targetTime, "18:00", time);
    assert.equal(status.eligible, true, time);
  }
});

test("uses the local calendar date and handles the Warsaw DST spring-forward", () => {
  const midnight = dailyScheduleStatus(record({ time: "00:00" }), new Date("2026-10-26T23:00:00.000Z"));
  assert.equal(midnight.localDate, "2026-10-27");
  assert.equal(midnight.localTime, "00:00");
  assert.equal(midnight.eligible, true);

  const dst = dailyScheduleStatus(record(), new Date("2026-03-29T01:00:00.000Z"));
  assert.equal(dst.localDate, "2026-03-29");
  assert.equal(dst.localTime, "03:00");
  assert.equal(dst.timezone, "Europe/Warsaw");
});

test("does not wrap a late-night target into the following local date", () => {
  const nextDay = dailyScheduleStatus(
    record({ time: "23:55" }),
    new Date("2026-10-26T23:00:00.000Z"),
  );
  assert.equal(nextDay.localDate, "2026-10-27");
  assert.equal(nextDay.localTime, "00:00");
  assert.equal(nextDay.minutesSinceTarget, -1435);
  assert.equal(nextDay.eligible, false);
});
