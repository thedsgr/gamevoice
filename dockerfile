# Etapa 1: Imagem base para o build
FROM node:20-alpine AS build

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos necessários para o contêiner
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Instala as dependências
RUN npm install

# Compila o TypeScript
RUN npm run build

# Etapa 2: Imagem final para execução
FROM node:20-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos compilados e dependências para o contêiner final
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Instala apenas as dependências de produção
RUN npm install --omit=dev

# Comando para iniciar o bot
CMD ["node", "dist/index.js"]