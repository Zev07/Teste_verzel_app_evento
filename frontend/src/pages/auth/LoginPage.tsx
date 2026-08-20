import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Ticket, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { getApiError } from '../../utils/apiError';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); // Nota: O ProtectedRoute lida com redirecionamentos baseado no role
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CLIENT'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

try {
      if (isRegistering) {
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
      }
      
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      // 1. Salva o usuário e o token no contexto
      login(response.data);
      
      // 2. Redireciona para a tela certa com base no cargo (Role)
      const userRole = response.data.user.role;
      
      if (userRole === 'ORGANIZER') {
        navigate('/organizer/dashboard');
      } else if (userRole === 'GATE') {
        navigate('/gate/validate');
      } else {
        navigate('/events'); // Rota padrão do Cliente
      }
      
    } catch (err) {
      setError(getApiError(err) || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-6">
            <Ticket size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            {isRegistering ? 'Crie sua conta' : 'Acesse a plataforma'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {isRegistering 
              ? 'Junte-se a nós para comprar ingressos ou criar eventos.' 
              : 'Insira suas credenciais para continuar.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="label-field">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className="input-field pl-11"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label-field">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="nome@exemplo.com"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field pl-11"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="label-field">Como deseja usar a plataforma?</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'CLIENT' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-medium text-sm
                    ${formData.role === 'CLIENT' 
                      ? 'border-brand-600 bg-brand-50 text-brand-700' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <Ticket size={18} />
                  Comprar
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'ORGANIZER' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-medium text-sm
                    ${formData.role === 'ORGANIZER' 
                      ? 'border-brand-600 bg-brand-50 text-brand-700' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <Briefcase size={18} />
                  Organizar
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <span className="flex items-center gap-2">
                {isRegistering ? 'Criar Conta' : 'Entrar'}
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="ml-2 font-bold text-brand-600 hover:text-brand-700 hover:underline transition-all"
            >
              {isRegistering ? 'Faça login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};