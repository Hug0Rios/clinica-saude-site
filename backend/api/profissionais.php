<?php

if (!function_exists('cors')) require_once __DIR__ . '/../config.php';

cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_out(['erro' => 'Método não permitido'], 405);
}

try {
    $result = supabase_request('profissionais?select=*,especialidades(*)&ativo=eq.true&order=nome');

    if ($result['code'] >= 400) {
        json_out(['erro' => 'Erro ao buscar profissionais', 'detalhe' => $result['data']], 502);
    }

    json_out($result['data'] ?? []);
} catch (Throwable $e) {
    json_out(['erro' => $e->getMessage()], 500);
}
