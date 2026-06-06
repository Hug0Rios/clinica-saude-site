<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../helpers/response.php';

function criarAgendamento(array $data): array
{
    $nome = requiredString($data, 'nome', 120);
    $email = validEmail($data, 'email');
    $telefone = requiredString($data, 'telefone', 40);
    $servico = requiredString($data, 'servico', 80);
    $profissional = requiredString($data, 'profissional', 120);
    $dataConsulta = requiredString($data, 'data', 20);
    $horario = requiredString($data, 'horario', 10);
    $motivo = trim((string)($data['motivo'] ?? ''));

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataConsulta)) {
        throw new InvalidArgumentException('Data da consulta inválida.');
    }

    if (!preg_match('/^\d{2}:\d{2}$/', $horario)) {
        throw new InvalidArgumentException('Horário da consulta inválido.');
    }

    $stmt = db()->prepare(
        'INSERT INTO agendamentos
            (nome, email, telefone, servico, profissional, data_consulta, horario, motivo, criado_em)
         VALUES
            (:nome, :email, :telefone, :servico, :profissional, :data_consulta, :horario, :motivo, NOW())'
    );

    $stmt->execute([
        ':nome' => $nome,
        ':email' => $email,
        ':telefone' => $telefone,
        ':servico' => $servico,
        ':profissional' => $profissional,
        ':data_consulta' => $dataConsulta,
        ':horario' => $horario,
        ':motivo' => $motivo,
    ]);

    // Escapar para HTML antes de inserir no corpo do e-mail
    $e = fn(string $v) => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $dataFormatada = date('d/m/Y', strtotime($dataConsulta));

    $dadosEmail = [
        'nome'         => $e($nome),
        'email'        => $e($email),
        'telefone'     => $e($telefone),
        'servico'      => $e($servico),
        'profissional' => $e($profissional),
        'data'         => $e($dataFormatada),
        'horario'      => $e($horario),
        'motivo'       => $e($motivo ?: '—'),
    ];

    // Notificação interna para a clínica
    $notificacaoClinica = sendEmail(
        'Novo agendamento — Clínica Vitalis',
        emailAgendamento($dadosEmail)
    );

    // Confirmação para o paciente
    $confirmacaoPaciente = false;
    if (env('MAIL_PATIENT_CONFIRM', 'true') !== 'false') {
        $confirmacaoPaciente = sendEmail(
            'Sua consulta foi agendada — Clínica Vitalis',
            emailConfirmacaoPaciente($dadosEmail),
            $email
        );
    }

    return [
        'id'                    => (int)db()->lastInsertId(),
        'email_enviado'         => $notificacaoClinica,
        'confirmacao_paciente'  => $confirmacaoPaciente,
    ];
}

function emailConfirmacaoPaciente(array $d): string
{
    return <<<HTML
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">

          <!-- HEADER -->
          <tr><td style="background:linear-gradient(135deg,#123b63 0%,#1a73e8 100%);padding:36px 32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;margin-bottom:12px;">&#9829;</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:-.3px;">Clínica Vitalis</h1>
            <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:13px;">Confirmação de Agendamento</p>
          </td></tr>

          <!-- SAUDAÇÃO -->
          <tr><td style="padding:32px 32px 0;">
            <p style="color:#374151;font-size:16px;margin:0;">Olá, <strong style="color:#111827;">{$d['nome']}</strong>!</p>
            <p style="color:#6b7280;font-size:14px;margin:8px 0 0;line-height:1.6;">Sua consulta foi confirmada com sucesso. Confira abaixo todos os detalhes do seu agendamento.</p>
          </td></tr>

          <!-- CARD DESTAQUE: DATA E HORA -->
          <tr><td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#eaf6f3,#e0f2fe);border-radius:10px;padding:24px;text-align:center;">
                  <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Data e Horário</p>
                  <p style="color:#123b63;font-size:28px;font-weight:700;margin:0;">{$d['data']}</p>
                  <p style="color:#1a73e8;font-size:20px;font-weight:600;margin:6px 0 0;">às {$d['horario']}</p>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- DETALHES -->
          <tr><td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;background:#fafafa;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;width:40%;">Especialidade</td>
                  <td style="color:#111827;font-size:14px;font-weight:600;">{$d['servico']}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;width:40%;">Profissional</td>
                  <td style="color:#111827;font-size:14px;font-weight:600;">{$d['profissional']}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;background:#fafafa;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;width:40%;">Telefone</td>
                  <td style="color:#111827;font-size:14px;">{$d['telefone']}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:14px 18px;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;width:40%;">Motivo</td>
                  <td style="color:#374151;font-size:14px;">{$d['motivo']}</td>
                </tr></table>
              </td></tr>
            </table>
          </td></tr>

          <!-- INFORMAÇÕES ÚTEIS -->
          <tr><td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;">
              <tr><td>
                <p style="color:#92400e;font-size:13px;font-weight:600;margin:0 0 8px;">&#9888; Lembre-se de trazer:</p>
                <ul style="color:#78350f;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
                  <li>Documento com foto (RG ou CNH)</li>
                  <li>CPF</li>
                  <li>Cartão do convênio, se houver</li>
                  <li>Exames anteriores relacionados à consulta</li>
                  <li>Chegue com 10 minutos de antecedência</li>
                </ul>
              </td></tr>
            </table>
          </td></tr>

          <!-- LOCALIZAÇÃO -->
          <tr><td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:8px;padding:16px;">
              <tr><td>
                <p style="color:#0369a1;font-size:13px;font-weight:700;margin:0 0 4px;">&#128205; Como chegar</p>
                <p style="color:#0c4a6e;font-size:13px;margin:0;line-height:1.6;">R. Halfeld, 1179 - Centro, Juiz de Fora - MG<br>
                <span style="color:#6b7280;">&#128222; (32) 2102-7700 &nbsp;|&nbsp; WhatsApp: (32) 99136-2745</span></p>
              </td></tr>
            </table>
          </td></tr>

          <!-- FOOTER -->
          <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Clínica Vitalis &mdash; Juiz de Fora, MG</p>
            <p style="color:#d1d5db;font-size:11px;margin:4px 0 0;">Este é um e-mail automático. Para cancelar ou reagendar, ligue para (32) 2102-7700.</p>
          </td></tr>

        </table>
      </td></tr>
    </table>
    </body></html>
    HTML;
}

function emailAgendamento(array $d): string
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
            <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">Notificação de novo agendamento</p>
          </td></tr>
          <tr><td style="padding:32px;">
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Um novo agendamento foi recebido pelo sistema.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:6px 6px 0 0;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Paciente</small>
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
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Especialidade</small>
                <p style="color:#111827;margin:4px 0 0;font-size:15px;">{$d['servico']}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Profissional</small>
                <p style="color:#111827;margin:4px 0 0;font-size:15px;">{$d['profissional']}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Data e Horário</small>
                <p style="color:#111827;margin:4px 0 0;font-size:15px;font-weight:600;">{$d['data']} às {$d['horario']}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:0 0 6px 6px;">
                <small style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Motivo / Observações</small>
                <p style="color:#374151;margin:4px 0 0;font-size:15px;">{$d['motivo']}</p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Clínica Vitalis &mdash; Sistema de agendamento online</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    </body></html>
    HTML;
}
