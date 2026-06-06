<?php

if (!function_exists('cors')) require_once __DIR__ . '/../config.php';

cors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $result = supabase_request('pacientes?select=*&order=nome_completo');
        json_out($result['data'] ?? []);
    } catch (Throwable $e) {
        json_out(['erro' => $e->getMessage()], 500);
    }

} elseif ($method === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        if (empty($body['nome_completo']) || empty($body['email'])) {
            json_out(['erro' => 'nome_completo e email são obrigatórios'], 422);
        }

        $email = trim(strtolower($body['email']));

        // Retorna paciente existente se já cadastrado
        $check = supabase_request('pacientes?email=eq.' . rawurlencode($email) . '&select=id');
        if (!empty($check['data'])) {
            json_out(['sucesso' => true, 'paciente_id' => $check['data'][0]['id'], 'existente' => true]);
        }

        $dados = [
            'nome_completo' => trim($body['nome_completo']),
            'email'         => $email,
            'telefone'      => $body['telefone']    ?? null,
            'primeira_vez'  => $body['primeira_vez'] ?? true,
        ];

        $cpf = preg_replace('/\D/', '', $body['cpf'] ?? '');
        if ($cpf !== '') $dados['cpf'] = $cpf;

        $result = supabase_request('pacientes', 'POST', $dados);

        if ($result['code'] >= 400) {
            // Pode ter conflito de CPF; tenta recuperar pelo e-mail
            $retry = supabase_request('pacientes?email=eq.' . rawurlencode($email) . '&select=id');
            if (!empty($retry['data'])) {
                json_out(['sucesso' => true, 'paciente_id' => $retry['data'][0]['id'], 'existente' => true]);
            }
            json_out(['erro' => 'Erro ao cadastrar paciente', 'detalhe' => $result['data']], 409);
        }

        $p   = $result['data'];
        $pid = is_array($p) && isset($p[0]) ? $p[0]['id'] : ($p['id'] ?? null);
        json_out(['sucesso' => true, 'paciente_id' => $pid]);

    } catch (Throwable $e) {
        json_out(['erro' => $e->getMessage()], 500);
    }

} else {
    json_out(['erro' => 'Método não permitido'], 405);
}
