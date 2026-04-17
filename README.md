# 🤖 Jupiter Eletro Bot

> Bot de atendimento automático para lojas do **Mercado Livre**, com inteligência artificial integrada (Google Gemini), painel web de gerenciamento e notificações automáticas por e-mail.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Como o Sistema Funciona](#-como-o-sistema-funciona)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Painel de Gerenciamento](#-painel-de-gerenciamento)
- [Fluxo de Atendimento](#-fluxo-de-atendimento)
- [Inteligência Artificial](#-inteligência-artificial)
- [Eventos Automáticos de Pedido](#-eventos-automáticos-de-pedido)
- [Segurança](#-segurança)
- [Scripts Utilitários](#-scripts-utilitários)

---

## 🌟 Visão Geral

O **Jupiter Eletro Bot** monitora sua loja do Mercado Livre em tempo real e responde automaticamente às interações dos clientes:

- 💬 **Perguntas nos anúncios** (pré-venda) — respondidas automaticamente com IA
- 📦 **Chat dos pedidos** (pós-venda) — acompanhamento contínuo via mensagens
- 🚚 **Eventos de pedido** — notifica o comprador em cada etapa (pagamento, envio, entrega)
- 👨‍💼 **Escalada para humano** — detecta quando o cliente precisa de atendimento real e notifica o vendedor por e-mail

---

## ⚙️ Como o Sistema Funciona

### Recebimento de eventos (Webhook)

O Mercado Livre envia uma notificação HTTP `POST` para o servidor a cada evento da loja. O bot processa três tipos de eventos:

| Tópico ML | Evento | Ação do bot |
|---|---|---|
| `questions` | Cliente fez uma pergunta num anúncio | Lê a pergunta → processa com IA → responde via API ML |
| `messages` | Cliente enviou mensagem no chat do pedido | Lê a mensagem → processa com IA → responde via API ML |
| `orders_v2` | Mudança de status de um pedido | Envia mensagem automática de acompanhamento ao comprador |

### Pipeline de processamento de mensagens

Ao receber uma mensagem, o bot executa o seguinte fluxo em camadas:

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
     ┌─────────────┼──────────────┬────────────────┐
     ▼             ▼              ▼                 ▼
 saudacao   status_pedido     transferir           faq
     │             │              │                 │
 Exibe menu   Consulta API    Pausa o bot      Gemini RAG:
 com 3 opções ML e retorna    Notifica o       gera resposta
              dados reais do  vendedor por     contextualizada
              pedido do       e-mail           usando o FAQ
              comprador                        cadastrado
                                                     │
                                              Se IA sinalizar
                                              ESCALAR ou falhar:
                                              escalona para humano
```

---

## 🧠 Inteligência Artificial

O bot usa a API do **Google Gemini** em dois momentos distintos:

### 1. Classificação de intenção

O Gemini analisa a mensagem do cliente e a classifica em uma de quatro categorias:

| Intenção | Exemplos de mensagem |
|---|---|
| `status_pedido` | "Cadê meu pedido?", "Quando chega?", "Já foi enviado?" |
| `faq` | "Tem garantia?", "Aceita devolução?", "É bivolt?" |
| `transferir` | "Quero falar com alguém", "Me passa pro atendente" |
| `saudacao` | "Oi", "Bom dia", "Olá, preciso de ajuda" |

### 2. Geração de resposta com RAG (Retrieval-Augmented Generation)

Quando a intenção é `faq`, o bot usa uma técnica chamada RAG: passa toda a **Base de Conhecimento** da loja junto com a pergunta do cliente para o Gemini, que gera uma resposta em linguagem natural e conversacional.

**Isso significa que a resposta NÃO é um texto fixo** — o Gemini gera uma resposta específica para a pergunta do cliente com base nas informações cadastradas.

**Exemplo:**
> **FAQ cadastrado:** `garantia, defeito` → *"Todos os produtos possuem garantia de fábrica de 12 meses."*
>
> **Pergunta do cliente:** *"Meu produto quebrou depois de 3 meses, o que faço?"*
>
> **Resposta gerada pelo Gemini:** *"Olá! Como seu produto está dentro do período de garantia de 12 meses, você tem direito ao acionamento. Entre em contato com a loja para iniciarmos o processo de garantia."*

### Comportamento sem API Key

Se a `GEMINI_API_KEY` não estiver configurada, o bot opera em modo offline:
- A classificação de intenção é feita por **expressões regulares e palavras-chave**
- As respostas FAQ são o **texto exato** cadastrado (sem geração de linguagem natural)
- O sistema continua funcional, mas com respostas menos naturais

### Escalada automática para humano

O Gemini é instruído a responder `ESCALAR` quando a pergunta do cliente estiver **além do escopo do FAQ cadastrado**. Nesse caso, o bot automaticamente:
1. Pausa o atendimento automático para aquela conversa
2. Notifica o vendedor por e-mail
3. Informa o cliente que estará em contato em breve

---

## 📦 Eventos Automáticos de Pedido

Quando um pedido muda de status, o bot envia mensagens automáticas ao comprador:

| Status | Mensagem enviada |
|---|---|
| `paid` | Confirmação de pagamento + agradecimento |
| `shipped` | Aviso de envio + código de rastreamento |
| `delivered` | Confirmação de entrega + solicitação de avaliação |

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia |
|---|---|
| Runtime | Node.js (TypeScript) |
| Framework HTTP | Fastify v4 |
| ORM | Prisma |
| Banco de dados | SQLite (desenvolvimento) / PostgreSQL (produção) |
| Templates | EJS |
| Inteligência Artificial | Google Gemini 2.0 Flash-Lite / Flash |
| Logger | Pino (JSON em produção, pretty em dev) |
| Validação de config | Zod (fail-fast no startup) |
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
│   │   ├── backup.ts          # Backup automático do FAQ em JSON
│   │   ├── config.ts          # Configuração validada com Zod
│   │   ├── envManager.ts      # Leitura e escrita do arquivo .env
│   │   ├── erros.ts           # Reporter de erros (log + alerta e-mail)
│   │   ├── logger.ts          # Pino logger
│   │   └── sanitizacao.ts     # Sanitização de inputs de usuário
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
│   │   ├── configuracoes.ts   # Gerenciamento de credenciais
│   │   ├── conversas.ts       # Fila de atendimento humano
│   │   ├── dashboard.ts       # Campanhas de marketing
│   │   └── faq.ts             # CRUD da base de conhecimento
│   │
│   ├── views/                 # Templates EJS
│   │   ├── partials/
│   │   │   └── sidebar.ejs
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
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- npm 9+
- Conta de desenvolvedor no [Mercado Livre Developers](https://developers.mercadolivre.com.br)
- (Opcional) Chave da API do [Google AI Studio](https://aistudio.google.com)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/ml-bot.git
cd ml-bot

# 2. Instale as dependências
npm install

# 3. Copie o template de configuração
cp .env.example .env

# 4. Edite o .env com suas credenciais
# (ou use o painel web após subir o servidor)

# 5. Crie o banco de dados e aplique as migrações
npx prisma migrate dev --name init

# 6. Popule o FAQ com perguntas iniciais (opcional)
npm run db:seed

# 7. Inicie o servidor em modo desenvolvimento
npm run dev
```

O servidor estará disponível em **http://localhost:3000**

---

## 🔧 Configuração

### Via arquivo `.env`

Copie `.env.example` para `.env` e preencha as variáveis:

```env
# ─── Mercado Livre ────────────────────────────────────────
APP_ID=              # ID do aplicativo (ML Developers)
SECRET_KEY=          # Client Secret do aplicativo
ACCESS_TOKEN=        # Token de acesso OAuth
REFRESH_TOKEN=       # Token de atualização OAuth
USER_ID=             # ID da sua conta de vendedor

# ─── Painel Admin ─────────────────────────────────────────
PAINEL_USUARIO=admin
PAINEL_SENHA_HASH=   # Gere com: npm run senha

# ─── Banco de dados ───────────────────────────────────────
DATABASE_URL=file:./dev.db   # SQLite (dev)
# DATABASE_URL=postgresql://... # PostgreSQL (produção)

# ─── Inteligência Artificial (opcional) ──────────────────
GEMINI_API_KEY=      # Obtenha em aistudio.google.com

# ─── E-mail (opcional) ────────────────────────────────────
EMAIL_REMETENTE=     # Gmail do bot
EMAIL_SENHA=         # Senha de app do Gmail
EMAIL_VENDEDOR=      # Seu e-mail (destinatário dos alertas)

# ─── Server ───────────────────────────────────────────────
NODE_ENV=development
PORT=3000
SESSION_SECRET=      # String aleatória com 32+ caracteres
```

### Via Painel Web

Após subir o servidor, acesse **`/painel/configuracoes`** para gerenciar todas as credenciais pela interface gráfica sem precisar editar o `.env` manualmente.

---

## 🖥️ Painel de Gerenciamento

Acesse em: `http://localhost:3000/painel`

| Página | Rota | Funcionalidade |
|---|---|---|
| Login | `/painel/login` | Autenticação do vendedor |
| Campanhas | `/painel` | Enviar mensagens para compradores dos últimos 90 dias |
| Fila de Atendimento | `/painel/conversas` | Ver e liberar conversas aguardando humano |
| Base de Conhecimento | `/painel/faq` | Adicionar/remover entradas do FAQ usadas pelo bot |
| Configurações | `/painel/configuracoes` | Gerenciar credenciais ML, Gemini, e-mail e senha do painel |

### Gerenciar o FAQ

O FAQ é a "memória" do bot. Cada entrada tem:
- **Palavras-chave** (separadas por vírgula) — termos que ativam aquela resposta
- **Resposta** — informação que o Gemini usará para gerar a resposta ao cliente

> **Dica:** Quanto mais detalhadas as respostas do FAQ, mais preciso o Gemini será ao atender os clientes.

---

## 🔒 Segurança

- **Senhas** armazenadas como hash bcrypt (custo 12) — nunca em texto puro
- **Sessões** com cookie `httpOnly`, `SameSite=lax`, expira em 24h
- **Variáveis sigilosas** nunca expostas no HTML — campos de senha sempre mascarados
- **Rate limiting** na rota do webhook (100 req/min)
- **Sanitização** de todas as entradas de usuário (remoção de HTML e caracteres de controle)
- **Validação de origem** do webhook (verifica `application_id` da notificação)
- **`.env`** no `.gitignore` — nunca commitado

---

## 📜 Scripts Utilitários

```bash
# Desenvolvimento com hot reload
npm run dev

# Compilar para produção
npm run build

# Iniciar em produção
npm start

# Criar/aplicar migrações do banco
npm run db:migrate

# Popular o FAQ com perguntas padrão
npm run db:seed

# Gerar hash bcrypt para nova senha do painel
npm run senha
```

---

## 🔗 Expor o webhook localmente (desenvolvimento)

O Mercado Livre precisa de uma URL pública para enviar notificações. Use o **ngrok** (incluído na pasta do projeto):

```bash
# Em outro terminal
./ngrok http 3000
```

Copie a URL gerada (ex: `https://xxxx.ngrok.io`) e configure em:
**ML Developers → Sua aplicação → Notificações → URL de notificações**

---

## 📝 Licença

Projeto privado — uso exclusivo da Jupiter Eletro.
