<?php

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../controllers/AdminAgendamentoController.php';
require_once __DIR__ . '/../../helpers/response.php';

requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

try {
    if ($method === 'GET') {
        $status = $_GET['status'] ?? null;
        $search = isset($_GET['search']) ? trim($_GET['search']) : null;
        if ($search === '') {
            $search = null;
        }
        jsonResponse(['success' => true, 'data' => listarAgendamentosAdmin($status, $search)]);
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['id'] ?? 0);

    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => 'ID inválido.'], 422);
    }

    if ($method === 'PATCH') {
        atualizarStatusAgendamento($id, (string)($data['status'] ?? ''));
        jsonResponse(['success' => true, 'message' => 'Status atualizado.']);
    }

    if ($method === 'DELETE') {
        deletarAgendamento($id);
        jsonResponse(['success' => true, 'message' => 'Agendamento excluído.']);
    }
} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
} catch (RuntimeException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 404);
} catch (Throwable $e) {
    error_log('[Admin/Agendamentos] ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Erro interno.'], 500);
}

jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
