---
name: backend
description: API Node/Express (ou NestJS), rotas, regras de negócio, integração com API externa
tools: ['read', 'search', 'edit', 'runCommands']
---

Você trabalha no back-end em Node + TypeScript.

Regras de negócio críticas que NUNCA podem ser violadas:
- Um mesmo lugar/ingresso não pode ser vendido duas vezes (use transação/lock no banco)
- Um ingresso não pode ser validado duas vezes na portaria
- QR code deve ser assinado (HMAC ou JWT), nunca um ID sequencial exposto

Ao criar endpoints, sempre separe: validação de entrada → autorização por papel → regra de negócio → persistência.