<?php

require_once __DIR__ . '/../config/database.php';

function listarAvaliacoesAdmin(): array
{
    return db()->query(
        "SELECT id, nome, nota, comentario, aprovada,
                DATE_FORMAT(criado_em,'%d/%m/%Y') AS data
         FROM avaliacoes
         ORDER BY criado_em DESC
         LIMIT 500"
    )->fetchAll();
}

function toggleAprovacaoAvaliacao(int $id, int $aprovada): void
{
    $stmt = db()->prepare('UPDATE avaliacoes SET aprovada = :aprovada WHERE id = :id');
    $stmt->execute([':aprovada' => $aprovada ? 1 : 0, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        throw new RuntimeException('Avaliação não encontrada.');
    }
}

function deletarAvaliacao(int $id): void
{
    $stmt = db()->prepare('DELETE FROM avaliacoes WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        throw new RuntimeException('Avaliação não encontrada.');
    }
}
