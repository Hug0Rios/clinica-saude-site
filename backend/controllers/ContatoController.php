<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../helpers/response.php';

function criarContato(array $data): array
{
    $nome = requiredString($data, 'nome', 120);
    $email = validEmail($data, 'email');
    $telefone = trim((string)($data['telefone'] ?? ''));
    $mensagem = requiredString($data, 'mensagem', 2000);

    $stmt = db()->prepare(
        'INSERT INTO contatos (nome, email, telefone, mensagem, criado_em)
         VALUES (:nome, :email, :telefone, :mensagem, NOW())'
    );

    $stmt->execute([
        ':nome' => $nome,
        ':email' => $email,
        ':telefone' => $telefone,
        ':mensagem' => $mensagem,
    ]);

    // Escapar para HTML antes de inserir no corpo do e-mail
    $e = fn(string $v) => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $emailEnviado = sendEmail(
        'Novo contato — Clínica Vitalis',
        emailContato([
            'nome'      => $e($nome),
            'email'     => $e($email),
            'telefone'  => $e($telefone ?: '—'),
            'mensagem'  => nl2br($e($mensagem)),
        ])
    );

    return [
        'id'            => (int)db()->lastInsertId(),
        'email_enviado' => $emailEnviado,
    ];
}

function emailContato(array $d): string
{
    return <<<HTML
    <!DOCTYPE html>
    <html lang="pt-BR">
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
          <tr><td style="background:#1a73e8;padding:28px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">&#10083; Clínica Vitalis</h1>
            <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">Nova mensagem de contato recebida</p>
          </td></tr>
          <tr><td style="padding:32px;">
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Uma nova mensagem foi enviada pelo formulário de contato do site.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:6px 6px 0 0;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Nome</small>
                <p style="color:#111827;margin:4px 0 0;font-size:15px;font-weight:600;">{$d['nome']}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">E-mail</small>
                <p style="color:#111827;margin:4px 0 0;font-size:15px;">{$d['email']}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Telefone</small>
                <p style="color:#111827;margin:4px 0 0;font-size:15px;">{$d['telefone']}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:0 0 6px 6px;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Mensagem</small>
                <p style="color:#374151;margin:4px 0 0;font-size:15px;line-height:1.6;">{$d['mensagem']}</p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Clínica Vitalis &mdash; Formulário de contato do site</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    </body></html>
    HTML;
}
