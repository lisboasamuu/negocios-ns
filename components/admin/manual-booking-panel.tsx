"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { mapBookingError } from "@/lib/appointments/availability";
import { addDaysToDate, todayInClinic } from "@/lib/appointments/dates";
import type { AvailableSlot, Service } from "@/lib/appointments/types";
import { getSupabaseClient } from "@/lib/supabase/client";

export function ManualBookingPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayInClinic());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSlots = useCallback(async (currentServiceId: string, currentDate: string) => {
    if (!currentServiceId || !currentDate) {
      setSlots([]);
      return;
    }
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    const { data, error: requestError } = await client.rpc("get_available_slots", {
      p_service_id: currentServiceId,
      p_date: currentDate,
    });
    if (requestError) setError("Não foi possível consultar os horários.");
    setSlots((data ?? []) as AvailableSlot[]);
    setStartsAt("");
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadServices() {
      const client = getSupabaseClient();
      if (!client) return;
      const { data, error: requestError } = await client.from("services").select("*").eq("active", true).order("name");
      if (requestError) setError("Não foi possível carregar os serviços.");
      else {
        const items = (data ?? []) as Service[];
        setServices(items);
        if (items[0]) setServiceId(items[0].id);
      }
      setLoading(false);
    }
    void loadServices();
  }, []);

  useEffect(() => { queueMicrotask(() => { void loadSlots(serviceId, date); }); }, [date, loadSlots, serviceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startsAt) {
      setError("Escolha um horário disponível.");
      return;
    }
    const client = getSupabaseClient();
    if (!client) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    const { error: requestError } = await client.rpc("create_admin_appointment", {
      p_service_id: serviceId,
      p_starts_at: startsAt,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_customer_notes: notes.trim() || null,
    });
    if (requestError) {
      setError(mapBookingError(requestError.message));
      if (requestError.message.includes("slot_conflict")) await loadSlots(serviceId, date);
    } else {
      setName("");
      setPhone("");
      setNotes("");
      setStartsAt("");
      setMessage("Agendamento manual criado com sucesso.");
      await loadSlots(serviceId, date);
    }
    setSubmitting(false);
  }

  return (
    <form className="admin-card max-w-3xl" onSubmit={submit}>
      <h2 className="admin-title">Novo agendamento</h2>
      <p className="admin-copy">Cadastre atendimentos recebidos por telefone ou WhatsApp usando a mesma disponibilidade do site.</p>
      {error && <div className="form-alert mt-5" role="alert">{error}</div>}
      {message && <div className="success-alert mt-5" role="status">{message}</div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="field-label">Serviço
          <select className="form-field mt-2" required value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min</option>)}
          </select>
        </label>
        <label className="field-label">Data
          <input className="form-field mt-2" required type="date" min={todayInClinic()} max={addDaysToDate(todayInClinic(), 120)} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      <fieldset className="mt-5">
        <legend className="field-label">Horário</legend>
        {loading ? <p className="form-state">Consultando agenda…</p> : slots.length === 0 ? <p className="form-state">Sem horários livres nesta data.</p> : (
          <div className="slot-grid mt-3">
            {slots.map((slot) => (
              <button key={slot.starts_at} className={startsAt === slot.starts_at ? "is-selected" : ""} type="button" onClick={() => setStartsAt(slot.starts_at)}>{slot.label}</button>
            ))}
          </div>
        )}
      </fieldset>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="field-label">Nome completo<input className="form-field mt-2" required minLength={2} maxLength={120} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field-label">Telefone<input className="form-field mt-2" required inputMode="tel" minLength={10} maxLength={24} autoComplete="off" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
      </div>
      <label className="field-label mt-4">Observações <span className="font-normal text-muted">(opcional)</span><textarea className="form-field mt-2 min-h-24" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <button className="button-primary mt-6 w-full justify-center sm:w-auto" disabled={submitting || !startsAt} type="submit">{submitting ? "Salvando…" : "Criar agendamento"}</button>
    </form>
  );
}
