CREATE DATABASE IF NOT EXISTS clinica_vitalis
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE clinica_vitalis;

CREATE TABLE IF NOT EXISTS contatos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    telefone VARCHAR(40) NULL,
    mensagem TEXT NOT NULL,
    lido TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL,
    INDEX idx_contatos_criado_em (criado_em)
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    telefone VARCHAR(40) NOT NULL,
    servico VARCHAR(80) NOT NULL,
    profissional VARCHAR(120) NOT NULL,
    data_consulta DATE NOT NULL,
    horario TIME NOT NULL,
    motivo TEXT NULL,
    status ENUM('pendente','confirmado','cancelado') NOT NULL DEFAULT 'pendente',
    criado_em DATETIME NOT NULL,
    INDEX idx_agendamentos_data_profissional (data_consulta, profissional),
    INDEX idx_agendamentos_status (status)
);

CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    nota TINYINT UNSIGNED NOT NULL,
    comentario TEXT NOT NULL,
    aprovada TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME NOT NULL,
    INDEX idx_avaliacoes_criado_em (criado_em)
);
