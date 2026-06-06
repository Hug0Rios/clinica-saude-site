<?php

require_once __DIR__ . '/../controllers/ContatoController.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
    }

    $result = criarContato(requestJson());
    jsonResponse(['success' => true, 'message' => 'Contato enviado com sucesso.', 'data' => $result], 201);
} catch (InvalidArgumentException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 422);
} catch (Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Erro ao processar contato.'], 500);
}
