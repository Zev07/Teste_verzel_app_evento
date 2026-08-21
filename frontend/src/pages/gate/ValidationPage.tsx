import { useState, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Loader2, ScanLine, LogOut, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { getApiError } from '../../utils/apiError';
import { useAuth } from '../../hooks/useAuth';
import { Event } from '../../types';

export const ValidationPage = () => {
  const { logout } = useAuth();
  
  // Novos estados para lidar com a seleção do evento
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [fetchingEvents, setFetchingEvents] = useState(true);

  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    status: 'success' | 'error' | 'used'; 
    message: string; 
  } | null>(null);

  // Busca os eventos assim que o porteiro abre o app
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Se a sua rota de listar eventos for diferente, ajuste aqui
        const response = await api.get('/events');
        setEvents(response.data);
        if (response.data.length > 0) {
          setSelectedEventId(response.data[0].id); // Seleciona o primeiro por padrão
        }
      } catch (err) {
        console.error("Erro ao carregar eventos para a portaria", err);
      } finally {
        setFetchingEvents(false);
      }
    };
    fetchEvents();
  }, []);

const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim() || !selectedEventId) return;

    setLoading(true);
    setResult(null);

    try {
      // Faz o POST (o Axios vai receber 200 OK e cair aqui dentro)
      const response = await api.post('/gate/validate', {
        eventId: selectedEventId,
        qrToken: ticketId
      });
      
      // Extrai o resultado exato que o seu service mandou
      const { result: validationResult, message } = response.data;

      // Traduz o resultado do Back-end para o visual do Front-end
      if (validationResult === 'VALID') {
        setResult({ status: 'success', message });
        setTicketId(''); // Limpa o campo só se for sucesso
      } 
      else if (validationResult === 'ALREADY_USED') {
        setResult({ status: 'used', message });
        setTicketId('');
      } 
      else {
        // WRONG_EVENT ou INVALID
        setResult({ status: 'error', message });
      }
      
    } catch (err: any) {
      // Esse catch agora só vai disparar se a API cair (500) ou der Rate Limit (429)
      const errorMsg = getApiError(err) || 'Erro ao comunicar com o servidor.';
      setResult({ status: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col animate-in fade-in duration-300">
      
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-gray-300">
          <ScanLine size={24} className="text-brand-500" />
          <h1 className="font-bold text-lg tracking-tight">Controle de Acesso</h1>
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full">
        
        <div className="text-center mt-4 mb-8">
          <h2 className="text-2xl font-black mb-2">Validar Ingresso</h2>
          <p className="text-gray-400 text-sm">Selecione o evento e bipe o ingresso.</p>
        </div>

        <form onSubmit={handleValidate} className="mb-8 space-y-4">
          
          {/* Seletor de Evento */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={fetchingEvents || events.length === 0}
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-2xl outline-none focus:border-brand-500 text-gray-200 appearance-none transition-all"
            >
              {fetchingEvents ? (
                <option>Carregando eventos...</option>
              ) : events.length === 0 ? (
                <option>Nenhum evento disponível</option>
              ) : (
                events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Input do QR Code */}
          <div className="relative">
            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              required
              autoFocus
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Código do ingresso..."
              className="w-full pl-14 pr-4 py-5 bg-gray-800 border-2 border-gray-700 rounded-2xl outline-none focus:border-brand-500 focus:bg-gray-900 text-xl font-mono uppercase tracking-widest text-center transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !ticketId.trim() || !selectedEventId}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-lg flex items-center justify-center transition-all disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verificar'}
          </button>
        </form>

        {/* Feedback Visual */}
        {result && (
          <div className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
            result.status === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' :
            result.status === 'used' ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400' :
            'bg-red-900/20 border-red-500/50 text-red-400'
          }`}>
            {result.status === 'success' && <CheckCircle size={64} className="mb-4 text-green-500" />}
            {result.status === 'used' && <AlertTriangle size={64} className="mb-4 text-yellow-500" />}
            {result.status === 'error' && <XCircle size={64} className="mb-4 text-red-500" />}
            
            <h3 className="text-xl font-black uppercase tracking-wider mb-2">
              {result.status === 'success' ? 'LIBERADO' : result.status === 'used' ? 'JÁ UTILIZADO' : 'INVÁLIDO'}
            </h3>
            <p className="font-medium opacity-90">{result.message}</p>
          </div>
        )}
      </main>
    </div>
  );
};