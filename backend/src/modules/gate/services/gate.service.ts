import { PrismaClient } from "@prisma/client";
import { verifyQrToken } from "../../../utils/qrToken";
import { ValidateTicketInput } from "../dtos/gate.dto";

const prisma = new PrismaClient();

export type ValidationResult = "VALID" | "ALREADY_USED" | "WRONG_EVENT" | "INVALID";

interface TicketRow {
  id: string;
  eventId: string;
  status: string;
}

export const gateService = {
  async validate(gateUserId: string, input: ValidateTicketInput) {
    const { valid, ticketId } = verifyQrToken(input.qrToken);

    if (!valid || !ticketId) {
      return { result: "INVALID" as ValidationResult, message: "Código inválido ou corrompido" };
    }

    return prisma.$transaction(async (tx) => {
      // Lock na linha do ingresso: se o mesmo QR for escaneado duas vezes
      // quase ao mesmo tempo (ex: duas catracas, ou o usuário insistindo no
      // scanner), a segunda leitura espera a primeira terminar e encontra o
      // ingresso já como USED — não corre o risco de ambas passarem juntas.
      const rows = await tx.$queryRaw<TicketRow[]>`
        SELECT id, event_id as "eventId", status FROM tickets WHERE id = ${ticketId} FOR UPDATE
      `;
      const ticket = rows[0];

      if (!ticket) {
        return { result: "INVALID" as ValidationResult, message: "Ingresso não encontrado" };
      }

      if (ticket.eventId !== input.eventId) {
        return {
          result: "WRONG_EVENT" as ValidationResult,
          message: "Este ingresso é de outro evento",
        };
      }

      if (ticket.status === "USED") {
        return {
          result: "ALREADY_USED" as ValidationResult,
          message: "Este ingresso já foi utilizado",
        };
      }

      if (ticket.status === "CANCELLED") {
        return { result: "INVALID" as ValidationResult, message: "Este ingresso foi cancelado" };
      }

      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "USED", usedAt: new Date(), validatedBy: gateUserId },
      });

      return {
        result: "VALID" as ValidationResult,
        message: "Ingresso válido — entrada liberada",
        ticket: updatedTicket,
      };
    });
  },
};
