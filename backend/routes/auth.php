<?php

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

if ($method === 'GET' && $action === 'check') {
    jsonResponse(checkAdminAuth());
}

if ($method === 'GET' && $action === 'logout') {
    jsonResponse(logoutAdmin());
}

if ($method === 'POST') {
    $data     = json_decode(file_get_contents('php://input'), true) ?? [];
    $email    = trim((string)($data['email']    ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($email === '' || $password === '') {
        jsonResponse(['success' => false, 'message' => 'Preencha e-mail e senha.'], 422);
    }

    $result = loginAdmin($email, $password);
    jsonResponse($result, $result['success'] ? 200 : 401);
}

jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
