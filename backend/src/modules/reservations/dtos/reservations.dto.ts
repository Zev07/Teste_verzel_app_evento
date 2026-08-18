import { z } from "zod";

export const createReservationSchema = z.object({
  eventId: z.string().uuid("eventId inválido"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  // Permite forçar o resultado do pagamento simulado (útil para testar o
  // fluxo de recusa de forma determinística, sem depender de aleatoriedade).
  // Se omitido, o pagamento é aprovado.
  forceOutcome: z.enum(["APPROVED", "DECLINED"]).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
