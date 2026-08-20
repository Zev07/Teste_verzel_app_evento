// Exportando o tipo Role (Resolve Erro 4)
export type Role = 'ORGANIZER' | 'CLIENT' | 'GATE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Exportando o AuthResponse (Resolve Erros 1 e 5)
export interface AuthResponse {
  token: string;
  user: User;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  status: 'PUBLISHED' | 'CANCELLED';
  type?: 'SHOW' | 'MOVIE';
  capacity?: number;
  totalSeats?: number; // Adicionado (Resolve Erro 3)
  availableSeats?: number;
  image_url?: string;
}

export interface Reservation {
  id: string;
  eventId: string;
  clientId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'PAID' | 'DECLINED' | 'CANCELLED';
  event?: Event;
}

export interface Ticket {
  id: string;
  reservationId: string;
  eventId: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  qrCode?: string;
  qr_token?: string;
  reservation?: Reservation;
}