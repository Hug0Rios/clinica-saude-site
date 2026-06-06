<?php

require_once __DIR__ . '/../controllers/AvaliacaoController.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        jsonResponse(['success' => true, 'data' => listarAvaliacoes()]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
    }

    $result = criarAvaliacao(requestJson());
    jsonResponse(['success' => true, 'message' => 'Avaliação enviada com sucesso.', 'data' => $result], 201);
} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
} catch (Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Erro ao processar avaliação.'], 500);
}
