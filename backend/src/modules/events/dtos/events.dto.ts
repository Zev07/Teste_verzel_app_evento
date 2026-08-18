import { z } from "zod";

export const catalogSearchSchema = z.object({
  source: z.enum(["ticketmaster", "tmdb"]),
  query: z.string().min(1, "Informe um termo de busca"),
  page: z.coerce.number().int().min(0).optional(),
});

export const createEventSchema = z.object({
  externalId: z.string().optional(),
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres"),
  type: z.enum(["SHOW", "MOVIE"]),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  date: z.coerce.date().refine((d) => d > new Date(), {
    message: "A data do evento deve ser no futuro",
  }),
  location: z.string().min(2, "Local é obrigatório"),
  capacity: z.coerce.number().int().positive("Capacidade deve ser maior que zero"),
  price: z.coerce.number().nonnegative("Preço não pode ser negativo"),
  // MVP cobre o modo QUANTITY; SEAT_MAP é suportado no schema do banco mas
  // a criação de assentos em si fica para uma fase posterior (ver docs/MODELAGEM.md).
  reservationMode: z.enum(["QUANTITY", "SEAT_MAP"]).default("QUANTITY"),
});

export const searchEventsSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["SHOW", "MOVIE"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;
