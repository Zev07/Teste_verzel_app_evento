import { z } from "zod";

export const shareTicketParamsSchema = z.object({
  id: z.string().uuid("id inválido"),
});
