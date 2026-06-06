-- Execute este arquivo UMA VEZ se o banco já existir com dados.
-- Para banco novo, use schema.sql (já inclui estas colunas).

ALTER TABLE agendamentos
  ADD COLUMN status ENUM('pendente','confirmado','cancelado') NOT NULL DEFAULT 'pendente'
  AFTER motivo;

ALTER TABLE avaliacoes
  ADD COLUMN aprovada TINYINT(1) NOT NULL DEFAULT 1
  AFTER comentario;

ALTER TABLE contatos
  ADD COLUMN lido TINYINT(1) NOT NULL DEFAULT 0
  AFTER mensagem;
