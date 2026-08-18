import { Request, Response } from "express";
import { reservationsService } from "../services/reservations.service";

export const reservationsController = {
  async create(req: Request, res: Response) {
    const result = await reservationsService.create(req.user!.id, req.body);
    // 402 quando o pagamento simulado foi recusado — mantém 201 só para
    // reserva efetivamente confirmada com ingressos emitidos.
    const status = result.payment.status === "DECLINED" ? 402 : 201;
    res.status(status).json(result);
  },

  async listMine(req: Request, res: Response) {
    const reservations = await reservationsService.listMine(req.user!.id);
    res.status(200).json(reservations);
  },

  async getById(req: Request, res: Response) {
    const reservation = await reservationsService.getById(req.params.id, req.user!.id);
    res.status(200).json(reservation);
  },
};
