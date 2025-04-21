# Usa a imagem base do Node.js
FROM node:20.19.0-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos do projeto para o contêiner
COPY . .

# Instala as dependências
RUN npm install

# Compila o TypeScript
RUN npm run build

# Comando padrão para iniciar o contêiner
CMD ["npm", "start"]