FROM node:20-alpine

# O Alpine não vem com OpenSSL por padrão, e o engine do Prisma depende dele
# para funcionar corretamente (sem isso, o schema engine falha ao iniciar).
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3333

# Roda migrations pendentes e só então inicia o servidor.
# Garante que o container nunca sobe com schema desatualizado.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
