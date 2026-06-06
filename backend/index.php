<?php

require_once __DIR__ . '/config.php';

cors();

// PHP built-in server: serve existing static files directly
if (PHP_SAPI === 'cli-server') {
    $path = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file($path) && pathinfo($path, PATHINFO_EXTENSION) !== 'php') {
        return false;
    }
}

$uri = '/' . trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

$routes = [
    '/api/profissionais' => __DIR__ . '/api/profissionais.php',
    '/api/pacientes'     => __DIR__ . '/api/pacientes.php',
    '/api/agendamentos'  => __DIR__ . '/api/agendamentos.php',
    '/api/webhook'       => __DIR__ . '/api/webhook.php',
];

if (isset($routes[$uri])) {
    require $routes[$uri];
} else {
    json_out(['status' => 'ok', 'service' => 'Clínica Vitalis API', 'version' => '1.0']);
}
