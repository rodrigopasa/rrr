FROM node:20-slim AS builder

# Instalar dependências necessárias para o Puppeteer
RUN apt-get update && \
    apt-get install -y \
    chromium \
    wget \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Definir variáveis de ambiente para puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Definir diretório de trabalho
WORKDIR /app

# Copiar os arquivos de package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o resto dos arquivos
COPY . .

# Construir a aplicação
RUN npm run build

FROM node:20-slim AS runner

# Instalar dependências necessárias para o Puppeteer
RUN apt-get update && \
    apt-get install -y \
    chromium \
    wget \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Definir variáveis de ambiente
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium
ENV NODE_ENV production

# Definir diretório de trabalho
WORKDIR /app

# Copiar package*.json
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar a build da etapa anterior
COPY --from=builder /app/dist ./dist
COPY .env-example .env

# Copiar arquivos de configuração necessários
COPY docker-healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-healthcheck.sh

# Expor a porta que a aplicação usa
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "docker-healthcheck.sh" ]

# Iniciar a aplicação
CMD ["npm", "start"]