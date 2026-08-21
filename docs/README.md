# Plataforma de Eventos e Ingressos

Projeto desenvolvido para o Desafio Elite Dev (Verzel). Um organizador
publica eventos a partir de um catálogo externo (Ticketmaster ou TMDb), o
cliente navega, reserva, paga (simulado), recebe o ingresso com QR e pode
compartilhá-lo por link; a portaria valida o ingresso na entrada.

## Escopo

| Papel | O que faz |
|---|---|
| **Organizador** | Cria e gerencia eventos a partir do catálogo externo |
| **Cliente** | Busca eventos, reserva, paga (simulado), acessa "Meus ingressos", compartilha por link |
| **Portaria** | Valida ingresso na entrada (QR via câmera ou código digitado) |

## Stack

- **Front-end:** React + TypeScript + Vite + Tailwind CSS
- **Back-end:** Node + TypeScript + Express
- **Banco de dados:** PostgreSQL + Prisma
- **Infra local:** Docker Compose

## Estrutura do projeto

```
backend/    API REST (auth, eventos, reservas, ingressos, portaria)
frontend/   Aplicação React (telas de organizador, cliente e portaria)
docs/       Modelagem de dados, decisões técnicas, progresso do front-end
```

- `docs/MODELAGEM.md` — modelo de dados completo
- `docs/DECISOES.md` — histórico de decisões técnicas, dia a dia
- `docs/FRONTEND_PROGRESS.md` — checklist de progresso do front-end

## Como rodar (via Docker Compose — recomendado)

1. Copie os arquivos de ambiente de exemplo:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Preencha `backend/.env` com os segredos (`JWT_SECRET`, `QR_SIGNING_SECRET`)
   e a chave da API externa (`TICKETMASTER_API_KEY` ou `TMDB_API_KEY`).
   `FRONTEND_URL` já vem preenchida com o valor local padrão (usada para
   montar o link de compartilhamento de ingresso).
3. Suba tudo:
   ```bash
   docker compose up --build
   ```
4. Rode a migration inicial e o seed de dados de teste (com os containers no ar):
   ```bash
   docker compose exec backend npx prisma migrate dev --name init
   docker compose exec backend npm run db:seed
   ```
5. Acesse:
   - Front-end: http://localhost:5173
   - Back-end: http://localhost:3333/health

## Como rodar sem Docker

**Backend:**
```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL para seu Postgres local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Dados de teste (gerados pelo seed)

| Papel | Email | Senha |
|---|---|---|
| Organizador | organizador@teste.com | senha123 |
| Cliente 1 | cliente1@teste.com | senha123 |
| Cliente 2 | cliente2@teste.com | senha123 |
| Portaria | portaria@teste.com | senha123 |

Um evento de exemplo ("Show de Teste — Banda Exemplo") já é publicado com
ingressos disponíveis.

## Testando o back-end

Com o backend no ar e o seed aplicado:

```bash
cd backend
npm run test:smoke      # fluxo feliz + erros esperados de todos os módulos
npm run test:security   # IDOR, adulteração de QR, SQL injection, concorrência real
npm run test:all        # os dois em sequência
```

`test:security` inclui dois testes de condição de corrida que disparam
requisições em paralelo de verdade (`Promise.all`), provando sob concorrência
real — não só na lógica sequencial — que a proteção contra overselling e
contra validação duplicada de ingresso na portaria seguram.

Ambos os scripts criam usuários de teste com email único a cada execução e
imprimem um resumo `Passou / Falhou` no final. Saída não-zero se algo falhar.

---

## Endpoints — Auth

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Cria conta (`role`: `CLIENT` ou `ORGANIZER`) |
| POST | `/auth/login` | Público | Retorna `{ token, user }` |

Rotas protegidas esperam o header `Authorization: Bearer <token>`.

## Endpoints — Eventos

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/events/catalog?source=ticketmaster\|tmdb&query=` | Organizador | Busca no catálogo externo |
| GET | `/events/mine` | Organizador | Lista os próprios eventos (qualquer status) |
| POST | `/events` | Organizador | Cria evento publicado |
| PATCH | `/events/:id/cancel` | Organizador (dono) | Cancela o evento |
| GET | `/events?search=&location=&type=&dateFrom=&dateTo=&minPrice=&maxPrice=` | Público | Lista eventos publicados, com filtros |
| GET | `/events/:id` | Público | Detalhe (inclui `available`: ingressos restantes) |

## Endpoints — Reservas e Pagamento (simulado)

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/reservations` | Cliente | Reserva + paga (simulado) em uma chamada. `forceOutcome: "DECLINED"` opcional para testar recusa. `201` (aprovado, com ingressos) ou `402` (recusado) |
| GET | `/reservations/mine` | Cliente | Lista as próprias reservas |
| GET | `/reservations/:id` | Cliente (dono) | Detalhe de uma reserva |

Corpo de `POST /reservations`: `{ "eventId": "uuid", "quantity": 1 }`.

## Endpoints — Ingressos

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/tickets/mine` | Cliente | Lista os próprios ingressos, com QR (imagem base64) |
| GET | `/tickets/:id` | Cliente (dono) | Detalhe de um ingresso |
| POST | `/tickets/:id/share` | Cliente (dono) | Gera link de compartilhamento (expira em 7 dias) |
| GET | `/tickets/share/:token` | Público | Visualiza ingresso compartilhado (somente leitura) |

## Endpoints — Portaria

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/gate/validate` | Portaria | Valida ingresso. Body: `{ eventId, qrToken }`. Sempre `200`, resultado no campo `result`: `VALID`, `ALREADY_USED`, `WRONG_EVENT` ou `INVALID` |

O `qrToken` é o mesmo valor tanto pra leitura via câmera quanto pra
digitação manual — não há endpoint separado por modo de entrada.

---

## Status do projeto

### Back-end — completo e testado
- [x] Setup (estrutura, schema, Docker)
- [x] Auth (registro, login, JWT, RBAC)
- [x] Eventos (catálogo externo, CRUD do organizador, busca do cliente)
- [x] Reservas e pagamento simulado (com proteção contra overselling)
- [x] Ingressos (QR, área "Meus ingressos", compartilhamento por link)
- [x] Portaria (validação com os 4 retornos exigidos)
- [x] Smoke test + bateria de segurança/concorrência (`npm run test:all`)

### Front-end — em andamento
- [x] Fundação: tipos, serviços de API, `AuthContext`, rotas protegidas por papel, layout base
- [ ] Telas de autenticação (login/registro)
- [ ] Telas do cliente (listar/buscar evento, detalhe + reserva, meus ingressos)
- [ ] Telas do organizador (dashboard, criar evento)
- [ ] Tela da portaria (validação por câmera + digitação manual)
- [ ] Tema Tailwind customizado (cores/fonte próprias)

Progresso detalhado, arquivo por arquivo: `docs/FRONTEND_PROGRESS.md`.

### Opcionais (bônus) — não iniciados
- [ ] Mapa de assentos em tempo real
- [ ] Deploy
- [ ] Testes automatizados do front-end

## O que não está implementado / limitações conhecidas

- **Front-end**: ver checklist acima — a API completa já está pronta e
  testada, faltam as telas que a consomem.
- **Endurecimento de input no front-end**: o back-end já é protegido contra
  SQL injection nativamente pelo Prisma (parametrizado, inclusive em
  `$queryRaw` — validado em `test:security`). Validação mais rígida nos
  formulários do front-end (além do que HTML5/Zod já garantem) ainda não foi
  implementada.
- **Componentização do front-end**: componentes repetitivos (botão, card,
  input) ainda não foram extraídos em um `theme`/biblioteca própria.
- Ver `docs/DECISOES.md` (Dia 7) para o detalhamento completo da dívida
  técnica assumida conscientemente dado o prazo.
