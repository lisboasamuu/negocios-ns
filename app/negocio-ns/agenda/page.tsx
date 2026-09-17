import type { Metadata } from "next";
import { AdminPortal } from "@/components/admin/admin-portal";
import { LegacyPathRedirect } from "@/components/legacy-path-redirect";

export const metadata: Metadata = {
  title: "Agenda administrativa | Clínica Lisboa",
  robots: { index: false, follow: false },
};

export default function AdminAgendaPage() {
  return <><LegacyPathRedirect /><AdminPortal /></>;
}
