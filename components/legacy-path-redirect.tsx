"use client";

import { useEffect } from "react";

export function LegacyPathRedirect() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/negocio-ns")) return;
    const pathname = window.location.pathname.replace(/^\/negocio-ns/, "/clinica-ns");
    window.location.replace(`${pathname}${window.location.search}${window.location.hash}`);
  }, []);

  return null;
}
