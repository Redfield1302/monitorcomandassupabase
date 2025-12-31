# Use uma imagem Node.js oficial como base
FROM node:18-alpine AS builder

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie os arquivos de definição de dependências
COPY package.json package-lock.json* ./

# Instale as dependências de produção
RUN npm ci --only=production

# Copie o restante do código da aplicação
COPY . .

# Use uma imagem menor para a execução final
FROM node:18-alpine

WORKDIR /app

# Copie as dependências instaladas da fase de build
COPY --from=builder /app/node_modules ./node_modules

# Copie o código da aplicação da fase de build
COPY --from=builder /app ./

# Exponha a porta que a aplicação usará
EXPOSE 3002

# Defina o comando para iniciar a aplicação
CMD [ "node", "server.js" ]

