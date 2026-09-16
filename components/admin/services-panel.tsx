"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Service } from "@/lib/appointments/types";
import { getSupabaseClient } from "@/lib/supabase/client";

const blank = { name: "", description: "", duration_minutes: 60 };

export function ServicesPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    const { data, error: requestError } = await client.from("services").select("*").order("name");
    if (requestError) setError("Não foi possível carregar os serviços.");
    setServices((data ?? []) as Service[]);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      duration_minutes: Number(form.duration_minutes),
    };
    const request = editingId
      ? client.from("services").update(payload).eq("id", editingId)
      : client.from("services").insert(payload);
    const { error: requestError } = await request;
    if (requestError) setError("Não foi possível salvar o serviço. Confira os campos.");
    else { setForm(blank); setEditingId(null); await load(); }
  }

  async function toggle(service: Service) {
    const client = getSupabaseClient();
    if (!client) return;
    const { error: requestError } = await client.from("services").update({ active: !service.active }).eq("id", service.id);
    if (requestError) setError("Não foi possível alterar o serviço."); else await load();
  }

  async function remove(service: Service) {
    if (!window.confirm(`Excluir o serviço “${service.name}”? Se ele já possuir atendimentos, desative-o em vez de excluir.`)) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error: requestError } = await client.from("services").delete().eq("id", service.id);
    if (requestError) setError("Este serviço não pode ser excluído porque já está ligado a atendimentos. Você pode desativá-lo.");
    else await load();
  }

  return (
    <section className="admin-grid">
      <div className="admin-card">
        <h2 className="admin-title">Serviços</h2><p className="admin-copy">Serviços ativos aparecem no agendamento público.</p>
        {loading ? <p className="form-state">Carregando…</p> : <div className="mt-5 grid gap-3">{services.map((service) => (
          <article className="manage-row" key={service.id}>
            <div><strong>{service.name}</strong><span>{service.duration_minutes} min · {service.active ? "Ativo" : "Inativo"}</span></div>
            <div className="flex gap-2">
              <button className="admin-quiet-button" type="button" onClick={() => { setEditingId(service.id); setForm({ name: service.name, description: service.description, duration_minutes: service.duration_minutes }); }}>Editar</button>
              <button className="admin-quiet-button" type="button" onClick={() => void toggle(service)}>{service.active ? "Desativar" : "Ativar"}</button>
              <button className="danger-link" type="button" onClick={() => void remove(service)}>Excluir</button>
            </div>
          </article>
        ))}</div>}
      </div>
      <form className="admin-card self-start" onSubmit={save}>
        <h2 className="admin-title">{editingId ? "Editar serviço" : "Novo serviço"}</h2>
        {error && <div className="form-alert mt-4" role="alert">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="field-label">Nome<input className="form-field mt-2" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="field-label">Descrição<textarea className="form-field mt-2 min-h-24" maxLength={300} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="field-label">Duração (minutos)<input className="form-field mt-2" required type="number" min={15} max={480} step={5} value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) })} /></label>
        </div>
        <div className="mt-5 flex gap-3">
          <button className="button-primary" type="submit">Salvar</button>
          {editingId && <button className="button-secondary" type="button" onClick={() => { setEditingId(null); setForm(blank); }}>Cancelar</button>}
        </div>
      </form>
    </section>
  );
}
