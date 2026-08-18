import { AppError } from "../../../../utils/AppError";
import { logger } from "../../../../utils/logger";
import { CatalogItem, CatalogProvider } from "./catalog-provider.interface";

const BASE_URL = "https://api.themoviedb.org/3/search/movie";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface TmdbMovie {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
}

export const tmdbProvider: CatalogProvider = {
  async search(query: string, page = 1): Promise<CatalogItem[]> {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      throw new AppError("Integração com TMDb não configurada", 503);
    }

    const url = new URL(BASE_URL);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("page", String(page));

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      logger.error({ error }, "Falha de rede ao chamar TMDb");
      throw new AppError("Falha ao buscar catálogo do TMDb", 502);
    }

    if (!response.ok) {
      logger.error({ status: response.status }, "TMDb retornou erro");
      throw new AppError("Falha ao buscar catálogo do TMDb", 502);
    }

    const data = (await response.json()) as { results?: TmdbMovie[] };
    const movies = data.results ?? [];

    return movies.map((movie) => ({
      externalId: String(movie.id),
      title: movie.title,
      type: "MOVIE",
      description: movie.overview || null,
      imageUrl: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
      // TMDb só fornece data de lançamento do filme, não horário de sessão —
      // não faz sentido usar como data sugerida do evento (a sessão quem
      // define é o organizador, ao criar o evento no cinema dele).
      suggestedDate: null,
      suggestedLocation: null,
    }));
  },
};
