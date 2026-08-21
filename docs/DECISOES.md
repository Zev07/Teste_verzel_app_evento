# Decisões de Desenvolvimento

Atuei neste projeto no papel de Tech Lead e Arquiteto de Software, focando em
planejamento estratégico, priorização, QA, secure coding e engenharia de
prompts. O código foi desenvolvido com apoio de IA (Claude e Gemini), com
validação estrutural, auditoria de segurança e integração conduzidas por mim.

**Resumo do progresso**

| Dia | Módulo | Status |
|---|---|---|
| 1 | Infraestrutura e setup | ✅ Concluído |
| 2 | Autenticação e segurança | ✅ Concluído |
| 3 | Eventos + testes de regressão | ✅ Concluído |
| 4 | Reservas e pagamento simulado | ✅ Concluído |
| 5 | Ingressos, portaria e auditoria de segurança | ✅ Concluído |
| 6 | Front-end — fundação e roteamento | ✅ Concluído |
| 7 | Congelamento de escopo | ⚠️ Dívida técnica documentada abaixo |

---

## Dia 1 — Planejamento, Escopo e Infraestrutura Base

**Decisão (humana)**
Modelagem do banco de dados, definição do MVP e roadmap para os 7 dias.
Node.js + Express no back-end e Vite/React no front-end — velocidade de
setup, sem overhead de frameworks mais pesados (NestJS/Next.js) que não
agregariam valor a esse escopo. Logs estruturados (Pino) exigidos desde o
dia zero.

**Uso de IA**
Agentes com prompts contendo as regras de negócio; boilerplate inicial
(Docker, docker-compose, package.json, config do Prisma) delegado à IA.

**Problema encontrado**
Prisma Engine em loop de falha (`Could not parse schema engine response`) —
causa: `node:20-alpine` sem OpenSSL nativo. Corrigido instalando o pacote no
Dockerfile e ajustando `binaryTargets` no schema. Healthcheck do banco também
corrigido (apontava pro banco padrão do usuário, não `eventos_db`).

**Resultado**
Ambiente estável, sem reinicializações; migrations aplicadas; healthcheck
respondendo 200 OK.

---

## Dia 2 — Módulo de Autenticação e Segurança

**Decisão (humana)**
Segurança definida antes de qualquer rota de negócio. Registro público
restrito a `CLIENT` e `ORGANIZER` — `GATE` é papel administrativo, criado via
seed. Mensagem de erro genérica no login (independente de falha ser email ou
senha) para mitigar enumeração de contas.

**Uso de IA**
Estrutura de auth (JWT) e middlewares de validação. JWT com payload mínimo
(`sub` + `role`), evitando dado desatualizado em sessão.

**Problema encontrado**
Express 4 não propaga rejeições de Promise automaticamente para o error
handler — requisições assíncronas com erro ficariam pendentes. Corrigido com
wrapper `asyncHandler` obrigatório em todos os controllers.

**Resultado**
Auth validada: acessos indevidos bloqueados com 401/403 corretos; nenhuma
stack trace vaza para o cliente.

---

## Dia 3 — Módulo de Eventos e Testes de Regressão

**Decisão (humana)**
Sistema não acoplado a uma única API externa — padrão Adapter para
intercambiar Ticketmaster e TMDb. Ao final do módulo, desenvolvimento pausado
para implementar smoke tests automatizados antes de seguir, evitando
empilhamento silencioso de bugs.

**Uso de IA**
Integração com as APIs documentadas; script automatizado cobrindo os fluxos
já existentes (criação de usuário, geração de token, listagem de eventos).

**Problema encontrado**
Tipagem estrita do TypeScript rejeitava propriedades dinâmicas na resposta
bruta da API nos testes. Resolvido rodando via `--transpile-only`, sem criar
interfaces excessivas só para o script de teste. Fluxo de teste também
ajustado para não cancelar eventos que as etapas seguintes (reservas)
precisariam consumir.

**Resultado**
18 verificações passando (100%), validando RBAC e integração externa nesse
ponto do desenvolvimento.

---

## Dia 4 — Módulo de Reservas e Pagamento Simulado

**Decisão (humana)**
Reserva e pagamento simulado numa única transação atômica
(`POST /reservations`). Disponibilidade calculada contando ingressos
`VALID`/`USED` dinamicamente, não um contador estático no evento (evita
inconsistência). Status HTTP `402` explícito para pagamento recusado —
separação semântica clara pro front-end.

**Uso de IA**
Fluxo transacional implementado com instrução explícita de usar
`SELECT FOR UPDATE` — lock de linha no banco, única garantia real contra
overselling sob concorrência.

**Problema encontrado**
Sugestão inicial (IA) foi um fluxo em duas etapas — reserva pendente, depois
confirmação de pagamento separada. Rejeitado: exigiria job em background para
expirar reservas abandonadas, adicionando risco e complexidade
desnecessários ao escopo.

**Resultado**
Fluxo síncrono: resultado nasce com ingresso emitido ou vaga liberada na
hora — sem prender capacidade do evento indevidamente.

---

## Dia 5 — Módulos de Ingressos, Portaria e Auditoria de Segurança

**Decisão (humana)**
Portaria sempre responde HTTP `200`, com o resultado real
(`VALID`/`ALREADY_USED`/`WRONG_EVENT`/`INVALID`) no corpo — é um fluxo
operacional normal, não erro de protocolo. Link de compartilhamento expira em
7 dias, com payload enxuto (protege privacidade do comprador original).
Testes de segurança separados dos smoke tests regulares.

**Uso de IA**
Construção da portaria e geração do QR. QR implementado como imagem base64
gerada em tempo de execução a partir do token assinado (HMAC), nunca
armazenada — evita duplicação e dessincronização. Testes de concorrência
real exigidos via `Promise.all`.

**Problemas encontrados**
1. **Falha de design no HMAC** — sugestão inicial assinava `ticketId + eventId`
   juntos. Isso quebraria a distinção entre "QR inválido" e "QR de outro
   evento" (dois retornos exigidos separadamente pelo negócio) — um QR
   legítimo de outro evento falharia a verificação exatamente como um QR
   forjado. Corrigido: assinatura cobre só o `ticketId`; a checagem de evento
   correto passou a ser feita consultando o banco.
2. **Falha de parsing** — `verifyQrToken` não limitava o número de partes do
   `split(".")`, permitindo que texto extra no final do token fosse
   silenciosamente ignorado. Corrigido exigindo exatamente 2 partes.

**Resultado**
Suíte de segurança comprovou integridade sob condição de corrida real: N
compradores simultâneos disputando a última vaga resultam
deterministicamente em exatamente 1 ingresso emitido e falha controlada para
os demais.

---

## Dia 6 — Front-end: Fundação e Roteamento

**Decisão (humana)**
React + Tailwind CSS. Justificativa: ecossistema maduro e flexibilidade do
Tailwind para construir identidade visual própria, evitando cara de
"template pronto" — desde que o tema seja customizado (cores/fonte fora do
padrão), não usado com a configuração default.

**Uso de IA**
Estrutura base do front-end gerada de forma deliberadamente neutra/mínima —
esqueleto funcional sem opinião forte de design embutida, maximizando
flexibilidade pra iteração visual própria depois.

**Problema encontrado**
Comunicação entre camadas configurada preventivamente: interceptor do Axios
anexando o JWT automaticamente em requisições autenticadas, e CORS alinhado
com o back-end rodando em Docker.

**Resultado**
Fundação do front-end estabelecida: roteamento público vs. protegido por
papel estruturado; comunicação estável com a API local; arquitetura de
estado pronta para as telas de Organizador, Cliente e Portaria.

---

## Dia 7 — Congelamento de Escopo e Dívida Técnica

**Decisão (humana)**
Com o timebox se esgotando, decretado *code freeze*. Priorizei um fluxo
transacional sólido no back-end em vez de refinamento estético/modular do
front-end na última hora — introduzir lógica estrutural nova sob pressão de
prazo é mais arriscado do que documentar o que ficou pendente.

**Dívida técnica mapeada**

- **Endurecimento de input no front-end**: o back-end já é protegido contra
  SQL injection nativamente pelo Prisma (parametrização automática, inclusive
  em `$queryRaw` — validado no `security-test.ts`). O que falta é validação
  mais rígida nos formulários do front-end (limites de tamanho, formato) além
  do que o HTML5/Zod já garante — não uma vulnerabilidade ativa, mas uma
  camada extra de robustez não implementada.
- **Componentização do front-end**: interface funcional para o MVP, mas
  componentes repetitivos (botão, card, input) não foram extraídos — fere DRY
  na camada visual.
- **Política de log formal**: logs de debug locais foram usados durante a
  construção para agilizar troubleshooting. Uma política formal de
  log estruturado em produção (o que é logado, em qual nível, por quanto
  tempo) não foi definida — item de maturidade operacional, não uma falha de
  segurança identificada no código atual.

**Resultado**
MVP entregue funcional e estável, com as regras críticas de negócio (lock de
concorrência, RBAC, validação criptográfica de portaria) operando e testadas.
Decisão de engenharia deliberada: garantir a fundação do sistema, deixando
refinamento de UI e endurecimento periférico mapeados para a próxima
iteração — não esquecidos, documentados.

---
