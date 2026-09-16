# Clínica NS — MVP 2.1

Site mobile-first para uma clínica de estética fictícia, com landing page, agendamento online sem conta e painel administrativo protegido. O WhatsApp continua disponível como canal alternativo.

## O que está incluído

- Landing page responsiva em `/clinica-ns`, com atalhos de ajuda pelo WhatsApp.
- Agendamento público em `/clinica-ns/agendar`: serviço, data, horário real, dados, revisão e confirmação.
- Painel em `/clinica-ns/agenda`: agenda diária, detalhes, cancelamento lógico, cadastro manual, serviços, horários, disponibilidade semanal e bloqueios.
- Regras por dia da semana no modo “todos os serviços” ou “serviços específicos”.
- Autenticação administrativa pelo Supabase Auth, sem cadastro público.
- PostgreSQL como fonte de verdade para disponibilidade e autorização.
- Proteção contra horários duplicados por constraint GiST, validação transacional e RLS.
- Datas gravadas em UTC e regras exibidas em `America/Sao_Paulo`.
- Estados de carregamento, erro, vazio, sucesso e conflito de concorrência.
- Testes unitários, testes de contrato da migração e suíte pgTAP para o banco.

Pagamentos não fazem parte deste MVP.

## Stack

- Next.js 16, React 19 e TypeScript.
- Tailwind CSS 4.
- Supabase PostgreSQL, Auth, RPC e Row Level Security.
- Vitest e pgTAP.

## Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/clinica-ns` | Público | Site institucional e conversão |
| `/clinica-ns/agendar` | Público | Agendamento sem conta |
| `/clinica-ns/agenda` | Administrador | Gestão da clínica |

As rotas antigas em `/negocio-ns`, incluindo `/agendar` e `/agenda`, redirecionam permanentemente para o namespace canônico. Na Vercel isso é feito por `vercel.json`; o fallback do frontend preserva query string e hash em hospedagens estáticas.

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

O `db push` aplica as migrações em ordem. A migração `20260916070000_mvp21_weekday_services.sql` cria as regras semanais com todos os sete dias no modo `all`, portanto não altera a disponibilidade anterior nem cancela agendamentos futuros.

### Impacto e rollback

A migração é aditiva: cria duas tabelas de configuração, atualiza as RPCs de disponibilidade/confirmação e corrige a validação de telefones formatados. Ela não apaga nem modifica agendamentos existentes. Em produção, prefira uma nova migração corretiva em vez de editar ou desfazer uma migração já aplicada. Se um rollback controlado for realmente necessário, publique primeiro a versão anterior do frontend, restaure as definições anteriores das RPCs em uma nova migração e só então remova `weekday_service_selections`, `weekday_service_rules` e `save_weekday_service_rule`, após backup.

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

Acesse `http://localhost:3000/clinica-ns/`.

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
- O modo “Todos os serviços” inclui automaticamente qualquer serviço ativo criado no futuro.
- O modo “Serviços específicos” só libera os serviços marcados naquele dia; sem marcações, o dia não oferece novos horários.
- A regra semanal é aplicada tanto ao cálculo de horários quanto novamente no banco durante a confirmação pública ou manual.
- Alterar a regra nunca cancela agendamentos já confirmados; o painel avisa quando há compromissos futuros fora da nova configuração.
- Dados de clientes não têm permissão de leitura anônima.

## Estrutura principal

```text
app/clinica-ns/             Rotas públicas canônicas
app/negocio-ns/             Implementação compartilhada e fallback das rotas antigas
components/
  booking/booking-flow.tsx
  admin/                    Agenda, disponibilidade e configurações
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
- Serviços oferecidos em cada dia: painel **Horários → Serviços por dia da semana**.
- Paleta e componentes visuais: `app/globals.css`.

Antes de uso comercial, revise serviços, durações, expediente, disponibilidade semanal e a política de privacidade aplicável ao negócio.

## Atualizar uma instalação do MVP 2

Depois de substituir os arquivos pelo MVP 2.1, mantenha seu `.env.local` e execute:

```bash
npm install
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npm run test
npm run build
```

O endereço e o Instagram ficam em `lib/business.ts`. Os botões de reagendamento, cancelamento e dúvida apenas abrem mensagens prontas no WhatsApp; não alteram registros automaticamente.
