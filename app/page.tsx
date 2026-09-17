import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clínica Lisboa",
  robots: {
    index: false,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center">
      <meta httpEquiv="refresh" content="0;url=/clinica-lisboa/" />
      <div>
        <p className="eyebrow">Clínica Lisboa</p>
        <h1 className="mt-4 font-serif text-4xl text-ink">Sua beleza, com naturalidade.</h1>
        <p className="mt-5 text-muted">Você será direcionado para o site da Clínica Lisboa.</p>
        <a className="button-primary mt-7" href="/clinica-lisboa/">Acessar o site</a>
      </div>
    </main>
  );
}
