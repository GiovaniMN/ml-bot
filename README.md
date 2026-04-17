# 🤖 Jupiter Eletro Bot

> Bot de atendimento automático para lojas do **Mercado Livre**, com inteligência artificial integrada (Google Gemini), painel web de gerenciamento e notificações automáticas por e-mail.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-000000?logo=fastify&logoColor=white)](https://fastify.dev)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Como o Sistema Funciona](#-como-o-sistema-funciona)
- [Inteligência Artificial](#-inteligência-artificial)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Início Rápido — Passo a Passo](#-início-rápido--passo-a-passo)
- [Configuração Detalhada](#-configuração-detalhada)
- [Painel de Gerenciamento](#-painel-de-gerenciamento)
- [Acesso ao Painel](#-acesso-ao-painel)
- [Eventos Automáticos de Pedido](#-eventos-automáticos-de-pedido)
- [Deploy em Produção](#-deploy-em-produção)
- [Segurança](#-segurança)
- [Scripts Utilitários](#-scripts-utilitários)
- [Licença](#-licença)

---

## 🌟 Visão Geral

O **Jupiter Eletro Bot** monitora sua loja do Mercado Livre em tempo real e responde automaticamente às interações dos clientes:

- 💬 **Perguntas nos anúncios** (pré-venda) — respondidas automaticamente com IA
- 📦 **Chat dos pedidos** (pós-venda) — acompanhamento contínuo via mensagens
- 🚚 **Eventos de pedido** — notifica o comprador em cada etapa (pagamento, envio, entrega)
- 👨‍💼 **Escalada para humano** — detecta quando o cliente precisa de atendimento real e notifica o vendedor por e-mail
- 🖥️ **Painel web** — gerencia FAQ, fila de atendimento, campanhas e credenciais pela interface

---

## ⚙️ Como o Sistema Funciona

### Recebimento de eventos (Webhook)

O Mercado Livre envia uma notificação HTTP `POST` para o servidor a cada evento da loja:

| Tópico ML | Evento | Ação do bot |
|---|---|---|
| `questions` | Pergunta num anúncio | Lê a pergunta → processa com IA → responde via API ML |
| `messages` | Mensagem no chat do pedido | Lê a mensagem → processa com IA → responde via API ML |
| `orders_v2` | Mudança de status de pedido | Envia mensagem automática de acompanhamento |

### Pipeline de processamento

```
Mensagem do cliente
        │
        ▼
┌────────────────────────────────────────────┐
│  ETAPA 1 — Classificar a INTENÇÃO          │
│                                            │
│  1ª tentativa: Gemini 2.0 Flash-Lite       │
│  2ª tentativa: Gemini 2.0 Flash (fallback) │
│  3ª tentativa: Palavras-chave (offline)    │
└──────────────────┬─────────────────────────┘
                   │
     ┌─────────────┼──────────────┬─────────────────┐
     ▼             ▼              ▼                  ▼
 saudacao   status_pedido     transferir            faq
     │             │              │                  │
 Exibe menu   Consulta API    Pausa o bot       Gemini RAG:
 com 3 opções ML e retorna    Notifica o        gera resposta
              dados reais do  vendedor por      contextualizada
              pedido          e-mail            usando o FAQ
```

---

## 🧠 Inteligência Artificial

O bot usa a API do **Google Gemini** em dois momentos:

### 1. Classificação de intenção

Classifica a mensagem em uma de quatro categorias: `status_pedido`, `faq`, `transferir` ou `saudacao`.

### 2. Geração de resposta com RAG

Quando a intenção é `faq`, toda a **Base de Conhecimento** é enviada ao Gemini junto com a pergunta do cliente. O Gemini gera uma resposta em linguagem natural — **não é texto fixo**, é gerado dinamicamente.

**Sem API Key:** o bot usa busca por palavras-chave como fallback — continua funcional, mas com respostas menos naturais.

### Escalada automática

Se o Gemini responder `ESCALAR` (pergunta fora do escopo), o bot pausa o atendimento, notifica o vendedor por e-mail e informa o cliente que estará em contato.

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia |
|---|---|
| Runtime | Node.js 18+ (TypeScript) |
| Framework HTTP | Fastify v4 |
| ORM | Prisma 5 |
| Banco de dados | SQLite (desenvolvimento) / PostgreSQL (produção) |
| Templates | EJS |
| IA | Google Gemini 2.0 Flash-Lite / Flash |
| Logger | Pino |
| Validação de config | Zod |
| Autenticação | @fastify/session + bcrypt |
| E-mail | Nodemailer (Gmail SMTP) |
| API externa | Mercado Livre REST API (OAuth 2.0) |

---

## 📁 Estrutura do Projeto

```
ml-bot/
├── prisma/
│   ├── schema.prisma          # Modelos do banco de dados
│   └── migrations/            # Histórico de migrações
│
├── scripts/
│   ├── gerarSenha.ts          # Gera hash bcrypt para senha do painel
│   └── seedFaq.ts             # Popula o FAQ com dados iniciais
│
├── src/
│   ├── api/
│   │   ├── mlClient.ts        # Cliente da API do Mercado Livre
│   │   └── tokenManager.ts    # Renovação de tokens OAuth
│   │
│   ├── bot/
│   │   ├── ia.ts              # Integração Gemini (intenção + RAG FAQ)
│   │   ├── mensagens.ts       # Templates de mensagens de pedido
│   │   └── processador.ts     # Lógica principal de processamento
│   │
│   ├── core/
│   │   ├── backup.ts          # Backup automático do FAQ (mantém 5 últimos)
│   │   ├── config.ts          # Configuração validada com Zod
│   │   ├── envManager.ts      # Leitura e escrita do arquivo .env
│   │   ├── erros.ts           # Reporter de erros (log + alerta e-mail)
│   │   ├── logger.ts          # Pino logger
│   │   └── sanitizacao.ts     # Sanitização de inputs
│   │
│   ├── db/
│   │   ├── client.ts          # Prisma Client singleton
│   │   ├── faqRepo.ts         # Repositório de perguntas frequentes
│   │   └── sessoesRepo.ts     # Repositório de sessões de atendimento
│   │
│   ├── notificacao/
│   │   └── email.ts           # Notificações por e-mail (Nodemailer)
│   │
│   ├── painel/
│   │   ├── auth.ts            # Rotas de login/logout
│   │   ├── configuracoes.ts   # Gerenciamento de credenciais via web
│   │   ├── conversas.ts       # Fila de atendimento humano
│   │   ├── dashboard.ts       # Campanhas de marketing
│   │   └── faq.ts             # CRUD da base de conhecimento
│   │
│   ├── views/                 # Templates EJS
│   │   ├── partials/sidebar.ejs
│   │   ├── configuracoes.ejs
│   │   ├── conversas.ejs
│   │   ├── faq.ejs
│   │   ├── login.ejs
│   │   └── painel.ejs
│   │
│   ├── webhook/
│   │   └── router.ts          # Recepção de notificações do ML
│   │
│   └── app.ts                 # Entry point — servidor Fastify
│
├── .env.example               # Template de variáveis de ambiente
├── railway.toml               # Configuração de deploy Railway
├── package.json
└── tsconfig.json
```

---

## 🚀 Início Rápido — Passo a Passo

> Siga este guia após clonar o repositório. Tempo estimado: **10 minutos**.

### 1. Clonar e instalar

```bash
git clone https://github.com/GiovaniMN/ml-bot.git
cd ml-bot
npm install
```

### 2. Configurar as variáveis de ambiente

```bash
# Copie o template
cp .env.example .env
```

Abra o arquivo `.env` e preencha as variáveis (veja a seção [Configuração Detalhada](#-configuração-detalhada) abaixo).

**Mínimo obrigatório para rodar localmente:**

```env
APP_ID=           # ID do seu app no ML Developers
SECRET_KEY=       # Client Secret do app ML
ACCESS_TOKEN=     # Token de acesso OAuth
REFRESH_TOKEN=    # Refresh token OAuth
USER_ID=          # ID da sua conta de vendedor ML
PAINEL_SENHA_HASH=  # Veja o passo 4 abaixo
SESSION_SECRET=   # Qualquer string com 32+ caracteres
DB_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
NODE_ENV=development
PORT=3000
```

### 3. Criar o banco de dados

```bash
npx prisma migrate dev --name init
```

### 4. Gerar a senha do painel

```bash
npm run senha
```

Digite a senha desejada. Copie o hash gerado e cole no `.env`:
```env
PAINEL_SENHA_HASH=$2b$12$...  # cole o hash aqui
```

### 5. Popular o FAQ inicial (opcional)

```bash
npm run db:seed
```

Isso adiciona 6 perguntas frequentes padrão (garantia, prazo, troca, etc.).

### 6. Iniciar o servidor

```bash
npm run dev
```

✅ Pronto! O servidor estará disponível em **http://localhost:3000**

---

## 🖥️ Acesso ao Painel

| | |
|---|---|
| **URL** | http://localhost:3000/painel |
| **Usuário padrão** | `admin` |
| **Senha** | a que você definiu no passo 4 |

> 💡 Para alterar o usuário ou senha posteriormente, acesse o painel → **Configurações**.

---

## 🔧 Configuração Detalhada

### Obtendo as credenciais do Mercado Livre

1. Acesse [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br)
2. Crie um aplicativo (ou use um existente)
3. Copie o **App ID** e o **Secret Key**
4. Gere um par de tokens OAuth (Access Token + Refresh Token)
5. Anote o **User ID** da sua conta de vendedor

### Obtendo a Gemini API Key (opcional)

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em **"Get API Key"**
3. Crie uma chave para o projeto

> Sem a Gemini API Key o bot ainda funciona, mas usa busca por palavras-chave em vez de IA generativa.

### Configurando notificações por e-mail (opcional)

Use uma conta Gmail com **Senha de App** (não a senha normal):
1. Acesse sua conta Google → **Segurança** → **Verificação em duas etapas** (ative)
2. Em seguida: **Segurança** → **Senhas de app** → crie uma senha para "Outro"
3. Use essa senha de 16 caracteres no campo `EMAIL_SENHA`

### Arquivo `.env` completo

```env
# ─── Mercado Livre ──────────────────────────────────────
APP_ID=
SECRET_KEY=
ACCESS_TOKEN=
REFRESH_TOKEN=
USER_ID=

# ─── Painel Admin ───────────────────────────────────────
PAINEL_USUARIO=admin
PAINEL_SENHA_HASH=        # gerado com: npm run senha
SESSION_SECRET=           # string aleatória com 32+ caracteres

# ─── Banco de dados ─────────────────────────────────────
DB_PROVIDER=sqlite
DATABASE_URL=file:./dev.db

# ─── Inteligência Artificial (opcional) ─────────────────
GEMINI_API_KEY=

# ─── E-mail (opcional) ──────────────────────────────────
EMAIL_REMETENTE=
EMAIL_SENHA=
EMAIL_VENDEDOR=

# ─── Servidor ───────────────────────────────────────────
NODE_ENV=development
PORT=3000
```

---

## 🖥️ Painel de Gerenciamento

| Página | Rota | Funcionalidade |
|---|---|---|
| Login | `/painel/login` | Autenticação do vendedor |
| Campanhas | `/painel` | Enviar mensagens para compradores dos últimos 90 dias |
| Fila de Atendimento | `/painel/conversas` | Ver e liberar conversas aguardando humano |
| Base de Conhecimento | `/painel/faq` | Adicionar/remover entradas do FAQ usadas pela IA |
| **Configurações** | `/painel/configuracoes` | Gerenciar todas as credenciais sem editar o `.env` |

### Página de Configurações

A página **Configurações** permite gerenciar pela interface web:
- Credenciais do Mercado Livre (App ID, Secret Key, User ID)
- Tokens OAuth com botão de **renovação automática** integrado
- Chave da API Gemini
- Configurações de e-mail
- Usuário e senha do painel (com hash bcrypt automático)

> Campos em branco mantêm os valores atuais — não é necessário preencher tudo de novo.

---

## 📦 Eventos Automáticos de Pedido

| Status do pedido | Mensagem enviada ao comprador |
|---|---|
| `paid` | Confirmação de pagamento + agradecimento |
| `shipped` | Aviso de envio + código de rastreamento |
| `delivered` | Confirmação de entrega + pedido de avaliação |

---

## 🌐 Expor o Webhook Localmente (desenvolvimento)

O Mercado Livre precisa de uma URL pública para enviar notificações. Use o **ngrok** (incluído):

```bash
# Em outro terminal, na pasta do projeto
./ngrok http 3000
```

Copie a URL gerada (ex: `https://xxxx.ngrok.io`) e configure em:

**ML Developers → Sua aplicação → Notificações → URL de notificações:**
```
https://xxxx.ngrok.io/webhook/ml
```

---

## 🚀 Deploy em Produção

### Railway (recomendado — $5/mês)

1. Crie conta em [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo** → selecione `ml-bot`
3. Adicione um banco PostgreSQL: **+ New → Database → Add PostgreSQL**
4. Em **Variables**, configure as mesmas variáveis do `.env`, mais:
   ```
   DB_PROVIDER=postgresql
   DATABASE_URL=<referência automática do PostgreSQL do Railway>
   NODE_ENV=production
   ```
5. O deploy acontece automaticamente a cada `git push`

A URL pública gerada pelo Railway é a que você configura como webhook no ML Developers.

### Outras plataformas compatíveis

| Plataforma | Preço | Obs. |
|---|---|---|
| **Koyeb** | Gratuito | Sem sleep, PostgreSQL incluso |
| **Render** | Gratuito* | *Dorme após 15min de inatividade |
| **Fly.io** | Gratuito | Requer CLI |
| **VPS** (DigitalOcean, Contabo) | ~$4–6/mês | Controle total |

> ⚠️ **Vercel e GitHub Pages não são compatíveis** — exigem servidores serverless, incompatíveis com Fastify + sessões + banco de dados persistente.

---

## 🔒 Segurança

- Senhas armazenadas como **hash bcrypt** (custo 12) — nunca em texto puro
- Sessões com cookie `httpOnly`, `SameSite=lax`, expira em 24h
- Campos sensíveis nunca expostos no HTML — mascarados com `●●●●●●`
- **Rate limiting** no webhook (100 req/min)
- Sanitização de todas as entradas de usuário
- Validação da origem do webhook (verifica `application_id`)
- `.env` no `.gitignore` — nunca commitado ao repositório

---

## 📜 Scripts Utilitários

```bash
# Desenvolvimento com hot reload
npm run dev

# Iniciar em produção
npm start

# Aplicar migrações (desenvolvimento)
npm run db:migrate

# Aplicar migrações (produção — sem modo interativo)
npm run db:deploy

# Popular o FAQ com perguntas iniciais
npm run db:seed

# Gerar hash bcrypt para nova senha do painel
npm run senha
```

---

## 📝 Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais informações.
