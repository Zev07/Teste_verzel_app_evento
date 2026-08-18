/**
 * Smoke test manual dos módulos já implementados (auth + events + reservas +
 * ingressos + portaria). Roda contra uma instância já no ar — não sobe nada
 * sozinho. Cobre os fluxos felizes e os erros esperados de cada módulo.
 *
 * Para a bateria de segurança/concorrência (edge cases, IDOR, race
 * conditions), ver scripts/security-test.ts.
 *
 * Uso: npm run test:smoke   (com o backend rodando em outro terminal)
 */

import { createTestRunner } from "./_test-utils";

const { ok, fail, request, summary } = createTestRunner();

async function main() {
  const suffix = Date.now();
  const organizerEmail = `organizador.smoke.${suffix}@teste.com`;
  const clientEmail = `cliente.smoke.${suffix}@teste.com`;
  const password = "senha123";

  // --- Health check ---
  const health = await request("GET", "/health");
  health.status === 200 ? ok("Health check responde 200") : fail("Health check", health);

  // --- Registro ---
  const registerOrganizer = await request("POST", "/auth/register", {
    name: "Organizador Smoke",
    email: organizerEmail,
    password,
    role: "ORGANIZER",
  });
  registerOrganizer.status === 201
    ? ok("Registro de organizador retorna 201")
    : fail("Registro de organizador", registerOrganizer);

  const registerClient = await request("POST", "/auth/register", {
    name: "Cliente Smoke",
    email: clientEmail,
    password,
    role: "CLIENT",
  });
  registerClient.status === 201
    ? ok("Registro de cliente retorna 201")
    : fail("Registro de cliente", registerClient);

  const registerInvalidRole = await request("POST", "/auth/register", {
    name: "Tentativa Portaria",
    email: `portaria.smoke.${suffix}@teste.com`,
    password,
    role: "GATE",
  });
  registerInvalidRole.status === 422
    ? ok("Registro com role GATE é rejeitado (422)")
    : fail("Registro com role GATE deveria ser rejeitado", registerInvalidRole);

  const registerDuplicate = await request("POST", "/auth/register", {
    name: "Duplicado",
    email: organizerEmail,
    password,
    role: "ORGANIZER",
  });
  registerDuplicate.status === 409
    ? ok("Registro com email duplicado é rejeitado (409)")
    : fail("Registro duplicado deveria ser rejeitado", registerDuplicate);

  // --- Login ---
  const loginOrganizer = await request("POST", "/auth/login", {
    email: organizerEmail,
    password,
  });
  const organizerToken = loginOrganizer.body?.token;
  organizerToken
    ? ok("Login de organizador retorna token")
    : fail("Login de organizador não retornou token", loginOrganizer);

  const loginClient = await request("POST", "/auth/login", {
    email: clientEmail,
    password,
  });
  const clientToken = loginClient.body?.token;
  clientToken
    ? ok("Login de cliente retorna token")
    : fail("Login de cliente não retornou token", loginClient);

  const loginWrongPassword = await request("POST", "/auth/login", {
    email: organizerEmail,
    password: "senhaerrada",
  });
  loginWrongPassword.status === 401
    ? ok("Login com senha errada é rejeitado (401)")
    : fail("Login com senha errada deveria ser rejeitado", loginWrongPassword);

  // --- RBAC: cliente não pode criar evento ---
  const createAsClient = await request(
    "POST",
    "/events",
    {
      title: "Tentativa inválida",
      type: "SHOW",
      date: new Date(Date.now() + 86400000 * 10).toISOString(),
      location: "Local Teste",
      capacity: 10,
      price: 50,
    },
    clientToken
  );
  createAsClient.status === 403
    ? ok("Cliente tentando criar evento é bloqueado (403)")
    : fail("Cliente criando evento deveria ser bloqueado", createAsClient);

  // --- Sem token nenhum ---
  const createNoToken = await request("POST", "/events", { title: "Sem token" });
  createNoToken.status === 401
    ? ok("Criar evento sem token é bloqueado (401)")
    : fail("Criar evento sem token deveria ser bloqueado", createNoToken);

  // --- Organizador cria evento ---
  const createEvent = await request(
    "POST",
    "/events",
    {
      title: "Show Smoke Test",
      type: "SHOW",
      date: new Date(Date.now() + 86400000 * 10).toISOString(),
      location: "Arena Smoke Test",
      capacity: 50,
      price: 99.9,
    },
    organizerToken
  );
  const eventId = createEvent.body?.id;
  createEvent.status === 201 && eventId
    ? ok("Organizador cria evento (201)")
    : fail("Criação de evento pelo organizador falhou", createEvent);

  // --- Listagem pública ---
  const listPublic = await request("GET", "/events");
  const foundInList = Array.isArray(listPublic.body) && listPublic.body.some((e: any) => e.id === eventId);
  listPublic.status === 200 && foundInList
    ? ok("Evento criado aparece na listagem pública")
    : fail("Evento não apareceu na listagem pública", listPublic.body);

  // --- Busca com filtro ---
  const searchFiltered = await request("GET", "/events?search=Smoke");
  const foundInSearch =
    Array.isArray(searchFiltered.body) && searchFiltered.body.some((e: any) => e.id === eventId);
  foundInSearch
    ? ok("Filtro de busca (?search=) encontra o evento")
    : fail("Filtro de busca não encontrou o evento", searchFiltered.body);

  // --- Detalhe público ---
  const getById = await request("GET", `/events/${eventId}`);
  getById.status === 200 && getById.body?.id === eventId
    ? ok("Detalhe do evento por id retorna corretamente")
    : fail("Detalhe do evento falhou", getById);

  // --- Listagem do organizador ---
  const listMine = await request("GET", "/events/mine", undefined, organizerToken);
  const foundInMine = Array.isArray(listMine.body) && listMine.body.some((e: any) => e.id === eventId);
  foundInMine ? ok("Evento aparece em /events/mine") : fail("Evento não apareceu em /events/mine", listMine.body);

  // --- Cliente não pode cancelar evento ---
  const cancelAsClient = await request("PATCH", `/events/${eventId}/cancel`, undefined, clientToken);
  cancelAsClient.status === 403
    ? ok("Cliente tentando cancelar evento é bloqueado (403)")
    : fail("Cliente cancelando evento deveria ser bloqueado", cancelAsClient);

  // O cancelamento em si é testado com um evento separado (abaixo), para
  // manter "eventId" PUBLISHED e disponível para os testes de reserva.

  // ============================================================
  // Reservas + pagamento simulado
  // ============================================================

  // --- Organizador não pode reservar (RBAC) ---
  const reserveAsOrganizer = await request(
    "POST",
    "/reservations",
    { eventId, quantity: 1 },
    organizerToken
  );
  reserveAsOrganizer.status === 403
    ? ok("Organizador tentando reservar é bloqueado (403)")
    : fail("Organizador reservando deveria ser bloqueado", reserveAsOrganizer);

  // --- Reserva aprovada (fluxo feliz) ---
  const reserveApproved = await request(
    "POST",
    "/reservations",
    { eventId, quantity: 2 },
    clientToken
  );
  const approvedTickets = reserveApproved.body?.tickets;
  reserveApproved.status === 201 &&
  reserveApproved.body?.reservation?.status === "PAID" &&
  approvedTickets?.length === 2
    ? ok("Reserva aprovada gera 2 ingressos com status PAID (201)")
    : fail("Reserva aprovada não se comportou como esperado", reserveApproved);

  const qrLooksValid = approvedTickets?.every(
    (t: any) => typeof t.qrToken === "string" && t.qrToken.includes(".")
  );
  qrLooksValid
    ? ok("Ingressos gerados têm QR token assinado (formato ticketId.assinatura)")
    : fail("QR token dos ingressos não está no formato esperado", approvedTickets);

  // --- Reserva recusada (pagamento simulado negado) ---
  const reserveDeclined = await request(
    "POST",
    "/reservations",
    { eventId, quantity: 1, forceOutcome: "DECLINED" },
    clientToken
  );
  reserveDeclined.status === 402 &&
  reserveDeclined.body?.reservation?.status === "DECLINED" &&
  reserveDeclined.body?.tickets?.length === 0
    ? ok("Reserva recusada não gera ingresso e retorna 402")
    : fail("Reserva recusada não se comportou como esperado", reserveDeclined);

  // --- Reserva recusada não deve ocupar capacidade (50 - 2 aprovados = 48) ---
  const eventAfterDecline = await request("GET", `/events/${eventId}`);
  eventAfterDecline.body?.available === 48
    ? ok("Reserva recusada não consumiu capacidade do evento (available segue 48)")
    : fail("Capacidade do evento inconsistente após recusa", eventAfterDecline.body);

  // --- Overselling: tentar reservar mais do que o disponível ---
  const reserveTooMany = await request(
    "POST",
    "/reservations",
    { eventId, quantity: 999 },
    clientToken
  );
  reserveTooMany.status === 409
    ? ok("Reserva acima da capacidade disponível é rejeitada (409)")
    : fail("Reserva acima da capacidade deveria ser rejeitada", reserveTooMany);

  // --- Reserva aparece em /reservations/mine ---
  const reservationsMine = await request("GET", "/reservations/mine", undefined, clientToken);
  const foundReservation =
    Array.isArray(reservationsMine.body) &&
    reservationsMine.body.some((r: any) => r.id === reserveApproved.body?.reservation?.id);
  foundReservation
    ? ok("Reserva aprovada aparece em /reservations/mine")
    : fail("Reserva não apareceu em /reservations/mine", reservationsMine.body);

  // --- Outro cliente não pode ver a reserva alheia ---
  const registerOtherClient = await request("POST", "/auth/register", {
    name: "Outro Cliente",
    email: `outro.cliente.smoke.${suffix}@teste.com`,
    password,
    role: "CLIENT",
  });
  const loginOtherClient = await request("POST", "/auth/login", {
    email: `outro.cliente.smoke.${suffix}@teste.com`,
    password,
  });
  const otherClientToken = loginOtherClient.body?.token;
  const viewOthersReservation = await request(
    "GET",
    `/reservations/${reserveApproved.body?.reservation?.id}`,
    undefined,
    otherClientToken
  );
  registerOtherClient.status === 201 && viewOthersReservation.status === 403
    ? ok("Cliente não consegue ver reserva de outro cliente (403)")
    : fail("Isolamento de reserva entre clientes falhou", viewOthersReservation);

  // ============================================================
  // Ingressos (QR + compartilhamento)
  // ============================================================

  const ticketsMine = await request("GET", "/tickets/mine", undefined, clientToken);
  const hasQrImage =
    Array.isArray(ticketsMine.body) && ticketsMine.body.every((t: any) => t.qrImage?.startsWith("data:image"));
  ticketsMine.status === 200 && ticketsMine.body?.length >= 2 && hasQrImage
    ? ok("/tickets/mine lista os ingressos com QR image gerado")
    : fail("/tickets/mine não retornou como esperado", ticketsMine.body);

  const ticketA = approvedTickets?.[0];
  const ticketB = approvedTickets?.[1];

  const shareTicket = await request("POST", `/tickets/${ticketA.id}/share`, undefined, clientToken);
  const shareToken = shareTicket.body?.token;
  shareTicket.status === 201 && shareToken
    ? ok("Compartilhamento de ingresso gera link (201)")
    : fail("Compartilhamento de ingresso falhou", shareTicket);

  const viewShared = await request("GET", `/tickets/share/${shareToken}`);
  viewShared.status === 200 && viewShared.body?.qrImage?.startsWith("data:image")
    ? ok("Link de compartilhamento é acessível publicamente (sem token)")
    : fail("Visualização do ingresso compartilhado falhou", viewShared);

  // ============================================================
  // Portaria (usa o usuário GATE semeado — registro público bloqueia esse papel)
  // ============================================================

  const loginGate = await request("POST", "/auth/login", {
    email: "portaria@teste.com",
    password: "senha123",
  });
  const gateToken = loginGate.body?.token;
  gateToken
    ? ok("Login do usuário de portaria (semeado) funciona")
    : fail("Login da portaria falhou — rodou 'npm run db:seed'?", loginGate);

  const clientTryingGate = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: ticketB.qrToken },
    clientToken
  );
  clientTryingGate.status === 403
    ? ok("Cliente tentando validar na portaria é bloqueado (403)")
    : fail("Cliente validando na portaria deveria ser bloqueado", clientTryingGate);

  const validateOk = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: ticketB.qrToken },
    gateToken
  );
  validateOk.body?.result === "VALID"
    ? ok("Portaria valida ingresso correto (result: VALID)")
    : fail("Validação de ingresso válido falhou", validateOk.body);

  const validateAlreadyUsed = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: ticketB.qrToken },
    gateToken
  );
  validateAlreadyUsed.body?.result === "ALREADY_USED"
    ? ok("Revalidar o mesmo ingresso retorna ALREADY_USED")
    : fail("Revalidação deveria retornar ALREADY_USED", validateAlreadyUsed.body);

  const validateInvalid = await request(
    "POST",
    "/gate/validate",
    { eventId, qrToken: "codigo-forjado.assinatura-falsa" },
    gateToken
  );
  validateInvalid.body?.result === "INVALID"
    ? ok("QR forjado/corrompido retorna INVALID")
    : fail("QR forjado deveria retornar INVALID", validateInvalid.body);

  // ============================================================
  // Cancelamento de evento (evento dedicado, não afeta o de reservas acima)
  // ============================================================

  const eventToCancel = await request(
    "POST",
    "/events",
    {
      title: "Evento para cancelar (smoke test)",
      type: "SHOW",
      date: new Date(Date.now() + 86400000 * 5).toISOString(),
      location: "Local Cancelamento",
      capacity: 10,
      price: 10,
    },
    organizerToken
  );
  const eventToCancelId = eventToCancel.body?.id;

  const validateWrongEvent = await request(
    "POST",
    "/gate/validate",
    { eventId: eventToCancelId, qrToken: ticketB.qrToken },
    gateToken
  );
  validateWrongEvent.body?.result === "WRONG_EVENT"
    ? ok("Ingresso de outro evento retorna WRONG_EVENT")
    : fail("Validação com evento errado deveria retornar WRONG_EVENT", validateWrongEvent.body);

  const cancel = await request("PATCH", `/events/${eventToCancelId}/cancel`, undefined, organizerToken);
  cancel.status === 200 && cancel.body?.status === "CANCELLED"
    ? ok("Organizador cancela o próprio evento")
    : fail("Cancelamento do evento falhou", cancel);

  const listAfterCancel = await request("GET", "/events");
  const stillListed =
    Array.isArray(listAfterCancel.body) &&
    listAfterCancel.body.some((e: any) => e.id === eventToCancelId);
  !stillListed
    ? ok("Evento cancelado não aparece mais na listagem pública")
    : fail("Evento cancelado ainda aparece na listagem pública", listAfterCancel.body);

  // --- Resumo ---
  const failedCount = summary("SMOKE TEST");
  if (failedCount > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Erro inesperado ao rodar o smoke test:", error);
  process.exit(1);
});
