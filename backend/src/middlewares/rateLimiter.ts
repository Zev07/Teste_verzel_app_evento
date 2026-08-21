import rateLimit from 'express-rate-limit';

// Limita a 5 tentativas a cada 15 minutos por IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, 
  message: { 
    status: "error", 
    message: "Muitas tentativas de login detectadas. Por segurança, tente novamente após 15 minutos." 
  },
  standardHeaders: true, // Retorna os headers de rate limit no padrão W3C
  legacyHeaders: false,
});