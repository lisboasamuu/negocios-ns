"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { mapBookingError } from "@/lib/appointments/availability";
import {
  addDaysToDate,
  formatClinicDate,
  formatClinicTime,
  todayInClinic,
} from "@/lib/appointments/dates";
import type {
  AvailableSlot,
  BookingConfirmation,
  Service,
} from "@/lib/appointments/types";
import { business, whatsappUrl } from "@/lib/business";
import { getSupabaseClient } from "@/lib/supabase/client";

const steps = ["Serviço", "Data", "Horário", "Seus dados", "Revisão"];

type CustomerDetails = {
  name: string;
  phone: string;
  notes: string;
};

const initialDetails: CustomerDetails = { name: "", phone: "", notes: "" };

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function BookingFlow({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [details, setDetails] = useState<CustomerDetails>(initialDetails);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [serviceId, services],
  );

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");
    const client = getSupabaseClient();
    if (!client) {
      setError("O agendamento online ainda está sendo conectado. Enquanto isso, fale conosco pelo WhatsApp.");
      setLoading(false);
      return;
    }

    const { data, error: requestError } = await client.rpc("list_active_services");
    if (requestError) {
      setError("Não foi possível carregar os serviços agora. Tente novamente em instantes.");
    } else {
      setServices((data ?? []) as Service[]);
    }
    setLoading(false);
  }, []);

  const loadSlots = useCallback(async (selectedServiceId: string, selectedDate: string) => {
    setLoading(true);
    setError("");
    setSlot(null);
    const client = getSupabaseClient();
    if (!client) {
      setError("O agendamento online ainda está sendo conectado. Enquanto isso, fale conosco pelo WhatsApp.");
      setSlots([]);
      setLoading(false);
      return;
    }

    const { data, error: requestError } = await client.rpc("get_available_slots", {
      p_service_id: selectedServiceId,
      p_date: selectedDate,
    });
    if (requestError) {
      setError("Não foi possível consultar os horários. Tente outra vez.");
      setSlots([]);
    } else {
      setSlots((data ?? []) as AvailableSlot[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadServices(); });
  }, [loadServices]);

  function chooseService(id: string) {
    setServiceId(id);
    setDate("");
    setSlots([]);
    setSlot(null);
    setError("");
    setStep(1);
  }

  function chooseDate(value: string) {
    setDate(value);
    if (!serviceId || !value) return;
    setStep(2);
    void loadSlots(serviceId, value);
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneDigits = details.phone.replace(/\D/g, "");
    if (details.name.trim().length < 2 || phoneDigits.length < 10) {
      setError("Informe seu nome e um telefone com DDD.");
      return;
    }
    setError("");
    setStep(4);
  }

  async function confirmBooking() {
    if (!slot || !selectedService) return;
    const client = getSupabaseClient();
    if (!client) return;
    setSubmitting(true);
    setError("");

    const { data, error: requestError } = await client.rpc("create_public_appointment", {
      p_service_id: selectedService.id,
      p_starts_at: slot.starts_at,
      p_customer_name: details.name.trim(),
      p_customer_phone: details.phone.trim(),
      p_customer_notes: details.notes.trim() || null,
    });

    if (requestError) {
      setError(mapBookingError(requestError.message));
      setSubmitting(false);
      if (requestError.message.includes("slot_conflict")) {
        setStep(2);
        await loadSlots(selectedService.id, date);
      } else if (requestError.message.includes("service_unavailable_on_weekday")) {
        setStep(1);
        setSlots([]);
        setSlot(null);
      }
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    setConfirmation(result as BookingConfirmation);
    setSubmitting(false);
  }

  if (confirmation) {
    return (
      <section className="booking-card text-center" aria-live="polite">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-aqua text-teal-dark">
          <CheckIcon className="size-7" />
        </span>
        <p className="eyebrow mt-5">Agendamento confirmado</p>
        <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Seu horário está reservado.</h1>
        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-aqua-soft p-5 text-left">
          <p className="font-bold text-ink">{confirmation.service_name}</p>
          <p className="mt-1 text-muted">
            {formatClinicDate(confirmation.starts_at)} às {formatClinicTime(confirmation.starts_at)}
          </p>
          <p className="mt-3 text-sm text-muted">Confirmação #{confirmation.appointment_id.slice(0, 8)}</p>
        </div>
        <p className="mx-auto mt-6 max-w-lg leading-7 text-muted">
          Se precisar falar com a clínica ou alterar seu horário, use o WhatsApp {business.whatsappDisplay}.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a className="button-primary justify-center" href={whatsappUrl} target="_blank" rel="noreferrer">
            Falar no WhatsApp <WhatsAppIcon className="size-5" />
          </a>
          <Link className="button-secondary justify-center" href="/clinica-lisboa/">Voltar ao site</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`booking-card ${compact ? "booking-card-compact" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Agendamento online</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl">Escolha seu melhor momento.</h1>
        </div>
        <span className="shrink-0 text-sm font-semibold text-muted">{Math.min(step + 1, 5)}/5</span>
      </div>

      <ol className="booking-steps mt-6" aria-label="Etapas do agendamento">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "is-current" : index < step ? "is-complete" : ""}>
            <span>{index + 1}</span><small>{label}</small>
          </li>
        ))}
      </ol>

      {error && (
        <div className="form-alert mt-5" role="alert">
          <p>{error}</p>
          {!getSupabaseClient() && (
            <a className="mt-3 inline-flex font-bold underline" href={whatsappUrl} target="_blank" rel="noreferrer">Continuar pelo WhatsApp</a>
          )}
        </div>
      )}

      <div className="mt-7 min-h-[20rem]">
        {step === 0 && (
          <div>
            <h2 className="form-title">Qual cuidado você procura?</h2>
            {loading ? <p className="form-state">Carregando serviços…</p> : services.length === 0 && !error ? <p className="form-state">Nenhum serviço disponível no momento.</p> : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <button key={service.id} type="button" className="choice-card text-left" onClick={() => chooseService(service.id)}>
                    <strong>{service.name}</strong>
                    <span>{service.description || "Atendimento personalizado pela Clínica Lisboa."}</span>
                    <small>{service.duration_minutes} min</small>
                  </button>
                ))}
              </div>
            )}
            {error && <button type="button" className="text-link mt-5" onClick={() => void loadServices()}>Tentar novamente</button>}
          </div>
        )}

        {step === 1 && selectedService && (
          <div>
            <h2 className="form-title">Em qual dia você prefere?</h2>
            <p className="mt-2 text-muted">{selectedService.name} · {selectedService.duration_minutes} min</p>
            <label className="field-label mt-6" htmlFor="booking-date">Data</label>
            <input
              id="booking-date"
              className="form-field mt-2"
              type="date"
              min={todayInClinic()}
              max={addDaysToDate(todayInClinic(), 120)}
              value={date}
              onChange={(event) => chooseDate(event.target.value)}
            />
          </div>
        )}

        {step === 2 && selectedService && (
          <div>
            <h2 className="form-title">Horários disponíveis</h2>
            <p className="mt-2 text-muted">{formatClinicDate(`${date}T12:00:00-03:00`)}</p>
            {loading ? <p className="form-state">Consultando a agenda…</p> : slots.length === 0 ? (
              <div className="form-state">
                <p>Não há horários livres nesse dia.</p>
                <button type="button" className="text-link mt-3" onClick={() => setStep(1)}>Escolher outra data</button>
              </div>
            ) : (
              <div className="slot-grid mt-5">
                {slots.map((availableSlot) => (
                  <button
                    key={availableSlot.starts_at}
                    type="button"
                    className={slot?.starts_at === availableSlot.starts_at ? "is-selected" : ""}
                    onClick={() => { setSlot(availableSlot); setStep(3); }}
                  >
                    {availableSlot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && slot && (
          <form onSubmit={submitDetails}>
            <h2 className="form-title">Como podemos identificar você?</h2>
            <div className="mt-5 grid gap-4">
              <label className="field-label">Nome completo
                <input className="form-field mt-2" required minLength={2} autoComplete="name" value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} />
              </label>
              <label className="field-label">WhatsApp ou telefone
                <input className="form-field mt-2" required inputMode="tel" autoComplete="tel" placeholder="(19) 99999-9999" value={details.phone} onChange={(event) => setDetails({ ...details, phone: formatPhone(event.target.value) })} />
              </label>
              <label className="field-label">Observações <span className="font-normal text-muted">(opcional)</span>
                <textarea className="form-field mt-2 min-h-28 resize-y" maxLength={500} value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} />
              </label>
            </div>
            <button className="button-primary mt-6 w-full justify-center sm:w-auto" type="submit">Revisar agendamento</button>
          </form>
        )}

        {step === 4 && selectedService && slot && (
          <div>
            <h2 className="form-title">Confira antes de confirmar</h2>
            <dl className="review-list mt-5">
              <div><dt>Serviço</dt><dd>{selectedService.name}</dd></div>
              <div><dt>Quando</dt><dd>{formatClinicDate(slot.starts_at)} às {formatClinicTime(slot.starts_at)}</dd></div>
              <div><dt>Nome</dt><dd>{details.name}</dd></div>
              <div><dt>Telefone</dt><dd>{details.phone}</dd></div>
              {details.notes && <div><dt>Observações</dt><dd>{details.notes}</dd></div>}
            </dl>
            <button className="button-primary mt-6 w-full justify-center sm:w-auto" type="button" disabled={submitting} onClick={() => void confirmBooking()}>
              {submitting ? "Confirmando…" : "Confirmar agendamento"}
            </button>
            <p className="mt-3 text-xs leading-5 text-muted">Ao confirmar, seus dados serão usados apenas para organizar este atendimento.</p>
          </div>
        )}
      </div>

      {step > 0 && step < 5 && (
        <div className="mt-6 border-t border-ink/10 pt-5">
          <button type="button" className="text-link" onClick={() => { setError(""); setStep((current) => Math.max(0, current - 1)); }}>Voltar uma etapa</button>
        </div>
      )}
    </section>
  );
}
