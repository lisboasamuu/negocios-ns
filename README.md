# Clínica NS — MVP 2

Criado por Samuel Lisboa; Site mobile-first para uma clínica de estética fictícia, com landing page, agendamento online sem conta e painel administrativo protegido. O WhatsApp continua disponível como canal alternativo. Mais pra frente irei implementar formas de pagamento e gateways.

## O que está incluído

- Landing page responsiva em `/negocio-ns`.
- Agendamento público em `/negocio-ns/agendar`: serviço, data, horário real, dados, revisão e confirmação.
- Painel em `/negocio-ns/agenda`: agenda diária, detalhes, cancelamento lógico, cadastro manual, serviços, horários e bloqueios.
- Autenticação administrativa pelo Supabase Auth, sem cadastro público.
- PostgreSQL como fonte de verdade para disponibilidade e autorização.
- Proteção contra horários duplicados por constraint GiST, validação transacional e RLS.
- Datas gravadas em UTC e regras exibidas em `America/Sao_Paulo`.
- Estados de carregamento, erro, vazio, sucesso e conflito de concorrência.
- Testes unitários, testes de contrato da migração e suíte pgTAP para o banco.

Pagamentos não fazem parte deste MVP ainda

## Stack

- Next.js 16, React 19 e TypeScript.
- Tailwind CSS 4.
- Supabase PostgreSQL, Auth, RPC e Row Level Security.
- Vitest e pgTAP.

## Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/negocio-ns` | Público | Site institucional e conversão |
| `/negocio-ns/agendar` | Público | Agendamento sem conta |
| `/negocio-ns/agenda` | Administrador | Gestão da clínica |

## Configuração local

Requisitos: Node.js 20+ e um projeto Supabase.

```bash
npm install
cp .env.example .env.local
```

Preencha em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

A publishable/anon key pode ficar no navegador. A segurança depende das funções e políticas RLS incluídas na migração. Nunca adicione uma `service_role` ao frontend.

### Banco de dados

Com a CLI do Supabase autenticada e o projeto vinculado:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Para um ambiente local do Supabase, a migração e o seed podem ser recriados com:

```bash
npx supabase start
npx supabase db reset
```

O seed cadastra apenas serviços e horários demonstrativos; nenhum cliente ou atendimento fictício é criado.

### Primeiro administrador

1. No dashboard do Supabase, abra **Authentication → Users** e crie o usuário do proprietário.
2. No SQL Editor, autorize o UUID exato desse usuário:

```sql
insert into public.admin_users (user_id)
values ('UUID_DO_USUARIO');
```

Também é possível autorizar pelo e-mail já criado:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'dono@clinica.com';
```

Não habilite cadastro público. Um usuário autenticado que não estiver em `admin_users` continuará sem acesso aos dados administrativos.

## Executar

```bash
npm run dev
```

Acesse `http://localhost:3000/negocio-ns/`.

## Validação

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Com o Supabase local em execução, rode também os testes do banco:

```bash
npx supabase test db
```

O build estático é gerado em `out/`. As variáveis `NEXT_PUBLIC_*` são incorporadas durante o build e devem existir no ambiente de implantação.

## Regras importantes

- A interface apenas apresenta horários retornados por `get_available_slots`.
- `create_public_appointment` e `create_admin_appointment` recalculam duração, expediente, grade, bloqueios e conflitos dentro do banco.
- Agendamentos confirmados não podem se sobrepor, mesmo com duas confirmações simultâneas.
- A criação de bloqueios e de atendimentos é serializada para evitar uma corrida entre tabelas.
- Cancelar altera o status para `cancelled`; o histórico não é apagado.
- Serviços inativos deixam de aparecer para o cliente, mas permanecem ligados ao histórico.
- Dados de clientes não têm permissão de leitura anônima.

## Estrutura principal

```text
app/negocio-ns/
  page.tsx                 Landing page
  agendar/page.tsx         Fluxo público
  agenda/page.tsx          Painel administrativo
components/
  booking/booking-flow.tsx
  admin/                   Agenda e configurações
lib/
  appointments/            Datas, tipos, regras e testes
  supabase/client.ts       Cliente público configurável
supabase/
  migrations/              Schema, RPCs, RLS e concorrência
  tests/                   Testes pgTAP
  seed.sql                 Dados demonstrativos
```

## Personalização

- Clínica e WhatsApp: `lib/business.ts`.
- Conteúdo institucional: `lib/content.ts`.
- Serviços e expediente iniciais: `supabase/seed.sql`.
- Intervalo padrão da grade: registro único em `public.booking_settings`.
- Paleta e componentes visuais: `app/globals.css`.

Antes de uso comercial, substitua endereço e Instagram demonstrativos, revise serviços, durações, expediente e a política de privacidade aplicável ao negócio.
