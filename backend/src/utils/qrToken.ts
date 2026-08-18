import crypto from "crypto";

const SECRET = process.env.QR_SIGNING_SECRET as string;

if (!SECRET) {
  throw new Error("QR_SIGNING_SECRET não configurado no ambiente");
}

// Token = "<ticketId>.<assinatura>". A assinatura cobre só o ticketId — o
// ticket em si já está preso a um evento no banco (Ticket.eventId), então
// checar "é o evento certo?" é responsabilidade da portaria consultar o
// banco, não da assinatura. Isso é o que permite distinguir "QR inválido"
// de "QR válido, mas é de outro evento" (dois retornos exigidos pelo
// desafio) — se o eventId estivesse dentro da assinatura, um QR de outro
// evento falharia a verificação do mesmo jeito que um QR forjado, e essas
// duas situações ficariam indistinguíveis.
export function signQrToken(ticketId: string): string {
  const signature = crypto.createHmac("sha256", SECRET).update(ticketId).digest("hex");
  return `${ticketId}.${signature}`;
}

export function verifyQrToken(token: string): { valid: boolean; ticketId?: string } {
  const parts = token.split(".");

  // Exige exatamente 2 partes — um token como "ticketId.assinatura.lixo"
  // não deve ser aceito só porque as duas primeiras partes batem. Sem essa
  // checagem, texto extra no final seria silenciosamente ignorado.
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [ticketId, signature] = parts;

  if (!ticketId || !signature) {
    return { valid: false };
  }

  const expected = crypto.createHmac("sha256", SECRET).update(ticketId).digest("hex");

  // Comparação em tempo constante — evita vazar informação sobre a
  // assinatura correta via diferença de tempo de resposta.
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  const valid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  return { valid, ticketId };
}
