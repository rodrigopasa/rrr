FROM node:20 AS base

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências necessárias para o Puppeteer
RUN apt-get update && \
    apt-get install -y \
    chromium \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    fonts-noto-color-emoji \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Definir variáveis de ambiente para puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

FROM base AS deps

# Copiar somente os arquivos necessários para instalar as dependências
COPY package.json package-lock.json ./

# Instalar todas as dependências incluindo devDependencies
RUN npm ci

FROM base AS builder

# Copiar os arquivos de dependências instalados
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir a aplicação (NODE_ENV=development para que as devDependencies estejam disponíveis)
ENV NODE_ENV=development
RUN npm run build

FROM base AS runner

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production

# Copiar arquivos necessários
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY .env-example .env

# Copiar arquivos de configuração necessários
COPY docker-healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-healthcheck.sh

# Expor a porta que a aplicação usa
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "docker-healthcheck.sh" ]

# Iniciar a aplicação
CMD ["npm", "start"]