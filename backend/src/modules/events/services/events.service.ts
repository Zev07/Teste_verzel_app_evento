import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { CreateEventInput, SearchEventsInput } from "../dtos/events.dto";

const prisma = new PrismaClient();

export const eventsService = {
  async create(organizerId: string, input: CreateEventInput) {
    return prisma.event.create({
      data: {
        externalId: input.externalId,
        title: input.title,
        type: input.type,
        description: input.description,
        imageUrl: input.imageUrl,
        date: input.date,
        location: input.location,
        capacity: input.capacity,
        price: input.price,
        reservationMode: input.reservationMode,
        organizerId,
      },
    });
  },

  async listPublished(filters: SearchEventsInput) {
    return prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        ...(filters.search && {
          title: { contains: filters.search, mode: "insensitive" },
        }),
        ...(filters.location && {
          location: { contains: filters.location, mode: "insensitive" },
        }),
        ...(filters.type && { type: filters.type }),
        ...(filters.dateFrom || filters.dateTo
          ? {
              date: {
                ...(filters.dateFrom && { gte: filters.dateFrom }),
                ...(filters.dateTo && { lte: filters.dateTo }),
              },
            }
          : {}),
        ...(filters.minPrice || filters.maxPrice
          ? {
              price: {
                ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
                ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
              },
            }
          : {}),
      },
      orderBy: { date: "asc" },
    });
  },

  async getById(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError("Evento não encontrado", 404);
    }

    const soldCount = await prisma.ticket.count({
      where: { eventId: id, status: { in: ["VALID", "USED"] } },
    });

    return { ...event, available: event.capacity - soldCount };
  },

  async listByOrganizer(organizerId: string) {
    return prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    });
  },

  async cancel(id: string, organizerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError("Evento não encontrado", 404);
    }

    // Checagem de posse: um organizador não pode cancelar evento de outro.
    if (event.organizerId !== organizerId) {
      throw new AppError("Você não tem permissão para alterar este evento", 403);
    }

    return prisma.event.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  },
};
