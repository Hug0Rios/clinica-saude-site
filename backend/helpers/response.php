<?php

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestJson(): array
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        jsonResponse(['ok' => true]);
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

function requiredString(array $data, string $field, int $max = 255): string
{
    $value = trim((string)($data[$field] ?? ''));

    if ($value === '') {
        throw new InvalidArgumentException("O campo {$field} é obrigatório.");
    }

    if (mb_strlen($value) > $max) {
        throw new InvalidArgumentException("O campo {$field} é muito longo.");
    }

    return $value;
}

function validEmail(array $data, string $field): string
{
    $email = requiredString($data, $field, 180);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Informe um e-mail válido.');
    }

    return $email;
}
