<?php

if (!function_exists('cors')) require_once __DIR__ . '/../config.php';

cors();

$method = $_SERVER['REQUEST_METHOD'];

/* ---- GET ---- */
if ($method === 'GET') {
    $qs = 'agendamentos?select=*,pacientes(*),profissionais(*,especialidades(*))&order=horario.asc';

    if (!empty($_GET['data']))             $qs .= '&data_consulta=eq.' . rawurlencode($_GET['data']);
    if (!empty($_GET['profissional_id']))  $qs .= '&profissional_id=eq.' . rawurlencode($_GET['profissional_id']);
    if (!empty($_GET['status']))           $qs .= '&status=eq.' . rawurlencode($_GET['status']);

    try {
        $result = supabase_request($qs);
        json_out($result['data'] ?? []);
    } catch (Throwable $e) {
        json_out(['erro' => $e->getMessage()], 500);
    }

/* ---- POST ---- */
} elseif ($method === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        foreach (['paciente_id', 'profissional_id', 'especialidade_id', 'data_consulta', 'horario'] as $f) {
            if (empty($body[$f])) json_out(['erro' => "Campo obrigatório: {$f}"], 422);
        }

        $dados = [
            'paciente_id'      => $body['paciente_id'],
            'profissional_id'  => $body['profissional_id'],
            'especialidade_id' => $body['especialidade_id'],
            'data_consulta'    => $body['data_consulta'],
            'horario'          => $body['horario'],
            'motivo'           => $body['motivo'] ?? null,
            'status'           => 'pendente',
        ];

        $result = supabase_request('agendamentos', 'POST', $dados);

        if ($result['code'] >= 400) {
            json_out(['erro' => 'Erro ao criar agendamento', 'detalhe' => $result['data']], 502);
        }

        $ag  = $result['data'];
        $row = is_array($ag) && isset($ag[0]) ? $ag[0] : ($ag ?? []);
        json_out(['sucesso' => true, 'id' => $row['id'] ?? null]);

    } catch (Throwable $e) {
        json_out(['erro' => $e->getMessage()], 500);
    }

/* ---- PATCH ---- */
} elseif ($method === 'PATCH') {
    try {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        if (empty($body['id']) || empty($body['status'])) {
            json_out(['erro' => 'id e status são obrigatórios'], 422);
        }

        $result = supabase_request(
            'agendamentos?id=eq.' . rawurlencode($body['id']),
            'PATCH',
            ['status' => $body['status']]
        );

        if ($result['code'] >= 400) {
            json_out(['erro' => 'Erro ao atualizar status', 'detalhe' => $result['data']], 502);
        }

        if ($body['status'] === 'Confirmado') {
            dispararWebhook($body['id']);
        }

        json_out(['sucesso' => true]);

    } catch (Throwable $e) {
        json_out(['erro' => $e->getMessage()], 500);
    }

} else {
    json_out(['erro' => 'Método não permitido'], 405);
}

/* ---- Helper: dispara webhook n8n ---- */
function dispararWebhook(string $id): void {
    $webhook = getenv('N8N_WEBHOOK');
    if (!$webhook) return;

    $ag = supabase_request(
        'agendamentos?id=eq.' . rawurlencode($id) .
        '&select=*,pacientes(*),profissionais(*,especialidades(*))'
    );
    if (empty($ag['data'][0])) return;

    $a = $ag['data'][0];
    $payload = [
        'agendamento_id' => $a['id'],
        'paciente'       => $a['pacientes']['nome_completo'] ?? '',
        'email'          => $a['pacientes']['email']         ?? '',
        'telefone'       => $a['pacientes']['telefone']      ?? '',
        'profissional'   => $a['profissionais']['nome']      ?? '',
        'especialidade'  => $a['profissionais']['especialidades']['nome'] ?? '',
        'data'           => $a['data_consulta']              ?? '',
        'horario'        => $a['horario']                    ?? '',
    ];

    $ch = curl_init($webhook);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_exec($ch);
    curl_close($ch);
}
