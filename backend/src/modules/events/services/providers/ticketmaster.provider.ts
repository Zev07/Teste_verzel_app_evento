import { AppError } from "../../../../utils/AppError";
import { logger } from "../../../../utils/logger";
import { CatalogItem, CatalogProvider } from "./catalog-provider.interface";

const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

interface TicketmasterEvent {
  id: string;
  name: string;
  images?: { url: string }[];
  dates?: { start?: { dateTime?: string } };
  _embedded?: {
    venues?: { name: string; city?: { name: string } }[];
  };
}

export const ticketmasterProvider: CatalogProvider = {
  async search(query: string, page = 0): Promise<CatalogItem[]> {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
      throw new AppError("Integração com Ticketmaster não configurada", 503);
    }

    const url = new URL(BASE_URL);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("keyword", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", "20");

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      logger.error({ error }, "Falha de rede ao chamar Ticketmaster");
      throw new AppError("Falha ao buscar catálogo do Ticketmaster", 502);
    }

    if (!response.ok) {
      logger.error({ status: response.status }, "Ticketmaster retornou erro");
      throw new AppError("Falha ao buscar catálogo do Ticketmaster", 502);
    }

    const data = (await response.json()) as {
      _embedded?: { events?: TicketmasterEvent[] };
    };

    const events = data._embedded?.events ?? [];

    return events.map((event) => {
      const venue = event._embedded?.venues?.[0];
      return {
        externalId: event.id,
        title: event.name,
        type: "SHOW",
        description: null,
        imageUrl: event.images?.[0]?.url ?? null,
        suggestedDate: event.dates?.start?.dateTime ?? null,
        suggestedLocation: venue
          ? [venue.name, venue.city?.name].filter(Boolean).join(" — ")
          : null,
      };
    });
  },
};
