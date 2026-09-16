"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { BusinessHour } from "@/lib/appointments/types";
import { getSupabaseClient } from "@/lib/supabase/client";

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function HoursPanel() {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    const { data, error: requestError } = await client
      .from("business_hours")
      .select("*")
      .order("weekday")
      .order("start_time");
    if (requestError) setError("Não foi possível carregar os horários.");
    setHours((data ?? []) as BusinessHour[]);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setError("");
    const { error: requestError } = await client.from("business_hours").insert({
      weekday,
      start_time: startTime,
      end_time: endTime,
      active: true,
    });
    if (requestError) setError("Não foi possível salvar. Confira se o intervalo já existe e se o fim é posterior ao início.");
    else await load();
  }

  async function toggle(item: BusinessHour) {
    const client = getSupabaseClient();
    if (!client) return;
    const { error: requestError } = await client.from("business_hours").update({ active: !item.active }).eq("id", item.id);
    if (requestError) setError("Não foi possível alterar o intervalo."); else await load();
  }

  async function remove(item: BusinessHour) {
    if (!window.confirm(`Excluir ${weekdays[item.weekday - 1]} das ${item.start_time.slice(0, 5)} às ${item.end_time.slice(0, 5)}?`)) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error: requestError } = await client.from("business_hours").delete().eq("id", item.id);
    if (requestError) setError("Não foi possível excluir o intervalo."); else await load();
  }

  return (
    <section className="admin-grid">
      <div className="admin-card">
        <h2 className="admin-title">Horários de atendimento</h2>
        <p className="admin-copy">Você pode cadastrar mais de um intervalo no mesmo dia.</p>
        {loading ? <p className="form-state">Carregando…</p> : hours.length === 0 ? <p className="form-state">Nenhum horário cadastrado.</p> : (
          <div className="mt-5 grid gap-3">
            {hours.map((item) => (
              <article className="manage-row" key={item.id}>
                <div><strong>{weekdays[item.weekday - 1]}</strong><span>{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} · {item.active ? "Ativo" : "Inativo"}</span></div>
                <div className="flex gap-2">
                  <button className="admin-quiet-button" type="button" onClick={() => void toggle(item)}>{item.active ? "Pausar" : "Ativar"}</button>
                  <button className="danger-link" type="button" onClick={() => void remove(item)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <form className="admin-card self-start" onSubmit={create}>
        <h2 className="admin-title">Adicionar intervalo</h2>
        {error && <div className="form-alert mt-4" role="alert">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="field-label">Dia da semana
            <select className="form-field mt-2" value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>
              {weekdays.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">Início<input className="form-field mt-2" required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label className="field-label">Fim<input className="form-field mt-2" required type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
          </div>
        </div>
        <button className="button-primary mt-5" type="submit">Adicionar</button>
      </form>
    </section>
  );
}
