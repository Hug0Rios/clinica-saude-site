<?php

require_once __DIR__ . '/../config/database.php';

function obterEstatisticas(): array
{
    $db = db();

    $agendamentosHoje = (int)$db->query(
        "SELECT COUNT(*) FROM agendamentos WHERE DATE(data_consulta) = CURDATE()"
    )->fetchColumn();

    $pendentes = (int)$db->query(
        "SELECT COUNT(*) FROM agendamentos WHERE status = 'pendente'"
    )->fetchColumn();

    $totalAgendamentos = (int)$db->query("SELECT COUNT(*) FROM agendamentos")->fetchColumn();

    $row = $db->query(
        "SELECT COUNT(*), ROUND(AVG(nota), 1) FROM avaliacoes WHERE aprovada = 1"
    )->fetch(PDO::FETCH_NUM);
    $totalAvaliacoes = (int)($row[0] ?? 0);
    $notaMedia       = (float)($row[1] ?? 0);

    $contatosNovos = (int)$db->query(
        "SELECT COUNT(*) FROM contatos WHERE lido = 0"
    )->fetchColumn();

    $proximosAgendamentos = $db->query(
        "SELECT id, nome, servico, profissional,
                DATE_FORMAT(data_consulta,'%d/%m/%Y') AS data,
                DATE_FORMAT(horario,'%H:%i') AS horario,
                status
         FROM agendamentos
         WHERE data_consulta >= CURDATE()
         ORDER BY data_consulta ASC, horario ASC
         LIMIT 8"
    )->fetchAll();

    return compact(
        'agendamentosHoje', 'pendentes', 'totalAgendamentos',
        'totalAvaliacoes', 'notaMedia', 'contatosNovos',
        'proximosAgendamentos'
    );
}
