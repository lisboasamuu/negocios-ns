# Clínica NS — MVP 1

Landing page pública da **Clínica NS**, criada para apresentar o posicionamento, os tratamentos e os diferenciais da clínica, conduzindo o visitante ao agendamento pelo WhatsApp.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

O projeto é totalmente estático neste MVP: não há backend, banco de dados, autenticação, agenda interna ou pagamentos.

## Como instalar

```bash
npm install
```

## Como executar

```bash
npm run dev
```

Acesse `http://localhost:3000/negocio-ns`.

## Validações

```bash
npm run lint
npm run typecheck
npm run build
```

O build estático é gerado em `out/`.

## Estrutura básica

```text
app/
  page.tsx                   Redirecionamento para a rota pública
  layout.tsx                Metadata e layout raiz
  globals.css               Identidade visual e estilos globais
  negocio-ns/page.tsx       Landing page pública
components/
  icons.tsx                 Ícones leves e locais
  section-heading.tsx       Cabeçalho reutilizável de seção
  site-header.tsx           Header e menu mobile
lib/
  business.ts               Configuração central da clínica e WhatsApp
  content.ts                Conteúdo dos tratamentos e diferenciais
public/
  images/                   Imagens editoriais do site
```

## Rota atual

- `/negocio-ns` — landing page pública do MVP 1.

`/negocio-ns/agenda` está reservada para a futura aplicação administrativa e não foi implementada.

## Onde alterar as informações da clínica

Edite `lib/business.ts` para atualizar:

- número e texto do WhatsApp;
- endereço;
- Instagram;
- horário de atendimento;
- nome e posicionamento da marca.

Os dados iniciais de contato são demonstrativos e devem ser substituídos antes da publicação comercial.

## Roadmap

- **MVP 1 (atual):** landing page e conversão pelo WhatsApp.
- **MVP 2:** aplicação própria de agendamentos, sem pagamentos.
- **MVP 3:** agenda completa com processamento de pagamentos.

## Decisão arquitetural

O site público permanece isolado em `/negocio-ns`. A futura aplicação administrativa viverá em `/negocio-ns/agenda` e deverá possuir arquitetura, autenticação e regras próprias quando esse MVP for iniciado. Nenhuma funcionalidade futura foi antecipada nesta base.
