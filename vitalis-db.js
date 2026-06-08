// vitalis-db.js — camada de acesso à API do backend Render

async function _apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data;
}

async function getProfissionais() {
  return _apiFetch('/api/profissionais.php');
}

async function getEspecialidades() {
  const profs = await getProfissionais();
  const vistas = new Set();
  return profs
    .filter(p => {
      if (vistas.has(p.especialidade)) return false;
      vistas.add(p.especialidade);
      return true;
    })
    .map(p => ({ id: p.especialidade, nome: p.especialidade }));
}

async function getHorariosDisponiveis(profissional_id, data) {
  const ocupados = await _apiFetch(
    `/api/agendamentos.php?profissional_id=${encodeURIComponent(profissional_id)}&data=${encodeURIComponent(data)}`
  );
  const horariosOcupados = new Set(
    (Array.isArray(ocupados) ? ocupados : []).map(a => a.horario?.slice(0, 5))
  );
  return HORARIOS_PADRAO.filter(h => !horariosOcupados.has(h));
}

async function criarPaciente(dados) {
  return _apiFetch('/api/pacientes.php', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

async function criarAgendamento(dados) {
  return _apiFetch('/api/agendamentos.php', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
