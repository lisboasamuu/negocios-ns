import type { Metadata } from "next";
import { AdminPortal } from "@/components/admin/admin-portal";

export const metadata: Metadata = {
  title: "Agenda administrativa | Clínica NS",
  robots: { index: false, follow: false },
};

export default function AdminAgendaPage() {
  return <AdminPortal />;
}
