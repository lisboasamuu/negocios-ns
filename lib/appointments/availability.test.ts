import { describe, expect, it } from "vitest";
import {
  generateAvailableSlots,
  isServiceAllowedForWeekday,
  mapBookingError,
  rangesOverlap,
  timeToMinutes,
} from "./availability";

const hours = [{ start: timeToMinutes("09:00"), end: timeToMinutes("18:00") }];

describe("availability rules", () => {
  it("generates slots using the configured interval", () => {
    const slots = generateAvailableSlots({ date: "2026-10-01", durationMinutes: 60, intervalMinutes: 30, businessHours: hours });
    expect(slots[0]).toEqual({ start: 540, end: 600 });
    expect(slots[1]).toEqual({ start: 570, end: 630 });
  });

  it("considers the complete service duration", () => {
    const slots = generateAvailableSlots({ date: "2026-10-01", durationMinutes: 90, intervalMinutes: 30, businessHours: hours });
    expect(slots.at(-1)).toEqual({ start: 990, end: 1080 });
  });

  it("does not allow a service to end after closing", () => {
    const slots = generateAvailableSlots({ date: "2026-10-01", durationMinutes: 60, intervalMinutes: 30, businessHours: hours });
    expect(slots).not.toContainEqual({ start: 1050, end: 1110 });
  });

  it("removes slots that overlap confirmed appointments", () => {
    const slots = generateAvailableSlots({ date: "2026-10-01", durationMinutes: 60, intervalMinutes: 30, businessHours: hours, appointments: [{ start: 600, end: 660 }] });
    expect(slots).not.toContainEqual({ start: 570, end: 630 });
    expect(slots).not.toContainEqual({ start: 600, end: 660 });
    expect(slots).not.toContainEqual({ start: 630, end: 690 });
  });

  it("removes slots that overlap blocked periods", () => {
    const slots = generateAvailableSlots({ date: "2026-10-01", durationMinutes: 30, intervalMinutes: 30, businessHours: hours, blockedPeriods: [{ start: 720, end: 780 }] });
    expect(slots).not.toContainEqual({ start: 720, end: 750 });
    expect(slots).not.toContainEqual({ start: 750, end: 780 });
  });

  it("rejects past dates and already-started slots", () => {
    expect(generateAvailableSlots({ date: "2026-09-14", durationMinutes: 60, intervalMinutes: 30, businessHours: hours, now: { date: "2026-09-15", minute: 600 } })).toEqual([]);
    const today = generateAvailableSlots({ date: "2026-09-15", durationMinutes: 60, intervalMinutes: 30, businessHours: hours, now: { date: "2026-09-15", minute: 600 } });
    expect(today.every((slot) => slot.start > 600)).toBe(true);
  });

  it("treats touching ranges as non-overlapping", () => {
    expect(rangesOverlap({ start: 540, end: 600 }, { start: 600, end: 660 })).toBe(false);
  });

  it("maps database concurrency conflicts to a recoverable message", () => {
    expect(mapBookingError("slot_conflict")).toContain("acabou de ser reservado");
  });

  it("includes active current and future services when the weekday uses all services", () => {
    for (const serviceId of ["current-service", "future-service"]) {
      expect(isServiceAllowedForWeekday({ serviceId, serviceActive: true, mode: "all", selectedServiceIds: [] })).toBe(true);
    }
  });

  it("limits selected weekdays to their explicit services", () => {
    expect(isServiceAllowedForWeekday({ serviceId: "facial", serviceActive: true, mode: "selected", selectedServiceIds: ["facial"] })).toBe(true);
    expect(isServiceAllowedForWeekday({ serviceId: "massage", serviceActive: true, mode: "selected", selectedServiceIds: ["facial"] })).toBe(false);
  });

  it("never offers inactive services regardless of the weekday mode", () => {
    expect(isServiceAllowedForWeekday({ serviceId: "inactive", serviceActive: false, mode: "all", selectedServiceIds: [] })).toBe(false);
    expect(isServiceAllowedForWeekday({ serviceId: "inactive", serviceActive: false, mode: "selected", selectedServiceIds: ["inactive"] })).toBe(false);
  });

  it("maps weekday restrictions to a clear recoverable message", () => {
    expect(mapBookingError("service_unavailable_on_weekday")).toContain("não é oferecido");
  });
});
