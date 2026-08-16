# Decisões de Desenvolvimento

Registro cronológico de decisões técnicas: o quê, por quê, e onde a IA ajudou.

---

## Dia 1 — Setup do projeto

**Decisão:** Express no back-end em vez de NestJS.
**Por quê:** a estrutura de pastas por módulo (`controllers/services/routes/dtos`)
que planejei fica mais direta em Express. NestJS traria injeção de dependência
e decorators que agregam valor em times maiores, mas são overhead desnecessário
pro escopo e prazo deste desafio.

**Decisão:** Vite em vez de Next.js no front-end.
**Por quê:** não há necessidade de SSR no escopo do desafio; Vite tem setup e
build mais rápidos, o que importa dado o prazo de 7 dias.

**Decisão:** `schema.prisma` em `backend/prisma/`, não dentro de `src/database/`
como esbocei inicialmente na estrutura de pastas.
**Por quê:** é a convenção padrão do Prisma CLI — evita ter que configurar
`schema` path manualmente em todo comando.

**Decisão:** logger estruturado (pino) desde o início, em vez de `console.log`.
**Por quê:** troubleshooting em produção/deploy fica inviável sem log
estruturado, e é mais barato configurar isso agora do que trocar depois.

**IA:** usei o Claude para gerar o boilerplate inicial (package.json, tsconfig,
Dockerfiles, docker-compose.yml, schema.prisma a partir da modelagem já
documentada). Revisei manualmente as versões de dependências e ajustei a
localização do schema.prisma para a convenção padrão do Prisma.

---

## Dia 1 (cont.) — Correção: Prisma engine falhando no container

**Problema:** ao subir via Docker Compose, o backend entrava em loop de restart
com `Error: Could not parse schema engine response`, mesmo com o banco
conectando corretamente.

**Causa:** a imagem `node:20-alpine` não vem com OpenSSL instalado, e o engine
binário do Prisma depende dele. Alpine usa `musl` em vez de `glibc`, então
mesmo instalando o OpenSSL é preciso apontar o `binaryTarget` certo
(`linux-musl-openssl-3.0.x`) no `schema.prisma`, senão o Prisma baixa/usa o
binário errado.

**Correção:** adicionado `RUN apk add --no-cache openssl` no Dockerfile do
backend, e `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` no
generator do `schema.prisma`.

---

## Dia 1 (cont. 2) — Correção: healthcheck do Postgres com nome de banco errado

**Problema:** o container `db` ficava logando `FATAL: database "eventos" does
not exist` repetidamente, mesmo com o backend já funcionando normalmente.

**Causa:** o healthcheck usava `pg_isready -U eventos` sem especificar o
banco (`-d`). Por padrão o `pg_isready` tenta conectar num banco com o mesmo
nome do usuário, que não existe — o banco real é `eventos_db`.

**Correção:** adicionado `-d ${POSTGRES_DB:-eventos_db}` ao comando do
healthcheck em `docker-compose.yml`.

---

## Dia 2 — Módulo de Auth

**Decisão:** registro público só aceita os papéis `CLIENT` e `ORGANIZER`.
**Por quê:** não faz sentido de negócio alguém se autocadastrar como `GATE`
(portaria) — esse papel é operacional, criado por quem administra o evento.
No MVP isso é feito via seed; um endpoint administrativo de criação de usuário
de portaria fica como possível evolução, não é bloqueante.

**Decisão:** JWT contém `sub` (id) e `role`, sem outros dados do usuário.
**Por quê:** manter o payload mínimo. Dados como nome/email são buscados no
banco quando necessário, evitando token desatualizado se o usuário mudar
esses campos depois de logado.

**Decisão:** mensagem de erro genérica ("Email ou senha inválidos") tanto pra
email inexistente quanto senha errada no login.
**Por quê:** evita enumeração de contas cadastradas — um atacante não consegue
descobrir quais emails existem na base testando o endpoint de login.

**Decisão:** criado `asyncHandler` como wrapper obrigatório para controllers
assíncronos.
**Por quê:** Express 4 (diferente do 5) não encaminha rejeições de Promise
para o error handler automaticamente. Sem o wrapper, um erro assíncrono não
tratado deixaria a requisição pendurada sem resposta, sem log nenhum.

**IA:** estrutura do módulo (dto/service/controller/route) e os middlewares
de auth/error/validation gerados com apoio do Claude, seguindo o padrão já
definido no prompt de desenvolvimento. Revisei manualmente a tipagem do Zod
com o enum do Prisma (precisou ajustar para literais diretas) e a ordem de
registro dos middlewares no `index.ts`.
