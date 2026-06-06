<?php

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../controllers/AdminContatoController.php';
require_once __DIR__ . '/../../helpers/response.php';

requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

try {
    if ($method === 'GET') {
        $lido = isset($_GET['lido']) ? (int)$_GET['lido'] : null;
        jsonResponse(['success' => true, 'data' => listarContatosAdmin($lido)]);
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['id'] ?? 0);

    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => 'ID inválido.'], 422);
    }

    if ($method === 'PATCH') {
        marcarContatoLido($id, (int)($data['lido'] ?? 1));
        jsonResponse(['success' => true, 'message' => 'Contato atualizado.']);
    }

    if ($method === 'DELETE') {
        deletarContato($id);
        jsonResponse(['success' => true, 'message' => 'Contato excluído.']);
    }
} catch (RuntimeException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 404);
} catch (Throwable $e) {
    error_log('[Admin/Contatos] ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Erro interno.'], 500);
}

jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
