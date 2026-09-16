import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";
import { WhatsAppIcon } from "@/components/icons";
import { business, whatsappUrl } from "@/lib/business";

export const metadata: Metadata = {
  title: "Agendar | Clínica NS",
  description: "Escolha o serviço, a data e o horário da sua avaliação na Clínica NS.",
};

export default function BookingPage() {
  return (
    <main className="min-h-svh bg-aqua-soft px-3 py-3 sm:px-6 sm:py-6 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between gap-4 sm:mb-6">
          <Link className="brand-mark rounded-md focus-ring" href="/negocio-ns/">
            <Image className="brand-symbol" src="/favicon.svg" alt="" width={40} height={40} priority />
            <span className="brand-name">Clínica <strong>NS</strong></span>
          </Link>
          <a className="inline-flex items-center gap-2 text-sm font-bold text-teal-dark" href={whatsappUrl} target="_blank" rel="noreferrer">
            <WhatsAppIcon className="size-5" />
            <span className="hidden sm:inline">Prefere WhatsApp?</span>
          </a>
        </header>
        <BookingFlow />
        <p className="mt-4 text-center text-xs leading-5 text-muted">
          Horários exibidos em Brasília · {business.whatsappDisplay}
        </p>
      </div>
    </main>
  );
}
