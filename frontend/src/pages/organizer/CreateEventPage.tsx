import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, Image as ImageIcon, FileText, Users, DollarSign, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { getApiError } from '../../utils/apiError';

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    price: '',
    capacity: '',
    type: 'SHOW' as 'SHOW' | 'MOVIE',
    image_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ajustando os tipos dos dados antes de enviar para a API
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity, 10),
        // Convertendo a data local para o formato ISO que o Prisma/Postgres espera
        date: new Date(formData.date).toISOString(),
      };

      await api.post('/events', payload);
      
      // Sucesso! Volta pro Dashboard
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(getApiError(err) || 'Erro ao criar o evento. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link to="/organizer/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Criar Novo Evento</h1>
          <p className="text-gray-500 mt-1">Preencha os detalhes para publicar seu evento no catálogo.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Formulário */}
      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="label-field">Título do Evento</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Show de Rock épico"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="label-field">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field pl-11 appearance-none bg-white"
                >
                  <option value="SHOW">Show / Apresentação</option>
                  <option value="MOVIE">Cinema / Filme</option>
                </select>
              </div>
            </div>

            {/* Data e Hora */}
            <div>
              <label className="label-field">Data e Hora</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="datetime-local"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Localização */}
            <div className="md:col-span-2">
              <label className="label-field">Localização</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: Allianz Parque, São Paulo - SP"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Preço */}
            <div>
              <label className="label-field">Preço do Ingresso (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ex: 150.00"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Capacidade */}
            <div>
              <label className="label-field">Capacidade Total</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Ex: 5000"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* URL da Imagem */}
            <div className="md:col-span-2">
              <label className="label-field">URL da Imagem (Capa do Evento)</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="label-field">Descrição do Evento</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-gray-400" size={20} />
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Conte os detalhes épicos do seu evento..."
                  className="input-field pl-11 py-4"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link to="/organizer/dashboard" className="btn-outline">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Publicando...
                </>
              ) : (
                'Publicar Evento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};