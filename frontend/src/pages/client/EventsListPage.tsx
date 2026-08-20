import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Ticket, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Event } from '../../types';
import { getApiError } from '../../utils/apiError';
import { useAuth } from '../../hooks/useAuth';

export const EventsListPage = () => {
  const { logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Busca todos os eventos (o back-end idealmente já filtra os PUBLISHED)
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err) {
      setError(getApiError(err) || 'Erro ao carregar o catálogo de eventos.');
    } finally {
      setLoading(false);
    }
  };

  // Filtra os eventos no front-end com base na barra de busca
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12 animate-in fade-in duration-500">
      
      {/* Navbar minimalista (Opcional, mas dá um ar de App real) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600 font-black text-xl tracking-tight">
            <Ticket size={24} />
            <span>Eventix</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/my-tickets" className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors">
              Meus Ingressos
            </Link>
            <button onClick={logout} className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Hero Section & Busca */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Descubra eventos incríveis
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Garanta seu ingresso para os melhores shows e sessões de cinema da cidade.
          </p>
          
          <div className="max-w-xl mx-auto relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              placeholder="Buscar por nome ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-lg"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-3 border border-red-100 max-w-2xl mx-auto">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Grid de Eventos */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-600" size={40} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 card max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Nenhum evento encontrado</h3>
            <p className="text-gray-500 mt-2">Tente buscar com outros termos ou volte mais tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="card group hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {event.image_url ? (
                    <img 
                      src={event.image_url} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Calendar size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl font-bold text-gray-900 shadow-sm">
                    R$ {Number(event.price).toFixed(2).replace('.', ',')}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow space-y-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-brand-600 uppercase mb-2 block">
                      {event.type === 'SHOW' ? '🎸 Show' : '🍿 Cinema'}
                    </span>
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 leading-tight">
                      {event.title}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-500 flex-grow">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                      <span>{new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  <Link 
                    to={`/events/${event.id}`} 
                    className="w-full btn-outline flex items-center justify-between group-hover:bg-brand-600 group-hover:text-white transition-all mt-4"
                  >
                    Ver Detalhes
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};