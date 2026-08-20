import { api } from './api';

export interface GateValidationResult {
  result: 'VALID' | 'ALREADY_USED' | 'WRONG_EVENT' | 'INVALID';
  ticket?: any; // Dados extras que a API pode devolver
}

export const gateService = {
  async validateTicket(eventId: string, qrToken: string): Promise<GateValidationResult> {
    const response = await api.post<GateValidationResult>('/gate/validate', { eventId, qrToken });
    return response.data;
  }
};