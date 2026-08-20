import { api } from './api';
import { Reservation } from '../types';

export const reservationsService = {
  // forceOutcome é usado para testar a recusa do cartão (status 402)
  async createReservation(eventId: string, quantity: number, forceOutcome?: 'DECLINED'): Promise<Reservation> {
    const response = await api.post<Reservation>('/reservations', { eventId, quantity, forceOutcome });
    return response.data;
  },
  async getMyReservations(): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>('/reservations/mine');
    return response.data;
  },
  async getReservationById(id: string): Promise<Reservation> {
    const response = await api.get<Reservation>(`/reservations/${id}`);
    return response.data;
  }
};