<?php

require_once __DIR__ . '/../config/database.php';

function listarContatosAdmin(?int $lido): array
{
    $where = $lido !== null ? 'WHERE lido = ' . (int)$lido : '';

    return db()->query(
        "SELECT id, nome, email, telefone, mensagem, lido,
                DATE_FORMAT(criado_em,'%d/%m/%Y %H:%i') AS criado_em
         FROM contatos
         {$where}
         ORDER BY criado_em DESC
         LIMIT 500"
    )->fetchAll();
}

function marcarContatoLido(int $id, int $lido): void
{
    $stmt = db()->prepare('UPDATE contatos SET lido = :lido WHERE id = :id');
    $stmt->execute([':lido' => $lido ? 1 : 0, ':id' => $id]);
}

function deletarContato(int $id): void
{
    $stmt = db()->prepare('DELETE FROM contatos WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        throw new RuntimeException('Contato não encontrado.');
    }
}
