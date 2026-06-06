<?php

require_once __DIR__ . '/../config/database.php';

function listarAgendamentosAdmin(?string $status, ?string $search): array
{
    $where  = ['1=1'];
    $params = [];

    if ($status && in_array($status, ['pendente', 'confirmado', 'cancelado'], true)) {
        $where[]          = 'status = :status';
        $params[':status'] = $status;
    }

    if ($search !== null && $search !== '') {
        $where[]          = '(nome LIKE :s OR email LIKE :s OR telefone LIKE :s)';
        $params[':s']     = '%' . $search . '%';
    }

    $stmt = db()->prepare(
        "SELECT id, nome, email, telefone, servico, profissional,
                DATE_FORMAT(data_consulta,'%d/%m/%Y') AS data,
                DATE_FORMAT(horario,'%H:%i') AS horario,
                motivo, status,
                DATE_FORMAT(criado_em,'%d/%m/%Y %H:%i') AS criado_em
         FROM agendamentos
         WHERE " . implode(' AND ', $where) . "
         ORDER BY data_consulta DESC, horario DESC
         LIMIT 500"
    );
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function atualizarStatusAgendamento(int $id, string $status): void
{
    if (!in_array($status, ['pendente', 'confirmado', 'cancelado'], true)) {
        throw new InvalidArgumentException('Status inválido.');
    }

    $stmt = db()->prepare('UPDATE agendamentos SET status = :status WHERE id = :id');
    $stmt->execute([':status' => $status, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        throw new RuntimeException('Agendamento não encontrado.');
    }
}

function deletarAgendamento(int $id): void
{
    $stmt = db()->prepare('DELETE FROM agendamentos WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        throw new RuntimeException('Agendamento não encontrado.');
    }
}
