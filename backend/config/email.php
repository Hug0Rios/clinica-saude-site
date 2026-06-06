<?php

require_once __DIR__ . '/env.php';

/**
 * Envia um e-mail via Resend API.
 *
 * @param string      $subject  Assunto do e-mail
 * @param string      $html     Corpo HTML do e-mail
 * @param string|null $to       Destinatário (null = usa MAIL_TO do .env)
 */
function sendEmail(string $subject, string $html, ?string $to = null): bool
{
    $provider = env('MAIL_PROVIDER', 'resend');

    if ($provider !== 'resend') {
        throw new RuntimeException('Provedor de e-mail não configurado.');
    }

    $apiKey = env('MAIL_API_KEY');
    $from   = env('MAIL_FROM');
    $to     = $to ?? env('MAIL_TO');

    if (!$apiKey || str_starts_with($apiKey, 'sua_chave') || !$from || !$to) {
        return false;
    }

    $payload = json_encode([
        'from'    => $from,
        'to'      => [$to],
        'subject' => $subject,
        'html'    => $html,
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_TIMEOUT    => 15,
    ]);

    $body       = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError  = curl_error($ch);
    curl_close($ch);

    if ($curlError || $statusCode < 200 || $statusCode >= 300) {
        error_log('[Email] Falha ao enviar. Status: ' . $statusCode . ' | Erro cURL: ' . $curlError . ' | Resposta: ' . $body);
        return false;
    }

    return true;
}
