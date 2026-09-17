import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clínica Lisboa | Estética e Bem-estar",
  description:
    "Tratamentos estéticos personalizados para valorizar sua beleza com naturalidade, cuidado e tecnologia.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
