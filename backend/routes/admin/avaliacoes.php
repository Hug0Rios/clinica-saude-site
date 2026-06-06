<?php

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../controllers/AdminAvaliacaoController.php';
require_once __DIR__ . '/../../helpers/response.php';

requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

try {
    if ($method === 'GET') {
        jsonResponse(['success' => true, 'data' => listarAvaliacoesAdmin()]);
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['id'] ?? 0);

    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => 'ID inválido.'], 422);
    }

    if ($method === 'PATCH') {
        toggleAprovacaoAvaliacao($id, (int)($data['aprovada'] ?? 0));
        jsonResponse(['success' => true, 'message' => 'Avaliação atualizada.']);
    }

    if ($method === 'DELETE') {
        deletarAvaliacao($id);
        jsonResponse(['success' => true, 'message' => 'Avaliação excluída.']);
    }
} catch (RuntimeException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 404);
} catch (Throwable $e) {
    error_log('[Admin/Avaliacoes] ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Erro interno.'], 500);
}

jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
