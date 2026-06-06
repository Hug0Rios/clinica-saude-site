<?php

require_once __DIR__ . '/../config/env.php';

function _sessionStart(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_strict_mode', '1');
        session_start();
    }
}

function loginAdmin(string $email, string $password): array
{
    _sessionStart();

    $adminEmail    = env('ADMIN_EMAIL', '');
    $adminPassword = env('ADMIN_PASSWORD', '');

    if ($adminEmail === '' || $adminPassword === '') {
        return ['success' => false, 'message' => 'Administrador não configurado no servidor.'];
    }

    $_SESSION['login_attempts'] = $_SESSION['login_attempts'] ?? 0;

    if ($_SESSION['login_attempts'] >= 5) {
        return ['success' => false, 'message' => 'Muitas tentativas. Aguarde alguns minutos.', 'blocked' => true];
    }

    if (!hash_equals($adminEmail, $email) || !hash_equals($adminPassword, $password)) {
        $_SESSION['login_attempts']++;
        return ['success' => false, 'message' => 'E-mail ou senha incorretos.'];
    }

    session_regenerate_id(true);
    $_SESSION['admin']          = true;
    $_SESSION['login_attempts'] = 0;

    return ['success' => true];
}

function logoutAdmin(): array
{
    _sessionStart();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    return ['success' => true];
}

function checkAdminAuth(): array
{
    _sessionStart();
    return ['success' => true, 'logged_in' => !empty($_SESSION['admin'])];
}
