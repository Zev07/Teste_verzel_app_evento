import { AxiosError } from 'axios';

export const getApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Busca a estrutura de erro que definimos no backend: { error: { message: '...' } }
    return error.response?.data?.error?.message || error.message || 'Erro inesperado na API';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro desconhecido.';
};