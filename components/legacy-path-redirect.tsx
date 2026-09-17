"use client";

import { useEffect } from "react";

export function LegacyPathRedirect() {
  useEffect(() => {
    const legacyPrefix = ["/negocio-ns", "/clinica-ns"].find((prefix) =>
      window.location.pathname.startsWith(prefix),
    );
    if (!legacyPrefix) return;
    const pathname = window.location.pathname.replace(legacyPrefix, "/clinica-lisboa");
    window.location.replace(`${pathname}${window.location.search}${window.location.hash}`);
  }, []);

  return null;
}
