import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260915070000_mvp2_appointments.sql", import.meta.url),
  "utf8",
);

describe("database security and concurrency contract", () => {
  it("enforces confirmed appointment overlap at database level", () => {
    expect(migration).toContain("appointments_no_confirmed_overlap");
    expect(migration).toContain("exclude using gist");
    expect(migration).toContain("where (status = 'confirmed')");
    expect(migration).toContain("exception when exclusion_violation");
  });

  it("uses the same internal booking function for public and manual bookings", () => {
    expect(migration.match(/private\.create_appointment_internal/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("'online'");
    expect(migration).toContain("'manual'");
  });

  it("enables RLS on every table containing operational or customer data", () => {
    for (const table of ["services", "business_hours", "booking_settings", "appointments", "blocked_periods", "admin_users"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("does not grant public table access to customer records", () => {
    expect(migration).not.toContain("grant select on public.appointments to anon");
    expect(migration).not.toContain("grant select on public.appointments to public");
  });

  it("requires an allowlisted authenticated administrator", () => {
    expect(migration).toContain("auth.uid() is not null");
    expect(migration).toContain("exists (\n      select 1 from public.admin_users");
    expect(migration).toContain("message = 'admin_required'");
  });

  it("treats America/Sao_Paulo as the explicit business timezone", () => {
    expect(migration.match(/America\/Sao_Paulo/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("rejects appointment starts that are outside the configured slot grid", () => {
    expect(migration).toContain("settings.slot_interval_minutes");
    expect(migration).toContain("local_start::time - hours.start_time");
  });

  it("serializes appointment and blocked-period writes", () => {
    expect(migration.match(/pg_advisory_xact_lock/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
