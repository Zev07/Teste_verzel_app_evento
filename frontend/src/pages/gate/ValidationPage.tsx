import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Loader2, ScanLine, LogOut } from 'lucide-react';
import { api } from '../../services/api';
import { getApiError } from '../../utils/apiError';
import { useAuth } from '../../hooks/useAuth';

export const ValidationPage = () => {
  const { logout } = useAuth();
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    status: 'success' | 'error' | 'used'; 
    message: string; 
    ticketData?: any 
  } | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Bate na rota do back-end que valida o ingresso.
      // Se a sua rota for diferente (ex: POST /gate/validate), basta ajustar aqui!
      const response = await api.patch(`/tickets/${ticketId}/validate`);
      
      setResult({
        status: 'success',
        message: 'Ingresso válido! Entrada liberada.',
        ticketData: response.data
      });
      setTicketId(''); // Limpa o input rápido para o próximo da fila
      
    } catch (err: any) {
      const errorMsg = getApiError(err) || 'Ingresso inválido ou não encontrado.';
      
      // Lógica visual para ingresso duplicado/já usado
      if (errorMsg.toLowerCase().includes('utilizado') || errorMsg.toLowerCase().includes('used')) {
         setResult({
          status: 'used',
          message: 'ATENÇÃO: Este ingresso já foi validado anteriormente.',
        });
      } else {
        setResult({
          status: 'error',
          message: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col animate-in fade-in duration-300">
      
      {/* Header escuro para não ofuscar a visão do porteiro à noite */}
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
          <p className="text-gray-400 text-sm">Digite o código ou posicione o leitor.</p>
        </div>

        {/* Input Principal */}
        <form onSubmit={handleValidate} className="mb-8 relative">
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
            disabled={loading || !ticketId.trim()}
            className="w-full mt-4 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-lg flex items-center justify-center transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verificar'}
          </button>
        </form>

        {/* Área de Resultado Visuais Gigantes */}
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