import { api } from './api';
import { Event } from '../types';

export const eventsService = {
  async getCatalog(query: string, source: 'ticketmaster' | 'tmdb' = 'ticketmaster'): Promise<Event[]> {
    const response = await api.get<Event[]>('/events/catalog', { params: { query, source } });
    return response.data;
  },
  async getMyEvents(): Promise<Event[]> {
    const response = await api.get<Event[]>('/events/mine');
    return response.data;
  },
  async getPublishedEvents(params?: any): Promise<Event[]> {
    const response = await api.get<Event[]>('/events', { params });
    return response.data;
  },
  async getEventById(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },
  async createEvent(data: Partial<Event>): Promise<Event> {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },
  async cancelEvent(id: string): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}/cancel`);
    return response.data;
  }
};