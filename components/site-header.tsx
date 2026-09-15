"use client";

import { useEffect, useState } from "react";
import { business, navigation, whatsappUrl } from "@/lib/business";
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
      <div className="container-shell flex h-[4.75rem] items-center justify-between gap-6">
        <a href="#inicio" className="brand-mark rounded-md focus-ring" aria-label={`${business.name} — ir ao início`}>
          <span className="brand-symbol" aria-hidden="true">N</span>
          <span>{business.name}</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} className="nav-link focus-ring" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="button-primary hidden lg:inline-flex" href={whatsappUrl} target="_blank" rel="noreferrer">
          Agendar avaliação
          <ArrowUpRightIcon className="size-4" />
        </a>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-ink/12 bg-white text-ink transition-colors hover:border-teal hover:text-teal-dark focus-ring lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" className="border-t border-ink/8 bg-canvas px-5 pb-6 pt-3 lg:hidden" aria-label="Navegação mobile">
          <div className="mx-auto flex max-w-xl flex-col">
            {navigation.map((item) => (
              <a
                key={item.href}
                className="border-b border-ink/8 px-2 py-4 text-base font-medium text-ink focus-ring"
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a className="button-primary mt-5 justify-center" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)}>
              Agendar avaliação
              <ArrowUpRightIcon className="size-4" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
