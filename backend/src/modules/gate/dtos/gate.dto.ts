import { z } from "zod";

export const validateTicketSchema = z.object({
  eventId: z.string().uuid("eventId inválido"),
  // Mesmo campo serve tanto para leitura via câmera (QR decodificado)
  // quanto para digitação manual — o formato do token é o mesmo nos dois casos.
  qrToken: z.string().min(1, "Código do ingresso é obrigatório"),
});

export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;
