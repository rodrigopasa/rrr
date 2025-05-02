# Guia de Implantação do AutomizAP

## Requisitos do Sistema

Para executar o AutomizAP em um ambiente de produção, você precisa ter instalado:

1. Node.js 18+ (recomendado: 20.x)
2. PostgreSQL 14+ para armazenamento de dados
3. Chromium/Chrome para o suporte ao WhatsApp Web.js
4. Dependências do sistema para o Puppeteer

## Instalação de Dependências do Sistema

### No Ubuntu/Debian

```bash
# Instalar dependências necessárias para o Puppeteer e Chromium
sudo apt-get update
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
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
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget
```

### No CentOS/RHEL

```bash
sudo yum install pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 ipa-gothic-fonts xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc
```

## Configuração do Banco de Dados

1. Crie um banco de dados PostgreSQL para o AutomizAP:

```bash
createdb automizap
```

2. Configure as variáveis de ambiente para conexão com o banco de dados:

```bash
export DATABASE_URL="postgresql://usuário:senha@localhost:5432/automizap"
```

## Instalação da Aplicação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/automizap.git
cd automizap
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente necessárias:

```bash
cp .env-example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrações do banco de dados:

```bash
npm run db:push
```

5. Inicie a aplicação:

```bash
npm run build
npm run start
```

## Considerações para Produção

### Persistência da Sessão do WhatsApp

O WhatsApp Web.js armazena sessões usando a opção `LocalAuth`. Para garantir que estas sessões persistam após reinicialização do servidor, certifique-se de que o diretório `.wwebjs_auth` no raiz da aplicação seja preservado.

### Configuração de Proxy

Se estiver rodando atrás de um proxy ou firewall, pode ser necessário configurar o Puppeteer com opções adicionais no arquivo `server/whatsapp.ts`.

### Uso de PM2 para Gerenciamento de Processos

Recomendamos o uso do PM2 para gerenciar a aplicação em ambientes de produção:

```bash
npm install -g pm2
pm2 start npm --name "automizap" -- run start
pm2 save
pm2 startup
```

## Personalização de Marca e UI

Para personalizar a interface, edite os arquivos:

- `client/src/index.css` para cores e temas
- Logotipos e ícones em `client/src/assets`

## Suporte e Problemas Comuns

### Problema de Conectividade com WhatsApp

Se o QR code não aparecer ou houver problemas de conexão com o WhatsApp:

1. Verifique se todas as dependências do Puppeteer estão instaladas
2. Certifique-se de que o Chrome/Chromium pode ser executado
3. Verifique os logs do sistema para mensagens de erro específicas

### Problemas de Autenticação

Em caso de problemas ao escanear o QR code:

1. Limpe o diretório `.wwebjs_auth` para forçar uma nova autenticação
2. Certifique-se de que apenas uma instância da aplicação está rodando

## Atualizações

Para atualizar a aplicação para uma nova versão:

1. Faça backup do banco de dados
2. Faça backup do diretório `.wwebjs_auth`
3. Faça pull das novas mudanças
4. Execute `npm install` para atualizar dependências
5. Execute `npm run db:push` para atualizar o esquema do banco
6. Reinicie a aplicação

## Contato e Suporte

Para dúvidas e suporte, entre em contato com Rodrigo Pasa através do AutomizAI.