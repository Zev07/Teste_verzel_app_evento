import { api } from './api';
import { Ticket } from '../types';

export const ticketsService = {
  async getMyTickets(): Promise<Ticket[]> {
    const response = await api.get<Ticket[]>('/tickets/mine');
    return response.data;
  },
  async getTicketById(id: string): Promise<Ticket> {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },
  async shareTicket(id: string): Promise<{ shareToken: string }> {
    const response = await api.post<{ shareToken: string }>(`/tickets/${id}/share`);
    return response.data;
  },
  async getSharedTicket(token: string): Promise<any> {
    const response = await api.get(`/tickets/share/${token}`);
    return response.data;
  },
  validateTicket: async (ticketId: string) => {
    // Usamos PATCH ou POST dependendo da API, mas o padrão comum é PATCH para atualizar o status
    const response = await api.patch(`/tickets/${ticketId}/validate`);
    return response.data;
  }
};