import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { signQrToken } from "../../../utils/qrToken";
import { CreateReservationInput } from "../dtos/reservations.dto";

const prisma = new PrismaClient();

interface EventRow {
  id: string;
  capacity: number;
  price: string; // Decimal vem como string via $queryRaw
  status: string;
  date: Date;
}

export const reservationsService = {
  async create(clientId: string, input: CreateReservationInput) {
    return prisma.$transaction(async (tx) => {
      // SELECT ... FOR UPDATE trava a linha do evento até o fim da transação.
      // Se dois clientes reservarem o mesmo evento ao mesmo tempo, a segunda
      // transação espera a primeira terminar antes de ler a contagem de
      // ingressos vendidos — sem isso, as duas poderiam ler "5 disponíveis"
      // ao mesmo tempo e juntas venderem mais do que existe.
      const rows = await tx.$queryRaw<EventRow[]>`
        SELECT id, capacity, price, status, date FROM events WHERE id = ${input.eventId} FOR UPDATE
      `;
      const event = rows[0];

      if (!event) {
        throw new AppError("Evento não encontrado", 404);
      }

      if (event.status !== "PUBLISHED") {
        throw new AppError("Evento não está disponível para reserva", 400);
      }

      if (new Date(event.date).getTime() < Date.now()) {
        throw new AppError("Este evento já ocorreu", 400);
      }

      const soldCount = await tx.ticket.count({
        where: { eventId: input.eventId, status: { in: ["VALID", "USED"] } },
      });
      const available = event.capacity - soldCount;

      if (input.quantity > available) {
        throw new AppError(
          `Apenas ${available} ingresso(s) disponível(is) para este evento`,
          409
        );
      }

      const totalPrice = Number(event.price) * input.quantity;

      const reservation = await tx.reservation.create({
        data: {
          clientId,
          eventId: input.eventId,
          quantity: input.quantity,
          totalPrice,
          status: "PENDING",
        },
      });

      const paymentStatus = input.forceOutcome ?? "APPROVED";

      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          status: paymentStatus,
          method: "simulado",
        },
      });

      if (paymentStatus === "DECLINED") {
        const declinedReservation = await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: "DECLINED" },
        });
        return { reservation: declinedReservation, payment, tickets: [] };
      }

      const paidReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "PAID" },
      });

      // Um Ticket por unidade — cada um com QR assinado individualmente,
      // já que a portaria valida ingresso por ingresso, não a reserva inteira.
      const tickets = [];
      for (let i = 0; i < input.quantity; i++) {
        const ticketId = randomUUID();
        const qrToken = signQrToken(ticketId);
        const ticket = await tx.ticket.create({
          data: {
            id: ticketId,
            reservationId: reservation.id,
            eventId: input.eventId,
            qrToken,
            status: "VALID",
          },
        });
        tickets.push(ticket);
      }

      return { reservation: paidReservation, payment, tickets };
    });
  },

  async listMine(clientId: string) {
    return prisma.reservation.findMany({
      where: { clientId },
      include: { event: true, payment: true, tickets: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, clientId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { event: true, payment: true, tickets: true },
    });

    if (!reservation) {
      throw new AppError("Reserva não encontrada", 404);
    }

    if (reservation.clientId !== clientId) {
      throw new AppError("Você não tem permissão para ver esta reserva", 403);
    }

    return reservation;
  },
};
