# Plataforma de Eventos e Ingressos

Projeto desenvolvido para o Desafio Elite Dev (Verzel). Organizadores publicam
eventos, clientes reservam e pagam (simulado), recebem ingresso com QR e a
portaria valida na entrada.

## Stack

- **Front-end:** React + TypeScript + Vite
- **Back-end:** Node + TypeScript + Express
- **Banco de dados:** PostgreSQL + Prisma
- **Infra local:** Docker Compose

## Estrutura do projeto

```
backend/    API REST (auth, eventos, reservas, ingressos, pagamentos)
frontend/   Aplicação React (telas de organizador, cliente e portaria)
docs/       Modelagem de dados, decisões técnicas e prompt de desenvolvimento
```

Veja `docs/MODELAGEM.md` para o modelo de dados completo e
`docs/DECISOES.md` para o histórico de decisões técnicas.

## Como rodar (via Docker Compose — recomendado)

1. Copie os arquivos de ambiente de exemplo:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Preencha `backend/.env` com os segredos (`JWT_SECRET`, `QR_SIGNING_SECRET`)
   e a chave da API externa (`TICKETMASTER_API_KEY` ou `TMDB_API_KEY`).
3. Suba tudo:
   ```bash
   docker compose up --build
   ```
4. Rode o seed de dados de teste (com os containers no ar):
   ```bash
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

## Testando o que já está implementado

Com o backend no ar (`docker compose up` ou `npm run dev`), rode o smoke test
end-to-end contra auth + events:

```bash
cd backend
npm run test:smoke
```

Ele cria usuários de teste com email único a cada execução, testa os fluxos
de sucesso e os de erro esperado (RBAC, senha errada, email duplicado, role
inválida), e imprime um resumo `Passou / Falhou` no final. Saída não-zero se
algo falhar — dá pra usar em CI mais tarde.

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
| GET | `/events/:id` | Público | Detalhe de um evento |

## Status do projeto

> Esta seção será atualizada conforme os módulos forem implementados.
>
> - [x] Setup do projeto (estrutura, schema, Docker)
> - [x] Auth (registro, login, JWT, RBAC)
> - [x] Eventos (catálogo externo, CRUD do organizador, busca do cliente)
> - [x] Reservas e pagamento simulado
> - [x] Ingressos (QR) e compartilhamento
> - [x] Portaria (validação)

## O que não está implementado / limitações conhecidas

> - [] Front-end: Sair do placeholder inicial e implementar as telas reais, personalização e estruturação base inicial.
> - [] Personalização e estilização do Front-end
> - [] Opcionais (Bônus) Deploy, mapa de assentos em tempo real, etc.
