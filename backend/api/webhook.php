<?php

if (!function_exists('cors')) require_once __DIR__ . '/../config.php';

cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['erro' => 'Método não permitido'], 405);
}

try {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];

    if (empty($body['agendamento_id'])) {
        json_out(['erro' => 'agendamento_id é obrigatório'], 422);
    }

    $id = $body['agendamento_id'];
    $ag = supabase_request(
        'agendamentos?id=eq.' . rawurlencode($id) .
        '&select=*,pacientes(*),profissionais(*,especialidades(*))'
    );

    if (empty($ag['data'][0])) {
        json_out(['erro' => 'Agendamento não encontrado'], 404);
    }

    $a       = $ag['data'][0];
    $webhook = getenv('N8N_WEBHOOK');

    if (!$webhook) {
        json_out(['enviado' => false, 'motivo' => 'N8N_WEBHOOK não configurado']);
    }

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
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $code     = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    json_out(['enviado' => $code >= 200 && $code < 300]);

} catch (Throwable $e) {
    json_out(['erro' => $e->getMessage()], 500);
}
