import { AppError } from "../../../utils/AppError";
import { ticketmasterProvider } from "./providers/ticketmaster.provider";
import { tmdbProvider } from "./providers/tmdb.provider";
import { CatalogProvider } from "./providers/catalog-provider.interface";

const providers: Record<string, CatalogProvider> = {
  ticketmaster: ticketmasterProvider,
  tmdb: tmdbProvider,
};

export const catalogService = {
  async search(source: string, query: string, page?: number) {
    const provider = providers[source];

    if (!provider) {
      throw new AppError(`Fonte de catálogo desconhecida: ${source}`, 400);
    }

    return provider.search(query, page);
  },
};
