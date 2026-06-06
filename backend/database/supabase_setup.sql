-- =====================================================
--  Clínica Vitalis — Setup Supabase
--  Rodar no SQL Editor: https://supabase.com/dashboard
-- =====================================================

CREATE TABLE IF NOT EXISTS especialidades (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profissionais (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text NOT NULL,
  especialidade_id uuid REFERENCES especialidades(id),
  foto_url         text,
  ativo            boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo  text NOT NULL,
  email          text UNIQUE NOT NULL,
  telefone       text,
  cpf            text UNIQUE,
  primeira_vez   boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- Ajusta agendamentos para usar FKs (se já existe, apenas adiciona colunas faltantes)
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS paciente_id      uuid REFERENCES pacientes(id),
  ADD COLUMN IF NOT EXISTS profissional_id  uuid REFERENCES profissionais(id),
  ADD COLUMN IF NOT EXISTS especialidade_id uuid REFERENCES especialidades(id),
  ADD COLUMN IF NOT EXISTS data_consulta    date,
  ADD COLUMN IF NOT EXISTS horario          text,
  ADD COLUMN IF NOT EXISTS motivo           text,
  ADD COLUMN IF NOT EXISTS status           text DEFAULT 'pendente';

-- Desativa RLS para service_role (Railway usa a service_role key)
ALTER TABLE especialidades  DISABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais   DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos    DISABLE ROW LEVEL SECURITY;

-- Seed especialidades
INSERT INTO especialidades (nome, slug) VALUES
  ('Clínica Geral', 'clinica-geral'),
  ('Cardiologia',   'cardiologia'),
  ('Odontologia',   'odontologia'),
  ('Fisioterapia',  'fisioterapia'),
  ('Dermatologia',  'dermatologia'),
  ('Nutrição',      'nutricao')
ON CONFLICT (slug) DO NOTHING;

-- Seed profissionais
INSERT INTO profissionais (nome, especialidade_id, foto_url) VALUES
  ('Dr. Carlos Silva',
   (SELECT id FROM especialidades WHERE slug = 'clinica-geral'),
   'assets/profissionais/carlos-silva.jpg'),
  ('Dra. Marina Costa',
   (SELECT id FROM especialidades WHERE slug = 'cardiologia'),
   'assets/profissionais/marina-costa.jpg'),
  ('Dr. Fernando Oliveira',
   (SELECT id FROM especialidades WHERE slug = 'odontologia'),
   'assets/profissionais/fernando-oliveira.jpg'),
  ('Dra. Ana Paula',
   (SELECT id FROM especialidades WHERE slug = 'fisioterapia'),
   'assets/profissionais/ana-paula.jpg'),
  ('Dr. Roberto Santos',
   (SELECT id FROM especialidades WHERE slug = 'dermatologia'),
   'assets/profissionais/roberto-santos.jpg'),
  ('Dra. Juliana Martins',
   (SELECT id FROM especialidades WHERE slug = 'nutricao'),
   'assets/profissionais/juliana-martins.jpg')
ON CONFLICT DO NOTHING;
