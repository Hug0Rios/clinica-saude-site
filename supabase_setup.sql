-- =================================================================
-- SETUP DO BANCO DE DADOS — Clínica Vitalis (Supabase)
--
-- Como usar:
-- 1. Acesse https://supabase.com e crie um projeto gratuito
-- 2. Vá em SQL Editor (menu lateral)
-- 3. Cole todo este arquivo e clique em "Run"
-- 4. Depois crie o usuário admin em:
--    Authentication → Users → Add user
--    (use o mesmo e-mail que você colocará no painel de login)
-- =================================================================

-- -----------------------------------------------------------------
-- TABELAS
-- -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agendamentos (
  id            bigserial PRIMARY KEY,
  nome          varchar(120)  NOT NULL,
  email         varchar(180)  NOT NULL,
  telefone      varchar(40)   NOT NULL,
  servico       varchar(80)   NOT NULL,
  profissional  varchar(120)  NOT NULL,
  data_consulta date          NOT NULL,
  horario       time          NOT NULL,
  motivo        text,
  status        varchar(20)   NOT NULL DEFAULT 'pendente',
  criado_em     timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id          bigserial PRIMARY KEY,
  nome        varchar(120)  NOT NULL,
  nota        smallint      NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario  text          NOT NULL,
  aprovada    boolean       NOT NULL DEFAULT true,
  criado_em   timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contatos (
  id        bigserial PRIMARY KEY,
  nome      varchar(120)  NOT NULL,
  email     varchar(180)  NOT NULL,
  telefone  varchar(40),
  mensagem  text          NOT NULL,
  lido      boolean       NOT NULL DEFAULT false,
  criado_em timestamptz   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Garante que visitantes só inserem, e só o admin vê tudo
-- -----------------------------------------------------------------

ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos     ENABLE ROW LEVEL SECURITY;

-- AGENDAMENTOS
DROP POLICY IF EXISTS "publico_inserir_agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "admin_tudo_agendamentos"      ON agendamentos;

CREATE POLICY "publico_inserir_agendamentos"
  ON agendamentos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "admin_tudo_agendamentos"
  ON agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- -----------------------------------------------------------------
-- FUNÇÃO: verificar_horarios_ocupados
-- Permite que usuários anônimos consultem horários ocupados
-- sem expor dados pessoais (nome, e-mail, telefone, motivo).
-- SECURITY DEFINER garante acesso à tabela ignorando RLS interno.
-- -----------------------------------------------------------------
DROP FUNCTION IF EXISTS verificar_horarios_ocupados(text, date);
CREATE OR REPLACE FUNCTION verificar_horarios_ocupados(
  p_profissional text,
  p_data         date
)
RETURNS TABLE(horario text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT horario::text
  FROM   agendamentos
  WHERE  profissional = p_profissional
    AND  data_consulta = p_data
    AND  status != 'cancelado';
$$;

GRANT EXECUTE ON FUNCTION verificar_horarios_ocupados TO anon;


-- AVALIAÇÕES
DROP POLICY IF EXISTS "publico_inserir_avaliacoes"        ON avaliacoes;
DROP POLICY IF EXISTS "publico_ler_avaliacoes_aprovadas"  ON avaliacoes;
DROP POLICY IF EXISTS "admin_tudo_avaliacoes"             ON avaliacoes;

CREATE POLICY "publico_inserir_avaliacoes"
  ON avaliacoes FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "publico_ler_avaliacoes_aprovadas"
  ON avaliacoes FOR SELECT TO anon USING (aprovada = true);

CREATE POLICY "admin_tudo_avaliacoes"
  ON avaliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- CONTATOS
DROP POLICY IF EXISTS "publico_inserir_contatos" ON contatos;
DROP POLICY IF EXISTS "admin_tudo_contatos"      ON contatos;

CREATE POLICY "publico_inserir_contatos"
  ON contatos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "admin_tudo_contatos"
  ON contatos FOR ALL TO authenticated USING (true) WITH CHECK (true);
