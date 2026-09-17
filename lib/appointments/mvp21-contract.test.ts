import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260916070000_mvp21_weekday_services.sql", import.meta.url),
  "utf8",
);
const redirects = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8")) as {
  redirects: { source: string; destination: string; permanent: boolean }[];
};
const fallbackRedirect = readFileSync(
  new URL("../../components/legacy-path-redirect.tsx", import.meta.url),
  "utf8",
);

describe("MVP 2.1 weekday availability contract", () => {
  it("preserves current behavior by seeding all weekdays in all-services mode", () => {
    expect(migration).toContain("select weekday, 'all'");
    expect(migration).toContain("from generate_series(1, 7)");
  });

  it("keeps all mode dynamic for services created later", () => {
    expect(migration).toContain("rule.mode = 'all'");
    expect(migration).not.toContain("insert into public.weekday_service_selections (weekday, service_id)\nselect weekday");
  });

  it("validates the weekday service rule again inside appointment creation", () => {
    expect(migration).toContain("create or replace function private.create_appointment_internal");
    expect(migration).toContain("message = 'service_unavailable_on_weekday'");
    expect(migration.match(/weekday_service_selections/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("fixes formatted phone validation with an explicit digit pattern", () => {
    expect(migration).toContain("regexp_replace(customer_phone, '[^0-9]', '', 'g')");
    expect(migration).toContain("regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g')");
  });
});

describe("canonical route redirects", () => {
  it("declares permanent redirects for all legacy routes", () => {
    expect(redirects.redirects).toEqual(expect.arrayContaining([
      { source: "/negocio-ns", destination: "/clinica-lisboa", permanent: true },
      { source: "/negocio-ns/agendar", destination: "/clinica-lisboa/agendar", permanent: true },
      { source: "/negocio-ns/agenda", destination: "/clinica-lisboa/agenda", permanent: true },
      { source: "/clinica-ns", destination: "/clinica-lisboa", permanent: true },
      { source: "/clinica-ns/agendar", destination: "/clinica-lisboa/agendar", permanent: true },
      { source: "/clinica-ns/agenda", destination: "/clinica-lisboa/agenda", permanent: true },
    ]));
  });

  it("preserves query strings and hashes in the static-host fallback", () => {
    expect(fallbackRedirect).toContain("window.location.search");
    expect(fallbackRedirect).toContain("window.location.hash");
    expect(fallbackRedirect).toContain("window.location.replace");
    expect(fallbackRedirect).toContain("/clinica-lisboa");
  });
});
