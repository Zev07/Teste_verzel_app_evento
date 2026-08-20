import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Loader2, AlertCircle, CheckCircle, Ticket } from 'lucide-react';
import { api } from '../../services/api';
import { Event } from '../../types';
import { getApiError } from '../../utils/apiError';

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (err) {
      setError(getApiError(err) || 'Erro ao carregar os detalhes do evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async () => {
    try {
      setReserving(true);
      setError('');
      
      // Bate na rota de criar reserva (ajuste o endpoint conforme o seu back-end)
      await api.post('/reservations', {
        eventId: id,
        quantity: quantity
      });
      
      setSuccess(true);
      
      // Aguarda 2 segundos para o usuário ler a mensagem de sucesso e manda pros ingressos
      setTimeout(() => {
        navigate('/my-tickets');
      }, 2000);
      
    } catch (err) {
      setError(getApiError(err) || 'Não foi possível realizar a reserva.');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-600" size={48} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Evento não encontrado</h2>
        <Link to="/events" className="btn-primary mt-4">Voltar ao Catálogo</Link>
      </div>
    );
  }

  // Fallback de assentos (caso availableSeats não venha na requisição, usa a capacity)
  const seatsAvailable = event.availableSeats !== undefined ? event.availableSeats : event.capacity;
  const isSoldOut = seatsAvailable === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 animate-in fade-in duration-500">
      
      {/* Banner Superior */}
      <div className="h-64 md:h-96 w-full bg-gray-900 relative">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-brand-900 opacity-80 flex items-center justify-center">
            <Ticket size={80} className="text-white/20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <Link to="/events" className="w-fit flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold mb-2">
              <ArrowLeft size={16} />
              Voltar aos eventos
            </Link>
            <span className="w-fit px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              {event.type === 'SHOW' ? '🎸 Show' : '🍿 Cinema'}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda: Detalhes */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Sobre o evento</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-lg">
                {event.description}
              </p>
            </div>
            
            <div className="card p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informações</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Data e Hora</p>
                    <p className="text-gray-500 mt-1">{new Date(event.date).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Localização</p>
                    <p className="text-gray-500 mt-1">{event.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Card de Compra */}
          <div className="lg:col-span-1 relative">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ingressos</h3>
              
              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 font-medium">Valor unitário</span>
                  <span className="text-2xl font-black text-brand-600">
                    R$ {Number(event.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
                  <Users size={16} />
                  <span>{seatsAvailable} assentos disponíveis</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success ? (
                <div className="p-6 bg-green-50 rounded-xl text-center border border-green-100 animate-in zoom-in duration-300">
                  <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                  <h4 className="font-bold text-green-800">Reserva Confirmada!</h4>
                  <p className="text-green-600 text-sm mt-1">Redirecionando para seus ingressos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label-field text-xs">Quantidade</label>
                    <select 
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="input-field"
                      disabled={isSoldOut}
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} ingresso{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleReservation}
                    disabled={reserving || isSoldOut}
                    className="btn-primary w-full text-lg py-4"
                  >
                    {reserving ? (
                      <Loader2 className="animate-spin mx-auto" size={24} />
                    ) : isSoldOut ? (
                      'Esgotado'
                    ) : (
                      `Comprar por R$ ${(Number(event.price) * quantity).toFixed(2).replace('.', ',')}`
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};