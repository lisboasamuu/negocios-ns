"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Appointment,
  Service,
  WeekdayServiceMode,
  WeekdayServiceRule,
  WeekdayServiceSelection,
} from "@/lib/appointments/types";
import { getSupabaseClient } from "@/lib/supabase/client";

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

type LocalRule = {
  mode: WeekdayServiceMode;
  serviceIds: string[];
};

const emptyRules = () => Object.fromEntries(
  weekdays.map((_, index) => [index + 1, { mode: "all", serviceIds: [] } satisfies LocalRule]),
) as Record<number, LocalRule>;

function weekdayInClinic(isoDate: string) {
  const shortName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(new Date(isoDate));
  return ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[shortName];
}

export function WeeklyServicesPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<Record<number, LocalRule>>(emptyRules);
  const [loading, setLoading] = useState(true);
  const [savingWeekday, setSavingWeekday] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    setError("");

    const [servicesResult, rulesResult, selectionsResult] = await Promise.all([
      client.from("services").select("*").eq("active", true).order("name"),
      client.from("weekday_service_rules").select("weekday, mode").order("weekday"),
      client.from("weekday_service_selections").select("weekday, service_id"),
    ]);

    const requestError = servicesResult.error ?? rulesResult.error ?? selectionsResult.error;
    if (requestError) {
      setError("Não foi possível carregar a disponibilidade semanal. Confirme se a migração MVP 2.1 foi aplicada.");
      setLoading(false);
      return;
    }

    const nextRules = emptyRules();
    for (const rule of (rulesResult.data ?? []) as WeekdayServiceRule[]) {
      nextRules[rule.weekday] = { mode: rule.mode, serviceIds: [] };
    }
    for (const selection of (selectionsResult.data ?? []) as WeekdayServiceSelection[]) {
      nextRules[selection.weekday]?.serviceIds.push(selection.service_id);
    }

    setServices((servicesResult.data ?? []) as Service[]);
    setRules(nextRules);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  function setMode(weekday: number, mode: WeekdayServiceMode) {
    setRules((current) => ({
      ...current,
      [weekday]: { ...current[weekday], mode },
    }));
    setMessage("");
  }

  function toggleService(weekday: number, serviceId: string) {
    setRules((current) => {
      const currentRule = current[weekday];
      const selected = currentRule.serviceIds.includes(serviceId)
        ? currentRule.serviceIds.filter((id) => id !== serviceId)
        : [...currentRule.serviceIds, serviceId];
      return { ...current, [weekday]: { ...currentRule, serviceIds: selected } };
    });
    setMessage("");
  }

  async function save(weekday: number) {
    const client = getSupabaseClient();
    if (!client) return;
    const rule = rules[weekday];
    setSavingWeekday(weekday);
    setError("");
    setMessage("");

    const { data: futureAppointments } = await client
      .from("appointments")
      .select("service_id, starts_at")
      .eq("status", "confirmed")
      .gte("starts_at", new Date().toISOString());

    const { error: requestError } = await client.rpc("save_weekday_service_rule", {
      p_weekday: weekday,
      p_mode: rule.mode,
      p_service_ids: rule.mode === "selected" ? rule.serviceIds : [],
    });

    if (requestError) {
      setError("Não foi possível salvar a regra desse dia.");
    } else {
      const conflicts = rule.mode === "selected"
        ? ((futureAppointments ?? []) as Pick<Appointment, "service_id" | "starts_at">[]).filter(
            (appointment) => weekdayInClinic(appointment.starts_at) === weekday
              && !rule.serviceIds.includes(appointment.service_id),
          ).length
        : 0;
      setMessage(conflicts > 0
        ? `${weekdays[weekday - 1]} atualizado. ${conflicts} agendamento(s) futuro(s) já confirmado(s) foram preservados, mesmo fora da nova regra.`
        : `${weekdays[weekday - 1]} atualizado com sucesso.`);
    }
    setSavingWeekday(null);
  }

  return (
    <section className="admin-card admin-wide-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="admin-title">Serviços por dia da semana</h2>
          <p className="admin-copy max-w-3xl">Defina quais serviços podem receber novos horários em cada dia. “Todos” inclui automaticamente serviços criados no futuro.</p>
        </div>
        <span className="admin-status-pill">Agendamentos existentes são preservados</span>
      </div>

      {error && <div className="form-alert mt-5" role="alert">{error}</div>}
      {message && <div className="success-alert mt-5" role="status">{message}</div>}

      {loading ? <p className="form-state">Carregando regras…</p> : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {weekdays.map((label, index) => {
            const weekday = index + 1;
            const rule = rules[weekday];
            return (
              <article className="weekday-rule-card" key={label}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-xl text-ink">{label}</h3>
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-teal-dark">{rule.mode === "all" ? "Todos" : `${rule.serviceIds.length} selecionado(s)`}</span>
                </div>

                <fieldset className="mt-4">
                  <legend className="sr-only">Modo de serviços para {label}</legend>
                  <div className="weekday-mode-grid">
                    <label className={rule.mode === "all" ? "is-selected" : ""}>
                      <input type="radio" name={`mode-${weekday}`} checked={rule.mode === "all"} onChange={() => setMode(weekday, "all")} />
                      <span><strong>Todos os serviços</strong><small>Atuais e futuros</small></span>
                    </label>
                    <label className={rule.mode === "selected" ? "is-selected" : ""}>
                      <input type="radio" name={`mode-${weekday}`} checked={rule.mode === "selected"} onChange={() => setMode(weekday, "selected")} />
                      <span><strong>Serviços específicos</strong><small>Seleção manual</small></span>
                    </label>
                  </div>
                </fieldset>

                {rule.mode === "selected" && (
                  <fieldset className="mt-4">
                    <legend className="field-label">Oferecidos neste dia</legend>
                    {services.length === 0 ? <p className="form-state">Nenhum serviço ativo cadastrado.</p> : (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {services.map((service) => (
                          <label className="service-check" key={service.id}>
                            <input
                              type="checkbox"
                              checked={rule.serviceIds.includes(service.id)}
                              onChange={() => toggleService(weekday, service.id)}
                            />
                            <span>{service.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {rule.serviceIds.length === 0 && <p className="mt-3 text-xs leading-5 text-muted">Sem seleção, nenhum novo horário será oferecido neste dia.</p>}
                  </fieldset>
                )}

                <button className="admin-quiet-button mt-5" type="button" disabled={savingWeekday === weekday} onClick={() => void save(weekday)}>
                  {savingWeekday === weekday ? "Salvando…" : `Salvar ${label.toLowerCase()}`}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
