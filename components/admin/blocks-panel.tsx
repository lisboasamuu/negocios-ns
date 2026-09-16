"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { clinicLocalToUtc, formatClinicDate, formatClinicTime, todayInClinic } from "@/lib/appointments/dates";
import type { BlockedPeriod } from "@/lib/appointments/types";
import { getSupabaseClient } from "@/lib/supabase/client";

function localInputToUtc(value: string) {
  const [date, time] = value.split("T");
  return clinicLocalToUtc(date, time);
}

export function BlocksPanel() {
  const initial = `${todayInClinic()}T09:00`;
  const [periods, setPeriods] = useState<BlockedPeriod[]>([]);
  const [startsAt, setStartsAt] = useState(initial);
  const [endsAt, setEndsAt] = useState(`${todayInClinic()}T10:00`);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    const { data, error: requestError } = await client.from("blocked_periods").select("*").order("starts_at", { ascending: false }).limit(50);
    if (requestError) setError("Não foi possível carregar os bloqueios.");
    setPeriods((data ?? []) as BlockedPeriod[]);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setError("");
    const { error: requestError } = await client.rpc("create_blocked_period", {
      p_starts_at: localInputToUtc(startsAt),
      p_ends_at: localInputToUtc(endsAt),
      p_reason: reason.trim() || null,
    });
    if (requestError) {
      setError(requestError.message.includes("block_conflict")
        ? "Já existe um atendimento confirmado nesse período. Cancele ou reagende o atendimento antes de bloquear."
        : "Não foi possível criar o bloqueio. Confira o período informado.");
    } else {
      setReason("");
      await load();
    }
  }

  async function remove(period: BlockedPeriod) {
    if (!window.confirm("Remover este bloqueio da agenda?")) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error: requestError } = await client.from("blocked_periods").delete().eq("id", period.id);
    if (requestError) setError("Não foi possível remover o bloqueio."); else await load();
  }

  return (
    <section className="admin-grid">
      <div className="admin-card">
        <h2 className="admin-title">Períodos bloqueados</h2>
        <p className="admin-copy">Férias, almoço, manutenção ou qualquer indisponibilidade.</p>
        {loading ? <p className="form-state">Carregando…</p> : periods.length === 0 ? <p className="form-state">Nenhum período bloqueado.</p> : (
          <div className="mt-5 grid gap-3">{periods.map((period) => (
            <article className="manage-row" key={period.id}>
              <div><strong>{formatClinicDate(period.starts_at, false)} · {formatClinicTime(period.starts_at)}–{formatClinicTime(period.ends_at)}</strong><span>{period.reason || "Sem motivo informado"}</span></div>
              <button className="danger-link" type="button" onClick={() => void remove(period)}>Remover</button>
            </article>
          ))}</div>
        )}
      </div>

      <form className="admin-card self-start" onSubmit={create}>
        <h2 className="admin-title">Novo bloqueio</h2>
        {error && <div className="form-alert mt-4" role="alert">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="field-label">Início<input className="form-field mt-2" required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
          <label className="field-label">Fim<input className="form-field mt-2" required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
          <label className="field-label">Motivo <span className="font-normal text-muted">(opcional)</span><input className="form-field mt-2" maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        </div>
        <button className="button-primary mt-5" type="submit">Bloquear período</button>
      </form>
    </section>
  );
}
