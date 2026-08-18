import { randomUUID } from "crypto";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/AppError";

const prisma = new PrismaClient();

const SHARE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function attachQrImage<T extends { qrToken: string }>(ticket: T) {
  // Gerado sob demanda a partir do qrToken já assinado, nunca armazenado —
  // a imagem é só uma representação visual do mesmo dado que já está no banco.
  const qrImage = await QRCode.toDataURL(ticket.qrToken);
  return { ...ticket, qrImage };
}

export const ticketsService = {
  async listMine(clientId: string) {
    const tickets = await prisma.ticket.findMany({
      where: { reservation: { clientId } },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(tickets.map(attachQrImage));
  },

  async getById(id: string, clientId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true, reservation: true },
    });

    if (!ticket) {
      throw new AppError("Ingresso não encontrado", 404);
    }

    if (ticket.reservation.clientId !== clientId) {
      throw new AppError("Você não tem permissão para ver este ingresso", 403);
    }

    return attachQrImage(ticket);
  },

  async createShare(ticketId: string, clientId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { reservation: true },
    });

    if (!ticket) {
      throw new AppError("Ingresso não encontrado", 404);
    }

    if (ticket.reservation.clientId !== clientId) {
      throw new AppError("Você não tem permissão para compartilhar este ingresso", 403);
    }

    if (ticket.status !== "VALID") {
      throw new AppError("Só é possível compartilhar ingressos válidos", 400);
    }

    const share = await prisma.ticketShare.create({
      data: {
        ticketId,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + SHARE_EXPIRATION_MS),
      },
    });

    return {
      shareUrl: `${FRONTEND_URL}/tickets/shared/${share.token}`,
      token: share.token,
      expiresAt: share.expiresAt,
    };
  },

  async getByShareToken(token: string) {
    const share = await prisma.ticketShare.findUnique({
      where: { token },
      include: { ticket: { include: { event: true } } },
    });

    if (!share) {
      throw new AppError("Link de compartilhamento não encontrado", 404);
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new AppError("Este link de compartilhamento expirou", 410);
    }

    const ticketWithQr = await attachQrImage(share.ticket);

    // Retorno propositalmente enxuto: quem recebe o link não precisa (e não
    // deveria) ver dados da reserva ou do cliente dono do ingresso original.
    return {
      ticketId: ticketWithQr.id,
      status: ticketWithQr.status,
      qrImage: ticketWithQr.qrImage,
      event: {
        title: share.ticket.event.title,
        date: share.ticket.event.date,
        location: share.ticket.event.location,
      },
    };
  },
};
