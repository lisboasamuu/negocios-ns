"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { business, navigation } from "@/lib/business";
import { ArrowUpRightIcon, CloseIcon, MenuIcon } from "@/components/icons";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-canvas/90 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center gap-2 sm:h-[4.5rem] sm:gap-4">
        <a href="#inicio" className="brand-mark mr-auto min-w-0 rounded-md focus-ring" aria-label={`${business.name} — ir ao início`}>
          <Image className="brand-symbol" src="/favicon.svg" alt="" width={40} height={40} priority />
          <span className="brand-name">Clínica <strong>NS</strong></span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} className="nav-link focus-ring" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta button-primary" href="/negocio-ns/agendar/" aria-label="Agendar avaliação online">
          <span className="sm:hidden">Agendar</span>
          <span className="hidden sm:inline">Agendar avaliação</span>
          <ArrowUpRightIcon className="hidden size-3.5 sm:block" />
        </a>

        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/12 bg-white text-ink transition-colors hover:border-teal hover:text-teal-dark focus-ring sm:size-11 lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <CloseIcon className="size-[1.125rem]" /> : <MenuIcon className="size-[1.125rem]" />}
        </button>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" className="border-t border-ink/8 bg-canvas px-4 pb-5 pt-2 lg:hidden" aria-label="Navegação mobile">
          <div className="mx-auto flex max-w-xl flex-col">
            {navigation.map((item) => (
              <a
                key={item.href}
                className="border-b border-ink/8 px-2 py-3.5 text-[0.95rem] font-medium text-ink focus-ring"
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a className="button-primary mt-4 justify-center" href="/negocio-ns/agendar/" onClick={() => setIsOpen(false)}>
              Agendar online
              <ArrowUpRightIcon className="size-4" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
