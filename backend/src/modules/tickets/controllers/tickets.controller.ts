import { Request, Response } from "express";
import { ticketsService } from "../services/tickets.service";

export const ticketsController = {
  async listMine(req: Request, res: Response) {
    const tickets = await ticketsService.listMine(req.user!.id);
    res.status(200).json(tickets);
  },

  async getById(req: Request, res: Response) {
    const ticket = await ticketsService.getById(req.params.id, req.user!.id);
    res.status(200).json(ticket);
  },

  async share(req: Request, res: Response) {
    const result = await ticketsService.createShare(req.params.id, req.user!.id);
    res.status(201).json(result);
  },

  // Rota pública — quem recebeu o link não está autenticado.
  async getByShareToken(req: Request, res: Response) {
    const result = await ticketsService.getByShareToken(req.params.token);
    res.status(200).json(result);
  },
};
