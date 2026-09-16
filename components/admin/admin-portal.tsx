"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AgendaPanel } from "@/components/admin/agenda-panel";
import { BlocksPanel } from "@/components/admin/blocks-panel";
import { HoursPanel } from "@/components/admin/hours-panel";
import { ManualBookingPanel } from "@/components/admin/manual-booking-panel";
import { ServicesPanel } from "@/components/admin/services-panel";
import { getSupabaseClient } from "@/lib/supabase/client";

type Tab = "agenda" | "manual" | "services" | "hours" | "blocks";

const tabs: { id: Tab; label: string }[] = [
  { id: "agenda", label: "Agenda" },
  { id: "manual", label: "Novo horário" },
  { id: "services", label: "Serviços" },
  { id: "hours", label: "Horários" },
  { id: "blocks", label: "Bloqueios" },
];

export function AdminPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("agenda");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      queueMicrotask(() => {
        setError("O painel ainda não foi conectado ao Supabase. Configure as variáveis descritas no README.");
        setChecking(false);
      });
      return;
    }

    void client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function verifyAccess() {
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      const client = getSupabaseClient();
      if (!client) return;
      const { data, error: requestError } = await client.rpc("is_current_user_admin");
      setAuthorized(Boolean(data) && !requestError);
      if (!data || requestError) setError("Este usuário não tem acesso administrativo.");
      setChecking(false);
    }
    void verifyAccess();
  }, [session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setSubmitting(true);
    setError("");
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) setError("E-mail ou senha inválidos.");
    setSubmitting(false);
  }

  async function signOut() {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setAuthorized(false);
    setSession(null);
  }

  if (checking) {
    return <main className="grid min-h-svh place-items-center bg-aqua-soft p-4"><p className="form-state">Verificando acesso…</p></main>;
  }

  if (!session || !authorized) {
    return (
      <main className="grid min-h-svh place-items-center bg-aqua-soft p-4">
        <section className="booking-card w-full max-w-md">
          <Link className="brand-mark rounded-md focus-ring" href="/negocio-ns/">
            <Image className="brand-symbol" src="/favicon.svg" alt="" width={40} height={40} priority />
            <span className="brand-name">Clínica <strong>NS</strong></span>
          </Link>
          <p className="eyebrow mt-8">Área restrita</p>
          <h1 className="mt-2 font-serif text-3xl text-ink">Acessar agenda</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Entre com o usuário administrativo cadastrado. Não há cadastro público.</p>
          {error && <div className="form-alert mt-5" role="alert">{error}</div>}
          {!getSupabaseClient() ? (
            <Link className="button-secondary mt-6 justify-center" href="/negocio-ns/">Voltar ao site</Link>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={signIn}>
              <label className="field-label">E-mail
                <input className="form-field mt-2" required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="field-label">Senha
                <input className="form-field mt-2" required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <button className="button-primary mt-2 justify-center" disabled={submitting} type="submit">{submitting ? "Entrando…" : "Entrar"}</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-canvas">
      <header className="border-b border-ink/10 bg-white">
        <div className="container-shell flex min-h-16 items-center gap-3 py-3">
          <Link className="brand-mark mr-auto rounded-md focus-ring" href="/negocio-ns/">
            <Image className="brand-symbol" src="/favicon.svg" alt="" width={40} height={40} priority />
            <span className="brand-name">Clínica <strong>NS</strong></span>
          </Link>
          <span className="hidden text-xs text-muted sm:block">{session.user.email}</span>
          <button className="admin-quiet-button" type="button" onClick={() => void signOut()}>Sair</button>
        </div>
      </header>

      <div className="container-shell py-6 sm:py-9">
        <div className="mb-6">
          <p className="eyebrow">Painel da clínica</p>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Gestão de atendimentos</h1>
        </div>
        <nav className="admin-tabs" aria-label="Seções administrativas">
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id ? "is-active" : ""} type="button" onClick={() => setTab(item.id)}>{item.label}</button>
          ))}
        </nav>
        <div className="mt-5">
          {tab === "agenda" && <AgendaPanel />}
          {tab === "manual" && <ManualBookingPanel />}
          {tab === "services" && <ServicesPanel />}
          {tab === "hours" && <HoursPanel />}
          {tab === "blocks" && <BlocksPanel />}
        </div>
      </div>
    </main>
  );
}
