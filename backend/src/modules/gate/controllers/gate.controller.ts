import { Request, Response } from "express";
import { gateService } from "../services/gate.service";

export const gateController = {
  async validate(req: Request, res: Response) {
    // Sempre 200: os 4 resultados possíveis (válido, inválido, já usado,
    // evento errado) são respostas de negócio legítimas dessa consulta, não
    // erros de protocolo HTTP — a portaria trata todos da mesma forma no
    // corpo da resposta (campo "result"), então não há ganho em espalhar
    // isso por múltiplos status code.
    const result = await gateService.validate(req.user!.id, req.body);
    res.status(200).json(result);
  },
};
