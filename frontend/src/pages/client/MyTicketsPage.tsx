import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Loader2, AlertCircle, QrCode } from 'lucide-react';
import { api } from '../../services/api';
import { Ticket as TicketType } from '../../types';
import { getApiError } from '../../utils/apiError';

export const MyTicketsPage = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      // Rota padrão para buscar os ingressos do usuário logado. 
      // Se a sua API usar '/reservations/mine', você pode ajustar aqui.
      const response = await api.get('/tickets/mine');
      setTickets(response.data);
    } catch (err) {
      setError(getApiError(err) || 'Erro ao carregar seus ingressos.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Válido</span>;
      case 'USED':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Utilizado</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Cancelado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12 animate-in fade-in duration-500">
      
      {/* Header Simples */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <Ticket size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meus Ingressos</h1>
              <p className="text-gray-500 mt-1">Apresente o QR Code na portaria do evento.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100 mb-8">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-600" size={40} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 card">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Nenhum ingresso encontrado</h3>
            <p className="text-gray-500 mt-2">Você ainda não possui ingressos para eventos.</p>
            <Link to="/events" className="btn-primary mt-6 inline-flex">
              Explorar Eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card flex flex-col md:flex-row overflow-hidden relative group">
                
                {/* Lado Esquerdo: Detalhes do Evento */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-200 border-dashed">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold tracking-wider text-brand-600 uppercase">
                      Ingresso Padrão
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4">
                      {ticket.reservation?.event?.title || 'Evento Indisponível'}
                    </h3>
                    
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-400" />
                        <span>
                          {ticket.reservation?.event?.date 
                            ? new Date(ticket.reservation.event.date).toLocaleString('pt-BR') 
                            : 'Data a confirmar'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-gray-400" />
                        <span className="truncate">
                          {ticket.reservation?.event?.location || 'Local a confirmar'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: QR Code */}
                <div className="w-full md:w-64 bg-gray-50 p-6 flex flex-col items-center justify-center relative">
                  {/* Círculos decorativos do ticket */}
                  <div className="hidden md:block w-8 h-8 bg-gray-50 rounded-full absolute -left-4 top-1/2 -translate-y-1/2 border-r border-gray-200 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.02)]"></div>
                  
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3">
                    {ticket.qrCode ? (
                      <img src={ticket.qrCode} alt="QR Code" className="w-32 h-32 object-contain" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 flex flex-col items-center justify-center text-gray-400 rounded-lg">
                        <QrCode size={40} className="mb-2" opacity={0.5} />
                        <span className="text-xs text-center px-2">QR Code Indisponível</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs font-mono text-gray-400 text-center uppercase tracking-widest truncate w-full">
                    {ticket.id.split('-')[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};