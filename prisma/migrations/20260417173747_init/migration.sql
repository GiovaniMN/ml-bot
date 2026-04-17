-- CreateTable
CREATE TABLE "faq_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "perguntas" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessoes" (
    "conversa_id" TEXT NOT NULL PRIMARY KEY,
    "estado" TEXT NOT NULL,
    "buyer_id" TEXT,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
