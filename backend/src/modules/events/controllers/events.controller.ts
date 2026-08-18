import { Request, Response } from "express";
import { catalogService } from "../services/catalog.service";
import { eventsService } from "../services/events.service";

export const eventsController = {
  async searchCatalog(req: Request, res: Response) {
    const { source, query, page } = req.query as unknown as {
      source: "ticketmaster" | "tmdb";
      query: string;
      page?: number;
    };
    const results = await catalogService.search(source, query, page);
    res.status(200).json(results);
  },

  async create(req: Request, res: Response) {
    const event = await eventsService.create(req.user!.id, req.body);
    res.status(201).json(event);
  },

  async list(req: Request, res: Response) {
    const events = await eventsService.listPublished(req.query as any);
    res.status(200).json(events);
  },

  async getById(req: Request, res: Response) {
    const event = await eventsService.getById(req.params.id);
    res.status(200).json(event);
  },

  async listMine(req: Request, res: Response) {
    const events = await eventsService.listByOrganizer(req.user!.id);
    res.status(200).json(events);
  },

  async cancel(req: Request, res: Response) {
    const event = await eventsService.cancel(req.params.id, req.user!.id);
    res.status(200).json(event);
  },
};
