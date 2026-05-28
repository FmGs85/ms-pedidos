-- Migração: Criação da tabela de mensagens por pedido
-- Executar com um usuário que tenha permissão CREATE TABLE no banco ms-pedidos

CREATE TABLE IF NOT EXISTS mensagens_pedido (
  id           VARCHAR(191) NOT NULL,
  pedido_id    VARCHAR(191) NOT NULL,
  remetente_id VARCHAR(191) NOT NULL,
  texto        TEXT NOT NULL,
  lida         BOOLEAN NOT NULL DEFAULT false,
  criado_em    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX mensagens_pedido_pedido_id_idx (pedido_id),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE mensagens_pedido
  ADD CONSTRAINT mensagens_pedido_pedido_id_fkey
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
