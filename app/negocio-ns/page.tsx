import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { LegacyPathRedirect } from "@/components/legacy-path-redirect";
import { SectionHeading } from "@/components/section-heading";
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  CheckIcon,
  TreatmentIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { business, navigation, whatsappSupportActions, whatsappUrl } from "@/lib/business";
import { differentiators, journey, treatments } from "@/lib/content";

export const metadata: Metadata = {
  title: "Clínica NS | Estética e Bem-estar",
  description:
    "Tratamentos estéticos personalizados para valorizar sua beleza com naturalidade, cuidado e tecnologia.",
};

const whatsappLinkProps = {
  href: whatsappUrl,
  target: "_blank",
  rel: "noreferrer",
};

export default function ClinicaNSPage() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <LegacyPathRedirect />
      <SiteHeader />

      <main id="conteudo">
        <section id="inicio" className="hero-section section-reveal scroll-mt-24" aria-labelledby="hero-title">
          <div className="container-shell grid items-center gap-10 py-9 sm:py-12 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:py-20">
            <div className="relative z-10 max-w-2xl">
              <p className="eyebrow">Estética <span aria-hidden="true">•</span> Saúde <span aria-hidden="true">•</span> Bem-estar</p>
              <h1 id="hero-title" className="hero-title mt-5">
                Sua beleza,<br />
                <em>com naturalidade.</em>
              </h1>
              <p className="body-copy mt-6 max-w-xl text-lg sm:text-xl">
                Tratamentos estéticos personalizados para valorizar sua beleza com cuidado, tecnologia e resultados naturais.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <a className="button-primary justify-center" href="/clinica-ns/agendar/">
                  Agendar online
                  <ArrowUpRightIcon className="size-5" />
                </a>
                <a className="button-secondary justify-center" href="#tratamentos">
                  Conhecer tratamentos
                  <ArrowDownIcon className="size-4" />
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-[0.8125rem] font-medium text-ink/72 sm:mt-8 sm:text-sm" aria-label="Compromissos da clínica">
                <span className="inline-flex items-center gap-2"><CheckIcon className="size-4 text-teal-dark" />Atendimento personalizado</span>
                <span className="inline-flex items-center gap-2"><CheckIcon className="size-4 text-teal-dark" />Protocolos individualizados</span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
              <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.65rem] bg-aqua shadow-soft sm:rounded-[2.75rem]">
                <Image
                  src="/images/hero-consultation.webp"
                  alt="Profissional avaliando com delicadeza a pele de uma paciente em ambiente claro"
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/10 via-transparent to-transparent" aria-hidden="true" />
              </div>
              <div className="absolute -bottom-5 -left-3 max-w-[14rem] rounded-3xl border border-white/80 bg-white/92 p-4 shadow-soft backdrop-blur sm:-left-8 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-dark">Seu cuidado, seu ritmo</p>
                <p className="mt-2 font-serif text-xl leading-tight text-ink">Beleza que continua sendo você.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="tratamentos" className="section-pad section-reveal scroll-mt-20 bg-white" aria-labelledby="treatments-title">
          <div className="container-shell">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <SectionHeading
                  id="treatments-title"
                  eyebrow="Nossos cuidados"
                  title="Cuidados pensados para você"
                  description="Cada escolha começa com escuta. Conheça algumas possibilidades que podem compor um protocolo exclusivamente seu."
                />
              </div>
              <a className="text-link shrink-0" {...whatsappLinkProps}>
                Conversar sobre um tratamento
                <ArrowUpRightIcon className="size-4" />
              </a>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {treatments.map((treatment, index) => (
                <article key={treatment.title} className="treatment-card group">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-aqua text-teal-dark transition-colors group-hover:bg-teal group-hover:text-white">
                      <TreatmentIcon name={treatment.icon} className="size-6" />
                    </span>
                    <span className="font-serif text-sm italic text-muted">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-[1.4rem] text-ink sm:mt-8 sm:text-2xl">{treatment.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{treatment.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="section-pad section-reveal scroll-mt-20 overflow-hidden bg-aqua-soft" aria-labelledby="about-title">
          <div className="container-shell grid items-center gap-12 lg:grid-cols-[.94fr_1.06fr] lg:gap-20">
            <div className="relative lg:order-first">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.65rem] shadow-soft sm:rounded-[2.75rem]">
                <Image
                  src="/images/about-consultation.webp"
                  alt="Profissional e cliente conversando em um ambiente de atendimento acolhedor"
                  fill
                  sizes="(max-width: 1024px) 92vw, 43vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 right-4 rounded-3xl bg-ink p-5 text-white shadow-soft sm:right-8 sm:max-w-[15rem]">
                <p className="font-serif text-2xl leading-tight">Escuta antes de qualquer escolha.</p>
              </div>
            </div>

            <div className="max-w-xl pt-5 lg:pt-0">
              <SectionHeading id="about-title" eyebrow="A experiência NS" title="Estética que respeita quem você é." />
              <p className="body-copy mt-6">
                Na Clínica NS, cada atendimento começa entendendo você. Nosso objetivo é criar protocolos personalizados que valorizem seus traços e promovam bem-estar sem abrir mão da naturalidade.
              </p>
              <div className="mt-8 border-l-2 border-teal pl-5">
                <p className="font-serif text-xl italic leading-relaxed text-ink">“Cuidar não é transformar. É revelar, com delicadeza, o que faz você se sentir bem.”</p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[.14em] text-teal-dark">Conceito Clínica NS</p>
              </div>
              <a className="button-secondary mt-8" {...whatsappLinkProps}>
                Falar com a equipe
                <WhatsAppIcon className="size-5" />
              </a>
            </div>
          </div>
        </section>

        <section id="diferenciais" className="section-pad section-reveal scroll-mt-20 bg-ink text-white" aria-labelledby="differentials-title">
          <div className="container-shell grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="eyebrow !text-teal-light">Nosso jeito de cuidar</p>
              <h2 id="differentials-title" className="section-title mt-4 !text-white">Por que escolher a Clínica NS?</h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-white/62">
                Uma experiência construída para unir intenção, segurança e a leveza de resultados que preservam sua essência.
              </p>
            </div>

            <div className="divide-y divide-white/12 border-y border-white/12">
              {differentiators.map((item) => (
                <article key={item.number} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr] sm:py-8">
                  <span className="font-serif text-xl italic text-teal-light">{item.number}</span>
                  <div>
                    <h3 className="font-serif text-2xl">{item.title}</h3>
                    <p className="mt-3 max-w-xl leading-7 text-white/62">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad section-reveal bg-canvas" aria-labelledby="journey-title">
          <div className="container-shell">
            <div>
              <SectionHeading
                id="journey-title"
                eyebrow="Como funciona"
                title="Do primeiro olá à sua avaliação"
                description="Uma jornada simples, humana e organizada — escolha o melhor horário online ou fale diretamente com nossa equipe."
                align="center"
              />
            </div>

            <ol className="relative mt-14 grid gap-5 lg:grid-cols-3">
              {journey.map((step) => (
                <li key={step.number} className="journey-card">
                  <span className="grid size-11 place-items-center rounded-full bg-teal font-serif text-xl text-white">{step.number}</span>
                  <h3 className="mt-6 font-serif text-2xl text-ink">{step.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{step.description}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 text-center">
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <a className="button-primary justify-center" href="/clinica-ns/agendar/">Agendar online <ArrowUpRightIcon className="size-5" /></a>
                <a className="button-secondary justify-center" {...whatsappLinkProps}>Prefiro WhatsApp <WhatsAppIcon className="size-5" /></a>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad section-reveal bg-white" aria-labelledby="stories-title">
          <div className="container-shell">
            <div className="future-stories">
              <div>
                <p className="eyebrow">Experiências reais</p>
                <h2 id="stories-title" className="section-title mt-4">Histórias que serão contadas por quem viveu.</h2>
              </div>
              <div className="max-w-lg">
                <p className="body-copy">
                  Este espaço está preparado para receber depoimentos reais no futuro, publicados somente com autorização. Neste lançamento, preferimos não inventar avaliações.
                </p>
                <div className="mt-6 flex flex-wrap gap-2" aria-label="Valores que guiam a experiência">
                  {['Escuta', 'Naturalidade', 'Acolhimento'].map((value) => (
                    <span key={value} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink">{value}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad section-reveal bg-aqua-soft" aria-labelledby="help-title">
          <div className="container-shell">
            <SectionHeading
              id="help-title"
              eyebrow="Precisa de ajuda?"
              title="A equipe continua com você pelo WhatsApp."
              description="Para alterações ou dúvidas, escolha uma opção e envie a mensagem pronta. Nenhuma mudança acontece sem a confirmação da equipe."
              align="center"
            />
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
              {whatsappSupportActions.map((action) => (
                <a className="support-card group" href={action.href} key={action.title} target="_blank" rel="noreferrer">
                  <span className="support-card-icon"><WhatsAppIcon className="size-5" /></span>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <span className="text-link mt-auto pt-5">Abrir conversa <ArrowUpRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section-reveal px-4 pb-4 sm:px-6 sm:pb-6" aria-labelledby="final-cta-title">
          <div className="container-shell relative overflow-hidden rounded-[2rem] bg-teal px-6 py-14 text-center text-white sm:rounded-[3rem] sm:px-10 sm:py-20">
            <div className="cta-ring cta-ring-one" aria-hidden="true" />
            <div className="cta-ring cta-ring-two" aria-hidden="true" />
            <div className="relative z-10 mx-auto max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-white/76">Seu próximo passo</p>
              <h2 id="final-cta-title" className="mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">Seu momento de cuidado começa aqui.</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/82">Escolha serviço, data e horário em poucos passos.</p>
              <a className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-teal-dark shadow-lg transition-transform hover:-translate-y-0.5 focus-ring" href="/clinica-ns/agendar/">
                Agendar online
                <ArrowUpRightIcon className="size-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer id="contato" className="scroll-mt-20 bg-canvas pb-8 pt-16">
        <div className="container-shell">
          <div className="grid gap-10 border-b border-ink/10 pb-12 lg:grid-cols-[1.1fr_.7fr_1fr]">
            <div>
              <a href="#inicio" className="brand-mark inline-flex rounded-md focus-ring" aria-label={`${business.name} — ir ao início`}>
                <Image className="brand-symbol" src="/favicon.svg" alt="" width={40} height={40} />
                <span className="brand-name">Clínica <strong>NS</strong></span>
              </a>
              <p className="mt-5 max-w-sm leading-7 text-muted">Tratamentos estéticos personalizados para valorizar sua beleza com naturalidade, cuidado e tecnologia.</p>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[.16em] text-ink">Navegação</h2>
              <nav className="mt-5 flex flex-col gap-3" aria-label="Navegação do rodapé">
                {navigation.slice(0, 4).map((item) => <a key={item.href} href={item.href} className="footer-link focus-ring">{item.label}</a>)}
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[.16em] text-ink">Contato</h2>
              <address className="mt-5 space-y-4 not-italic text-muted">
                <p><strong className="block text-sm text-ink">WhatsApp</strong>{business.whatsappDisplay}</p>
                <p><strong className="block text-sm text-ink">Endereço</strong>{business.address}</p>
                <p><strong className="block text-sm text-ink">Horário</strong>{business.openingHours}</p>
                <p><strong className="block text-sm text-ink">Instagram</strong><a className="footer-link focus-ring" href={business.instagramUrl} target="_blank" rel="noreferrer">{business.instagram}</a></p>
              </address>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 pt-6 text-sm text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} {business.name}. Todos os direitos reservados.</p>
            <p>{business.tagline}</p>
          </div>
        </div>
      </footer>

      <a
        className="floating-whatsapp focus-ring"
        {...whatsappLinkProps}
        aria-label="Agendar avaliação pelo WhatsApp"
      >
        <WhatsAppIcon className="size-6" />
        <span className="hidden sm:inline">Agendar</span>
      </a>
    </>
  );
}
