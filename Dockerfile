FROM node:20-bullseye AS builder

# Preparar o diretório de trabalho
WORKDIR /app

# Copiar os arquivos de configuração do package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o resto dos arquivos da aplicação (exceto node_modules)
COPY . .

# Configurar variáveis de ambiente para o build
ENV NODE_ENV=production
ENV FORCE_DEV_MODE=true

# Primeiro vamos construir somente o frontend (vite)
RUN npx vite build

# Agora vamos criar o bundle do backend, garantindo que utiliza a versão compatível
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Nova fase - imagem final
FROM node:20-bullseye

# Atualizar pacotes e instalar dependências necessárias para o WhatsApp Web.js
RUN apt-get update \
    && apt-get install -y wget gnupg curl dumb-init \
    && mkdir -p /usr/share/keyrings \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        libxss1 \
        libxtst6 \
        libatk-bridge2.0-0 \
        libgtk-3-0 \
        libasound2 \
        libgbm1 \
        libnss3 \
        libxshmfence1 \
        ca-certificates \
        fonts-liberation \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
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
        xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis de ambiente para o Puppeteer e sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
ENV PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu"

# Configurar o diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
# Usar npm install em vez de npm ci para garantir que as novas dependências sejam adicionadas
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Construir o aplicativo
RUN npm run build

# Expor a porta que o aplicativo usará
EXPOSE 5000

# Criar diretório para dados de autenticação WhatsApp
RUN mkdir -p /app/whatsapp-auth && chmod -R 777 /app/whatsapp-auth

# Definir variável de ambiente para produção
ENV NODE_ENV=production
ENV PORT=5000

# Copiar e tornar executável o script de inicialização
COPY startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Comando para iniciar o aplicativo usando o script
CMD ["/app/startup.sh"]
