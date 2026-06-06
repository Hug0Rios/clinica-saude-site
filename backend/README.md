# Backend PHP - Clínica Vitalis

Backend em PHP puro para receber dados do front-end, salvar no MySQL com PDO e enviar notificações por e-mail usando Resend.

## Estrutura

```text
backend/
  config/
    database.php
    email.php
    env.php
  controllers/
    AgendamentoController.php
    AvaliacaoController.php
    ContatoController.php
  database/
    schema.sql
  helpers/
    response.php
  routes/
    agendamentos.php
    avaliacoes.php
    contato.php
  .env
  .env.example
```

## Configuração

1. Crie o banco usando `backend/database/schema.sql`.
2. Copie `.env.example` para `.env`.
3. Preencha os dados do MySQL.
4. Crie uma chave na Resend e coloque em `MAIL_API_KEY`.
5. Configure um domínio/remetente validado na Resend para `MAIL_FROM`.

## Rodando localmente

Na raiz do projeto:

```bash
php -S localhost:8000
```

Abra:

```text
http://localhost:8000/index.html
```

O front-end já tenta enviar:

- Agendamentos para `/backend/routes/agendamentos.php`
- Avaliações para `/backend/routes/avaliacoes.php`

Se você abrir o HTML direto pelo explorador de arquivos, o site continua funcionando com `localStorage`, mas o envio ao PHP só funciona quando servido por um servidor com PHP.

## Endpoints

### POST `/backend/routes/contato.php`

```json
{
  "nome": "Maria",
  "email": "maria@email.com",
  "telefone": "(32) 99999-9999",
  "mensagem": "Gostaria de mais informações."
}
```

### POST `/backend/routes/agendamentos.php`

```json
{
  "nome": "Maria",
  "email": "maria@email.com",
  "telefone": "(32) 99999-9999",
  "servico": "Clínica Geral",
  "profissional": "Dr. Carlos Silva",
  "data": "2026-06-08",
  "horario": "09:00",
  "motivo": "Consulta de rotina"
}
```

### GET `/backend/routes/avaliacoes.php`

Lista avaliações salvas.

### POST `/backend/routes/avaliacoes.php`

```json
{
  "nome": "Maria",
  "nota": 5,
  "comentario": "Atendimento excelente."
}
```

## Segurança

- As credenciais ficam no `.env`.
- O banco usa PDO com prepared statements.
- O PHP recebe JSON e valida campos obrigatórios.
- A chave da API de e-mail não fica no JavaScript.
