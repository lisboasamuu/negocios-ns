"use client";

import { useCallback, useEffect, useState } from "react";
import { clinicDayBounds, formatClinicTime, todayInClinic } from "@/lib/appointments/dates";
import type { Appointment } from "@/lib/appointments/types";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AgendaPanel() {
  const [date, setDate] = useState(todayInClinic());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    setError("");
    const bounds = clinicDayBounds(date);
    const { data, error: requestError } = await client
      .from("appointments")
      .select("*, service:services(name,duration_minutes)")
      .gte("starts_at", bounds.start)
      .lt("starts_at", bounds.end)
      .order("starts_at");
    if (requestError) setError("Não foi possível carregar a agenda.");
    setAppointments((data ?? []) as unknown as Appointment[]);
    setLoading(false);
  }, [date]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  async function cancelAppointment(appointment: Appointment) {
    if (!window.confirm(`Cancelar o horário de ${appointment.customer_name}?`)) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error: requestError } = await client
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id);
    if (requestError) {
      setError("Não foi possível cancelar o agendamento.");
      return;
    }
    setSelected(null);
    await load();
  }

  return (
    <section className="admin-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 className="admin-title">Agenda do dia</h2><p className="admin-copy">Atendimentos confirmados e cancelados.</p></div>
        <label className="field-label sm:w-52">Data<input className="form-field mt-2" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      </div>
      {error && <div className="form-alert mt-5" role="alert">{error}</div>}
      {loading ? <p className="form-state">Carregando agenda…</p> : appointments.length === 0 ? <p className="form-state">Nenhum atendimento neste dia.</p> : (
        <div className="mt-5 grid gap-3">
          {appointments.map((appointment) => (
            <button key={appointment.id} type="button" className="appointment-row" onClick={() => setSelected(appointment)}>
              <time>{formatClinicTime(appointment.starts_at)}</time>
              <span><strong>{appointment.customer_name}</strong><small>{appointment.service?.name ?? "Serviço"} · {appointment.customer_phone}</small></span>
              <em className={appointment.status === "confirmed" ? "status-confirmed" : "status-cancelled"}>{appointment.status === "confirmed" ? "Confirmado" : "Cancelado"}</em>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="admin-detail mt-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="eyebrow">Detalhes</p><h3 className="mt-1 font-serif text-2xl">{selected.customer_name}</h3></div>
            <button className="admin-quiet-button" type="button" onClick={() => setSelected(null)}>Fechar</button>
          </div>
          <dl className="review-list mt-4">
            <div><dt>Horário</dt><dd>{formatClinicTime(selected.starts_at)}–{formatClinicTime(selected.ends_at)}</dd></div>
            <div><dt>Serviço</dt><dd>{selected.service?.name ?? "Serviço"}</dd></div>
            <div><dt>Telefone</dt><dd><a className="text-teal-dark underline" href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a></dd></div>
            <div><dt>Origem</dt><dd>{selected.source === "manual" ? "Cadastro manual" : "Site"}</dd></div>
            {selected.customer_notes && <div><dt>Observações</dt><dd>{selected.customer_notes}</dd></div>}
          </dl>
          {selected.status === "confirmed" && <button className="danger-button mt-5" type="button" onClick={() => void cancelAppointment(selected)}>Cancelar agendamento</button>}
        </div>
      )}
    </section>
  );
}
