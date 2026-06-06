<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

function criarAvaliacao(array $data): array
{
    $nome = requiredString($data, 'nome', 120);
    $nota = (int)($data['nota'] ?? 0);
    $comentario = requiredString($data, 'comentario', 1000);

    if ($nota < 1 || $nota > 5) {
        throw new InvalidArgumentException('A nota deve estar entre 1 e 5.');
    }

    $stmt = db()->prepare(
        'INSERT INTO avaliacoes (nome, nota, comentario, criado_em)
         VALUES (:nome, :nota, :comentario, NOW())'
    );

    $stmt->execute([
        ':nome' => $nome,
        ':nota' => $nota,
        ':comentario' => $comentario,
    ]);

    return [
        'id' => (int)db()->lastInsertId(),
    ];
}

function listarAvaliacoes(): array
{
    $stmt = db()->query(
        'SELECT id, nome, nota, comentario, DATE_FORMAT(criado_em, "%d/%m/%Y") AS data
         FROM avaliacoes
         WHERE aprovada = 1
         ORDER BY criado_em DESC
         LIMIT 30'
    );

    return $stmt->fetchAll();
}
