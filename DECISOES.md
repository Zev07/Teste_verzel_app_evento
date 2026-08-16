## Dia 1 — Modelagem e setup

**Decisão:** Escolhi Postgres em vez de Mongo para o banco.
**Por quê:** o domínio tem relações fortes (evento → ingressos → reservas)
e preciso de transações para evitar overselling de lugares.

**IA:** usei o Claude para gerar o schema inicial do Prisma a partir do
meu desenho de entidades. Ajustei manualmente as constraints de unicidade
(lugar + evento) porque a sugestão inicial não garantia isso no nível do banco.

---

## Dia 3 — Segurança do QR Code

**Percebi que:** um QR com só um UUID sequencial poderia ser adivinhado/forjado.
**Decisão:** troquei para um token assinado com HMAC (ingresso_id + secret do servidor),
validado na portaria antes de aceitar.
**Sem IA:** a escolha de HMAC vs JWT foi minha, pesquisei os trade-offs;
usei IA só pra revisar a implementação do assinatura em Node.