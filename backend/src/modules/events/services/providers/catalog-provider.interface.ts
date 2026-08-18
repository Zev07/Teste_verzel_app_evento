// Formato normalizado, independente da API de origem. O resto do sistema
// (service de eventos, controllers) nunca precisa saber se o item veio do
// Ticketmaster ou do TMDb — só enxerga este shape.
export interface CatalogItem {
  externalId: string;
  title: string;
  type: "SHOW" | "MOVIE";
  description: string | null;
  imageUrl: string | null;
  suggestedDate: string | null; // ISO date, quando a origem já sugere uma data/hora
  suggestedLocation: string | null;
}

export interface CatalogProvider {
  search(query: string, page?: number): Promise<CatalogItem[]>;
}
