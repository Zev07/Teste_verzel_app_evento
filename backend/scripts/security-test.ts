/**
 * Bateria de segurança e concorrência para os módulos de Reservas, Ingressos
 * e Portaria. Diferente do smoke-test.ts (fluxo feliz + erros óbvios), este
 * script foca em:
 *   1. Controle de acesso (IDOR — um usuário acessando dado de outro)
 *   2. Adulteração de QR / assinatura HMAC
 *   3. Validação de entrada em casos extremos
 *   4. Condição de corrida real (não simulada) nas duas garantias críticas
 *      do sistema: não vender o mesmo ingresso duas vezes, e não validar o
 *      mesmo ingresso duas vezes na portaria.
 *
 * Uso: npm run test:security   (com o backend rodando em outro terminal e
 * o seed já aplicado — depende do usuário de portaria semeado)
 */

import { createTestRunner } from "./_test-utils";

const { ok, fail, request, summary } = createTestRunner();

async function main() {
  const suffix = Date.now();
  const password = "senha123";

  // --- Setup: organizador, dois clientes, evento ---
  await request("POST", "/auth/register", {
    name: "Organizador Security",
    email: `organizador.security.${suffix}@teste.com`,
    password,
    role: "ORGANIZER",
  });
  const loginOrganizer = await request("POST", "/auth/login", {
    email: `organizador.security.${suffix}@teste.com`,
    password,
  });
  const organizerToken = loginOrganizer.body?.token;

  await request("POST", "/auth/register", {
    name: "Cliente A Security",
    email: `clienteA.security.${suffix}@teste.com`,
    password,
    role: "CLIENT",
  });
  const loginClientA = await request("POST", "/auth/login", {
    email: `clienteA.security.${suffix}@teste.com`,
    password,
  });
  const clientAToken = loginClientA.body?.token;

  await request("POST", "/auth/register", {
    name: "Cliente B Security",
    email: `clienteB.security.${suffix}@teste.com`,
    password,
    role: "CLIENT",
  });
  const loginClientB = await request("POST", "/auth/login", {
    email: `clienteB.security.${suffix}@teste.com`,
    password,
  });
  const clientBToken = loginClientB.body?.token;

  const loginGate = await request("POST", "/auth/login", {
    email: "portaria@teste.com",
    password: "senha123",
  });
  const gateToken = loginGate.body?.token;
  if (!gateToken) {
    console.log("⚠️  Login da portaria falhou — rode 'npm run db:seed' antes deste teste.");
  }

  const createEvent = await request(
    "POST",
    "/events",
    {
      title: "Evento Security Test",
      type: "SHOW",
      date: new Date(Date.now() + 86400000 * 10).toISOString(),
      location: "Local Security",
      capacity: 5,
      price: 50,
    },
    organizerToken
  );
  const eventId = createEvent.body?.id;

  // ============================================================
  // 1. IDOR — acesso a dado de outro usuário
  // ============================================================

  const reserveA = await request("POST", "/reservations", { eventId, quantity: 1 }, clientAToken);
  const reservationAId = reserveA.body?.reservation?.id;
  const ticketA = reserveA.body?.tickets?.[0];

  const bGetReservationOfA = await request("GET", `/reservations/${reservationAId}`, undefined, clientBToken);
  bGetReservationOfA.status === 403
    ? ok("IDOR: Cliente B não acessa reserva do Cliente A (403)")
    : fail("IDOR: Cliente B conseguiu acessar reserva do Cliente A", bGetReservationOfA);

  const bGetTicketOfA = await request("GET", `/tickets/${ticketA?.id}`, undefined, clientBToken);
  bGetTicketOfA.status === 403
    ? ok("IDOR: Cliente B não acessa ingresso do Cliente A (403)")
    : fail("IDOR: Cliente B conseguiu acessar ingresso do Cliente A", bGetTicketOfA);

  const bShareTicketOfA = await request("POST", `/tickets/${ticketA?.id}/share`, undefined, clientBToken);
  bShareTicketOfA.status === 403
    ? ok("IDOR: Cliente B não consegue compartilhar ingresso do Cliente A (403)")
    : fail("IDOR: Cliente B conseguiu compartilhar ingresso do Cliente A", bShareTicketOfA);

  // ============================================================
  // 2. Autenticação — token ausente, malformado ou adulterado
  // ============================================================

  const noAuthHeader = await request("GET", "/tickets/mine");
  noAuthHeader.status === 401
    ? ok("Sem header Authorization é rejeitado (401)")
    : fail("Requisição sem token deveria ser rejeitada", noAuthHeader);

  const malformedHeader = await fetch(`${process.env.API_URL || "http://localhost:3333"}/tickets/mine`, {
    headers: { Authorization: clientAToken }, // sem o prefixo "Bearer "
  });
  malformedHeader.status === 401
    ? ok("Token sem prefixo 'Bearer ' é rejeitado (401)")
    : fail("Token sem 'Bearer ' deveria ser rejeitado", { status: malformedHeader.status });

  const tamperedToken = clientAToken ? clientAToken.slice(0, -3) + "xyz" : "";
  const tamperedAuth = await request("GET", "/tickets/mine", undefined, tamperedToken);
  tamperedAuth.status === 401
    ? ok("Token com assinatura adulterada é rejeitado (401)")
    : fail("Token adulterado deveria ser rejeitado", tamperedAuth);

  // ============================================================
  // 3. Adulteração de QR
  // ============================================================

  const noDot = await request("POST", "/gate/validate", { eventId, qrToken: "semponto" }, gateToken);
  noDot.body?.result === "INVALID"
    ? ok("QR sem separador '.' retorna INVALID")
    : fail("QR sem '.' deveria retornar INVALID", noDot.body);

  const extraSegment = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: `${ticketA?.qrToken}.lixoextra` },
    gateToken
  );
  extraSegment.body?.result === "INVALID"
    ? ok("QR com segmento extra no final é rejeitado (não trata como válido)")
    : fail("QR com lixo extra deveria retornar INVALID", extraSegment.body);

  const flippedSignature =
    ticketA?.qrToken?.slice(0, -1) + (ticketA?.qrToken?.slice(-1) === "a" ? "b" : "a");
  const tamperedSig = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: flippedSignature },
    gateToken
  );
  tamperedSig.body?.result === "INVALID"
    ? ok("QR com 1 caractere da assinatura alterado é rejeitado")
    : fail("QR com assinatura adulterada deveria ser INVALID", tamperedSig.body);

  const sqlInjectionAttempt = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: "'; DROP TABLE tickets; --.fakesig" },
    gateToken
  );
  sqlInjectionAttempt.status === 200 && sqlInjectionAttempt.body?.result === "INVALID"
    ? ok("Payload de SQL injection no qrToken não quebra o servidor (tratado como INVALID)")
    : fail("Payload de SQL injection deveria ser tratado com segurança", sqlInjectionAttempt);

  // Confirma que a tabela realmente sobreviveu ao teste acima.
  const tableStillWorks = await request("GET", `/events/${eventId}`);
  tableStillWorks.status === 200
    ? ok("Tabela 'tickets' segue íntegra após tentativa de SQL injection")
    : fail("Algo quebrou depois da tentativa de SQL injection", tableStillWorks);

  // ============================================================
  // 4. Validação de entrada em casos extremos
  // ============================================================

  const zeroQuantity = await request("POST", "/reservations", { eventId, quantity: 0 }, clientAToken);
  zeroQuantity.status === 422
    ? ok("Reserva com quantity=0 é rejeitada (422)")
    : fail("quantity=0 deveria ser rejeitado pela validação", zeroQuantity);

  const negativeQuantity = await request("POST", "/reservations", { eventId, quantity: -5 }, clientAToken);
  negativeQuantity.status === 422
    ? ok("Reserva com quantity negativa é rejeitada (422)")
    : fail("quantity negativa deveria ser rejeitada", negativeQuantity);

  const malformedEventId = await request(
    "POST",
    "/reservations",
    { eventId: "não-é-um-uuid", quantity: 1 },
    clientAToken
  );
  malformedEventId.status === 422
    ? ok("eventId malformado (não-UUID) é rejeitado (422)")
    : fail("eventId malformado deveria ser rejeitado", malformedEventId);

  const nonExistentEventId = await request(
    "POST",
    "/reservations",
    { eventId: "00000000-0000-0000-0000-000000000099", quantity: 1 },
    clientAToken
  );
  nonExistentEventId.status === 404
    ? ok("eventId válido mas inexistente retorna 404")
    : fail("eventId inexistente deveria retornar 404", nonExistentEventId);

  // ============================================================
  // 5. Condição de corrida real — não simulada, concorrência de verdade
  // ============================================================

  // Evento com capacidade 1: duas reservas simultâneas de 1 ingresso cada.
  // Sem o lock (SELECT ... FOR UPDATE), existe uma janela real onde as duas
  // leem "1 disponível" ao mesmo tempo e as duas passam — vendendo 2 pra
  // uma vaga só. Isso dispara as duas requisições de verdade em paralelo,
  // não uma depois da outra, pra provar que o lock segura na prática.
  const raceEvent = await request(
    "POST",
    "/events",
    {
      title: "Evento Race Condition Test",
      type: "SHOW",
      date: new Date(Date.now() + 86400000 * 10).toISOString(),
      location: "Local Race",
      capacity: 1,
      price: 10,
    },
    organizerToken
  );
  const raceEventId = raceEvent.body?.id;

  const [raceResultA, raceResultB] = await Promise.all([
    request("POST", "/reservations", { eventId: raceEventId, quantity: 1 }, clientAToken),
    request("POST", "/reservations", { eventId: raceEventId, quantity: 1 }, clientBToken),
  ]);

  const successCount = [raceResultA, raceResultB].filter((r) => r.status === 201).length;
  const conflictCount = [raceResultA, raceResultB].filter((r) => r.status === 409).length;

  successCount === 1 && conflictCount === 1
    ? ok("RACE CONDITION: 2 reservas simultâneas p/ 1 vaga → exatamente 1 sucesso + 1 rejeição (sem overselling)")
    : fail("RACE CONDITION: overselling pode ter ocorrido!", {
        statusA: raceResultA.status,
        statusB: raceResultB.status,
      });

  // Mesma lógica pro double-scan na portaria: escaneia o mesmo QR duas vezes
  // ao mesmo tempo (ex: duas catracas na mesma entrada). Sem o lock, as duas
  // poderiam ler "VALID" simultaneamente e liberar a entrada duas vezes.
  const winnerReservation = raceResultA.status === 201 ? raceResultA : raceResultB;
  const raceTicket = winnerReservation.body?.tickets?.[0];

  const [scanResultA, scanResultB] = await Promise.all([
    request("POST", "/gate/validate", { eventId: raceEventId, qrToken: raceTicket?.qrToken }, gateToken),
    request("POST", "/gate/validate", { eventId: raceEventId, qrToken: raceTicket?.qrToken }, gateToken),
  ]);

  const validCount = [scanResultA, scanResultB].filter((r) => r.body?.result === "VALID").length;
  const usedCount = [scanResultA, scanResultB].filter((r) => r.body?.result === "ALREADY_USED").length;

  validCount === 1 && usedCount === 1
    ? ok("RACE CONDITION: 2 validações simultâneas do mesmo QR → exatamente 1 VALID + 1 ALREADY_USED")
    : fail("RACE CONDITION: double-scan pode ter liberado entrada duas vezes!", {
        resultA: scanResultA.body?.result,
        resultB: scanResultB.body?.result,
      });

  const failedCount = summary("SECURITY & CONCURRENCY TEST");
  if (failedCount > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Erro inesperado ao rodar a bateria de segurança:", error);
  process.exit(1);
});
