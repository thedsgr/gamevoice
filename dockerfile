# Estágio de construção (builder)
FROM node:20.20.1-alpine@sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890 AS builder
WORKDIR /app

# 1. Copia arquivos necessários para instalação
COPY package*.json tsconfig.json ./

# 2. Instala dependências (incluindo devDependencies)
RUN npm install --include=dev

# 3. Copia o restante e compila
COPY src ./src
RUN npm run build

# Estágio de produção (imagem final)
FROM node:20.20.1-alpine@sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
WORKDIR /app

# 4. Copia apenas o essencial (corrigindo o erro de COPY)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/.env .env

# 5. Configura permissões
RUN mkdir -p /data && \
    touch /data/db.json && \
    chown -R node:node /data /app

# 6. Executa como usuário não-root
USER node

CMD ["node", "dist/index.js"]