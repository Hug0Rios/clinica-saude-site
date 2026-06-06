<?php

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../controllers/AdminDashboardController.php';
require_once __DIR__ . '/../../helpers/response.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
}

jsonResponse(['success' => true, 'data' => obterEstatisticas()]);
