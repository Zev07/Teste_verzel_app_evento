import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Ticket, MapPin, Users, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Event } from '../../types';
import { getApiError } from '../../utils/apiError';

export const DashboardPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/mine');
      setEvents(response.data);
    } catch (err) {
      setError(getApiError(err) || 'Erro ao carregar seus eventos.');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos rápidos para o painel de estatísticas
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'PUBLISHED').length;
  const totalCapacity = events.reduce((acc, curr) => acc + (curr.capacity || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel do Organizador</h1>
          <p className="text-gray-500 mt-1">Gerencie seus eventos e acompanhe as vendas.</p>
        </div>
        <Link to="/organizer/events/new" className="btn-primary whitespace-nowrap">
          <Plus size={20} className="mr-2" />
          Criar Novo Evento
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Total de Eventos</p>
            <p className="text-2xl font-black text-gray-900">{totalEvents}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Eventos Ativos</p>
            <p className="text-2xl font-black text-gray-900">{activeEvents}</p>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Capacidade Total</p>
            <p className="text-2xl font-black text-gray-900">{totalCapacity}</p>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Meus Eventos</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-brand-600" size={32} />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Nenhum evento criado</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">Você ainda não possui eventos cadastrados. Clique no botão acima para criar o seu primeiro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="group border border-gray-100 rounded-xl overflow-hidden hover:border-brand-200 hover:shadow-md transition-all">
                  <div className="h-32 bg-gray-100 relative">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Calendar size={32} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {event.status === 'PUBLISHED' ? 'Ativo' : 'Cancelado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-gray-900 truncate" title={event.title}>{event.title}</h3>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brand-500" />
                        <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-brand-500" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-brand-500" />
                        <span>
                          {event.availableSeats !== undefined ? event.availableSeats : event.capacity} / {event.capacity} disponíveis
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};