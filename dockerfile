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

# Define o comando padrão para iniciar o bot
CMD ["npm", "start"]