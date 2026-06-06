/* ================================================================
   vitalis-admin.js — Painel Admin Clínica Vitalis
   Usa: vitalis-db.js (Supabase) + localStorage para dados extras
================================================================ */

const DB = window.VITALIS_DB;

/* ----------------------------------------------------------------
   CONSTANTES / DADOS ESTÁTICOS
---------------------------------------------------------------- */
const SECTION_TITLES = {
  dashboard: 'Dashboard', agenda: 'Agenda', pacientes: 'Pacientes',
  profissionais: 'Profissionais', especialidades: 'Especialidades',
  avaliacoes: 'Avaliações', configuracoes: 'Configurações',
};

const PROFISSIONAIS_BASE = [
  { id: 'carlos-silva',      nome: 'Dr. Carlos Silva',      esp: 'Clínica Geral',  crm: 'CRM/SP 12345', status: 'ativo' },
  { id: 'marina-costa',      nome: 'Dra. Marina Costa',     esp: 'Cardiologia',    crm: 'CRM/SP 23456', status: 'ativo' },
  { id: 'fernando-oliveira', nome: 'Dr. Fernando Oliveira', esp: 'Odontologia',    crm: 'CRO/SP 34567', status: 'ativo' },
  { id: 'ana-paula',         nome: 'Dra. Ana Paula',        esp: 'Fisioterapia',   crm: 'CREFITO 4567', status: 'ativo' },
  { id: 'roberto-santos',    nome: 'Dr. Roberto Santos',    esp: 'Dermatologia',   crm: 'CRM/SP 56789', status: 'ativo' },
  { id: 'juliana-martins',   nome: 'Dra. Juliana Martins',  esp: 'Nutrição',       crm: 'CRN/SP 67890', status: 'ativo' },
];

const DIAS_SEMANA = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

/* ----------------------------------------------------------------
   CACHE
---------------------------------------------------------------- */
let _agendamentos = [];
let _avaliacoes   = [];
let _contatos     = [];

/* ----------------------------------------------------------------
   HELPERS
---------------------------------------------------------------- */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  const [y,m,d] = String(iso).split('T')[0].split('-');
  return d + '/' + m + '/' + y;
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    const dt = new Date(iso);
    return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  } catch (e) { return iso; }
}

function initials(nome) {
  const parts = String(nome || '').replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function statusBadge(status) {
  const map = {
    pendente:   ['badge-amber',  'Pendente'],
    confirmado: ['badge-green',  'Confirmado'],
    cancelado:  ['badge-red',    'Cancelado'],
    ativo:      ['badge-green',  'Ativo'],
    inativo:    ['badge-muted',  'Inativo'],
    aprovada:   ['badge-green',  'Publicado'],
    pendente_av:['badge-amber',  'Pendente'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return '<span class="badge ' + cls + '">' + esc(label) + '</span>';
}

function starsSVG(nota) {
  let out = '<span class="stars-row">';
  for (let i = 1; i <= 5; i++) {
    out += '<svg width="13" height="13" viewBox="0 0 24 24" fill="' +
      (i <= nota ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }
  return out + '</span>';
}

function toast(msg, type) {
  type = type || 'info';
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('show'); }); });
  setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3500);
}

function showModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

/* ----------------------------------------------------------------
   CARREGAMENTO DE DADOS
---------------------------------------------------------------- */
async function loadAll() {
  const today = new Date().toISOString().split('T')[0];

  const [ag, av, ct] = await Promise.all([
    DB ? DB.select('agendamentos', 'select=*&order=data_consulta.asc,horario.asc') : Promise.resolve([]),
    DB ? DB.select('avaliacoes',   'select=*&order=criado_em.desc') : Promise.resolve([]),
    DB ? DB.select('contatos',     'select=*&order=criado_em.desc') : Promise.resolve([]),
  ]);

  /* Mescla com localStorage */
  const lsAg = JSON.parse(localStorage.getItem('vitalis_agendamentos') || '[]');
  const sbIds = new Set((ag || []).map(function (a) { return a.protocol || a.id; }));
  const extras = lsAg.filter(function (a) { return !sbIds.has(a.protocol); });

  _agendamentos = (ag || []).concat(extras.map(function (a, i) {
    return Object.assign({ id: 'ls_' + i }, a);
  }));
  _avaliacoes   = av || [];
  _contatos     = ct || [];

  updateKPIs(today);
  updateBadges();
}

function updateKPIs(today) {
  const mesAtual = today.slice(0,7);
  const mes      = _agendamentos.filter(function (a) { return (a.data_consulta || '').startsWith(mesAtual); }).length;
  const hojeAg   = _agendamentos.filter(function (a) { return a.data_consulta === today; });
  const pacientes = new Set(_agendamentos.map(function (a) { return a.email || a.nome; })).size;
  const aprov     = _avaliacoes.filter(function (a) { return a.aprovada; });
  const media     = aprov.length ? (aprov.reduce(function (s,a) { return s + Number(a.nota); }, 0) / aprov.length).toFixed(1) : '—';

  setText('kpi-mes', mes);
  setText('kpi-pacientes', pacientes);
  setText('kpi-hoje', hojeAg.length);
  setText('kpi-nota', media);
  setText('kpi-delta-hoje', hojeAg.length + ' hoje');
  setText('kpi-delta-nota', media !== '—' ? '★ ' + media : '—');
  setText('kpi-delta-mes', '+' + mes + ' mês');
  setText('dash-hoje-count', hojeAg.length);
}

function updateBadges() {
  const pendentes = _agendamentos.filter(function (a) { return a.status === 'pendente'; }).length;
  const pendAval  = _avaliacoes.filter(function (a) { return !a.aprovada; }).length;
  setBadge('count-agenda', pendentes);
  setBadge('count-aval',   pendAval);
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function setBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = count;
  el.classList.toggle('hidden', count === 0);
}

/* ----------------------------------------------------------------
   DASHBOARD
---------------------------------------------------------------- */
function renderDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const hojeAg = _agendamentos.filter(function (a) { return a.data_consulta === today; });

  /* Tabela principal */
  const tbody = document.getElementById('dash-table-body');
  if (!hojeAg.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Nenhuma consulta agendada para hoje.</td></tr>';
  } else {
    tbody.innerHTML = hojeAg.slice(0, 8).map(function (a) {
      return '<tr>' +
        '<td><div class="avatar-row"><div class="avatar avatar-sm">' + initials(a.nome) + '</div><span>' + esc(a.nome) + '</span></div></td>' +
        '<td>' + esc(a.servico) + '</td>' +
        '<td>' + esc(a.profissional) + '</td>' +
        '<td>' + esc(a.horario || '—') + '</td>' +
        '<td>' + statusBadge(a.status || 'pendente') + '</td>' +
        '</tr>';
    }).join('');
  }

  /* Profissionais hoje */
  const profHoje = document.getElementById('profs-hoje');
  const profsAtivos = PROFISSIONAIS_BASE.filter(function (p) {
    return hojeAg.some(function (a) { return a.profissional === p.nome; });
  });
  profHoje.innerHTML = profsAtivos.length ? profsAtivos.map(function (p) {
    const n = hojeAg.filter(function (a) { return a.profissional === p.nome; }).length;
    return '<div class="mini-item"><div class="avatar avatar-sm">' + initials(p.nome) + '</div><div class="mini-item-info"><div class="mini-name">' + esc(p.nome) + '</div><div class="mini-sub">' + esc(p.esp) + ' · ' + n + ' consulta' + (n > 1 ? 's' : '') + '</div></div></div>';
  }).join('') : '<p style="font-size:13px;color:var(--text-muted)">Nenhum profissional com agenda hoje.</p>';

  /* Avaliações recentes */
  const avalDiv = document.getElementById('aval-recentes');
  const recentes = _avaliacoes.slice(0, 4);
  avalDiv.innerHTML = recentes.length ? recentes.map(function (a) {
    return '<div class="mini-item"><div class="avatar avatar-sm avatar-amber">' + initials(a.nome) + '</div><div class="mini-item-info"><div class="mini-name">' + esc(a.nome) + '</div><div class="mini-sub">' + starsSVG(a.nota) + '</div></div></div>';
  }).join('') : '<p style="font-size:13px;color:var(--text-muted)">Nenhuma avaliação registrada.</p>';
}

/* ----------------------------------------------------------------
   AGENDA
---------------------------------------------------------------- */
function renderAgenda() {
  const filterData   = document.getElementById('ag-filter-data').value;
  const filterProf   = document.getElementById('ag-filter-prof').value;
  const filterStatus = document.getElementById('ag-filter-status').value;

  let items = _agendamentos.slice().sort(function (a,b) {
    const d = (a.data_consulta||'').localeCompare(b.data_consulta||'');
    return d !== 0 ? d : (a.horario||'').localeCompare(b.horario||'');
  });

  if (filterData)   items = items.filter(function (a) { return a.data_consulta === filterData; });
  if (filterProf)   items = items.filter(function (a) { return a.profissional === filterProf; });
  if (filterStatus) items = items.filter(function (a) { return a.status === filterStatus; });

  const tbody = document.getElementById('ag-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nenhum agendamento encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (a) {
    const id = a.id;
    return '<tr id="ag-row-' + id + '">' +
      '<td style="font-weight:600">' + esc(a.horario || '—') + '<br><small style="color:var(--text-muted);font-weight:400">' + fmtDate(a.data_consulta) + '</small></td>' +
      '<td><div class="avatar-row"><div class="avatar avatar-sm">' + initials(a.nome) + '</div><div><div style="font-weight:600;font-size:13px">' + esc(a.nome) + '</div><div style="color:var(--text-muted);font-size:12px">' + esc(a.email) + '</div></div></div></td>' +
      '<td>' + esc(a.servico) + '</td>' +
      '<td>' + esc(a.profissional) + '</td>' +
      '<td>' + statusBadge(a.status || 'pendente') + '</td>' +
      '<td><div class="table-actions">' +
        '<button class="btn-icon" title="Ver" onclick="viewAgendamento(\'' + id + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<button class="btn-icon btn-success" title="Confirmar" onclick="setAgStatus(\'' + id + '\',\'confirmado\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>' +
        '<button class="btn-icon btn-danger" title="Cancelar" onclick="setAgStatus(\'' + id + '\',\'cancelado\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div></td>' +
      '</tr>';
  }).join('');
}

window.viewAgendamento = function (id) {
  const a = _agendamentos.find(function (x) { return String(x.id) === String(id); });
  if (!a) return;
  showModal('Detalhes do Agendamento',
    detailRow('Paciente', a.nome) +
    detailRow('E-mail', a.email) +
    detailRow('Telefone', a.telefone) +
    detailRow('CPF', a.cpf) +
    detailRow('Especialidade', a.servico) +
    detailRow('Profissional', a.profissional) +
    detailRow('Data', fmtDate(a.data_consulta)) +
    detailRow('Horário', a.horario) +
    detailRow('Motivo', a.motivo) +
    detailRow('Status', statusBadge(a.status || 'pendente')) +
    detailRow('Protocolo', a.protocol || a.id)
  );
};

window.setAgStatus = async function (id, status) {
  /* Tenta Supabase se ID numérico */
  if (DB && !String(id).startsWith('ls_')) {
    const ok = await DB.update('agendamentos', { status: status }, 'id=eq.' + id);
    if (!ok) { toast('Erro ao atualizar.', 'error'); return; }
  }
  /* Atualiza cache local */
  const item = _agendamentos.find(function (a) { return String(a.id) === String(id); });
  if (item) item.status = status;
  /* Atualiza localStorage */
  updateLsStatus(id, status);
  toast('Status atualizado.', 'success');
  renderAgenda();
  updateBadges();
};

function updateLsStatus(id, status) {
  const lista = JSON.parse(localStorage.getItem('vitalis_agendamentos') || '[]');
  lista.forEach(function (a, i) { if ('ls_' + i === id || a.protocol === id) a.status = status; });
  localStorage.setItem('vitalis_agendamentos', JSON.stringify(lista));
}

/* ----------------------------------------------------------------
   PACIENTES
---------------------------------------------------------------- */
function renderPacientes(query) {
  /* Agrupa agendamentos por e-mail para derivar histórico */
  const map = {};
  _agendamentos.forEach(function (a) {
    const key = a.email || a.nome;
    if (!map[key]) {
      map[key] = { nome: a.nome, email: a.email, telefone: a.telefone, cpf: a.cpf, consultas: [] };
    }
    map[key].consultas.push(a);
  });

  let items = Object.values(map);
  if (query) {
    const q = query.toLowerCase();
    items = items.filter(function (p) {
      return (p.nome||'').toLowerCase().includes(q) || (p.cpf||'').replace(/\D/g,'').includes(q.replace(/\D/g,''));
    });
  }

  const tbody = document.getElementById('pac-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nenhum paciente encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (p, idx) {
    const last = p.consultas.sort(function (a,b) { return (b.data_consulta||'').localeCompare(a.data_consulta||''); })[0];
    return '<tr>' +
      '<td><div class="avatar-row"><div class="avatar avatar-sm">' + initials(p.nome) + '</div><div style="font-weight:600">' + esc(p.nome) + '</div></div></td>' +
      '<td><div style="font-size:13px">' + esc(p.email) + '</div><div style="font-size:12px;color:var(--text-muted)">' + esc(p.telefone||'—') + '</div></td>' +
      '<td>' + (last ? fmtDate(last.data_consulta) : '—') + '</td>' +
      '<td>' + (last ? esc(last.servico) : '—') + '</td>' +
      '<td>' + statusBadge('ativo') + '</td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="viewHistorico(\'' + esc(p.email||p.nome) + '\')">Ver histórico</button></td>' +
      '</tr>';
  }).join('');
}

window.viewHistorico = function (email) {
  const consultas = _agendamentos.filter(function (a) { return (a.email || a.nome) === email; })
    .sort(function (a,b) { return (b.data_consulta||'').localeCompare(a.data_consulta||''); });

  const rows = consultas.map(function (a) {
    return '<tr><td>' + fmtDate(a.data_consulta) + '</td><td>' + esc(a.horario||'—') + '</td><td>' + esc(a.servico) + '</td><td>' + esc(a.profissional) + '</td><td>' + statusBadge(a.status||'pendente') + '</td></tr>';
  }).join('') || '<tr><td colspan="5" class="table-empty">Nenhuma consulta.</td></tr>';

  showModal('Histórico de consultas',
    '<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Horário</th><th>Especialidade</th><th>Profissional</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
  );
};

/* ----------------------------------------------------------------
   PROFISSIONAIS
---------------------------------------------------------------- */
function getProfissionais() {
  const ls = JSON.parse(localStorage.getItem('vitalis_profissionais') || '[]');
  return PROFISSIONAIS_BASE.concat(ls.filter(function (p) {
    return !PROFISSIONAIS_BASE.some(function (b) { return b.id === p.id; });
  }));
}

function renderProfissionais() {
  const profs = getProfissionais();
  const tbody = document.getElementById('prof-tbody');
  tbody.innerHTML = profs.map(function (p) {
    const consultas = _agendamentos.filter(function (a) {
      return a.profissional === p.nome && (a.data_consulta||'').startsWith(new Date().toISOString().slice(0,7));
    }).length;
    return '<tr>' +
      '<td><div class="avatar-row"><div class="avatar avatar-sm">' + initials(p.nome) + '</div><div style="font-weight:600">' + esc(p.nome) + '</div></div></td>' +
      '<td>' + esc(p.esp) + '</td>' +
      '<td style="font-size:12px;color:var(--text-muted)">' + esc(p.crm) + '</td>' +
      '<td>' + consultas + '</td>' +
      '<td>' + statusBadge(p.status || 'ativo') + '</td>' +
      '<td><div class="table-actions">' +
        '<button class="btn btn-ghost btn-sm" onclick="editProf(\'' + esc(p.id) + '\')">Editar</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="verAgendaProf(\'' + esc(p.nome) + '\')">Ver agenda</button>' +
      '</div></td>' +
      '</tr>';
  }).join('');
}

window.editProf = function (id) {
  const profs = getProfissionais();
  const p = profs.find(function (x) { return x.id === id; });
  if (!p) return;
  showModal('Editar profissional', profForm(p));
};

window.verAgendaProf = function (nome) {
  const cons = _agendamentos.filter(function (a) { return a.profissional === nome; })
    .sort(function (a,b) { return (a.data_consulta||'').localeCompare(b.data_consulta||''); });
  const rows = cons.slice(0,10).map(function (a) {
    return '<tr><td>' + fmtDate(a.data_consulta) + '</td><td>' + esc(a.horario||'—') + '</td><td>' + esc(a.nome) + '</td><td>' + statusBadge(a.status||'pendente') + '</td></tr>';
  }).join('') || '<tr><td colspan="4" class="table-empty">Sem consultas registradas.</td></tr>';
  showModal('Agenda — ' + nome,
    '<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Horário</th><th>Paciente</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
  );
};

function profForm(p) {
  p = p || {};
  return '<div class="form-grid" style="gap:14px">' +
    '<div class="field"><label class="field-label">Nome</label><input class="field-input" id="pf-nome" value="' + esc(p.nome||'') + '" placeholder="Dr. Nome Sobrenome"></div>' +
    '<div class="field"><label class="field-label">Especialidade</label><input class="field-input" id="pf-esp" value="' + esc(p.esp||'') + '" placeholder="Cardiologia"></div>' +
    '<div class="field"><label class="field-label">Registro</label><input class="field-input" id="pf-crm" value="' + esc(p.crm||'') + '" placeholder="CRM/SP 00000"></div>' +
    '<button class="btn btn-primary btn-full" onclick="saveProf(\'' + esc(p.id||'') + '\')">Salvar</button>' +
    '</div>';
}

window.saveProf = function (id) {
  const nome = document.getElementById('pf-nome').value.trim();
  const esp  = document.getElementById('pf-esp').value.trim();
  const crm  = document.getElementById('pf-crm').value.trim();
  if (!nome || !esp) { toast('Preencha nome e especialidade.', 'error'); return; }

  const lista = JSON.parse(localStorage.getItem('vitalis_profissionais') || '[]');
  const novo  = { id: id || 'p_' + Date.now(), nome: nome, esp: esp, crm: crm, status: 'ativo' };

  if (id) {
    const idx = lista.findIndex(function (p) { return p.id === id; });
    if (idx >= 0) lista[idx] = novo; else lista.push(novo);
  } else {
    lista.push(novo);
  }

  localStorage.setItem('vitalis_profissionais', JSON.stringify(lista));
  toast('Profissional salvo.', 'success');
  hideModal();
  renderProfissionais();
};

/* ----------------------------------------------------------------
   ESPECIALIDADES
---------------------------------------------------------------- */
function renderEspecialidades() {
  const profs = getProfissionais();
  const tbody = document.getElementById('esp-tbody');
  tbody.innerHTML = profs.map(function (p) {
    const n = _agendamentos.filter(function (a) {
      return a.profissional === p.nome && (a.data_consulta||'').startsWith(new Date().toISOString().slice(0,7));
    }).length;
    return '<tr>' +
      '<td style="font-weight:600">' + esc(p.esp) + '</td>' +
      '<td><div class="avatar-row"><div class="avatar avatar-sm">' + initials(p.nome) + '</div>' + esc(p.nome) + '</div></td>' +
      '<td>' + n + '</td>' +
      '<td>' + statusBadge('ativo') + '</td>' +
      '</tr>';
  }).join('');
}

/* ----------------------------------------------------------------
   AVALIAÇÕES
---------------------------------------------------------------- */
function renderAvaliacoes() {
  const aprov  = _avaliacoes.filter(function (a) { return a.aprovada; });
  const media  = aprov.length ? (aprov.reduce(function (s,a) { return s + Number(a.nota); }, 0) / aprov.length).toFixed(1) : '—';
  const semana = (function () {
    const sete = new Date(); sete.setDate(sete.getDate() - 7);
    return _avaliacoes.filter(function (a) { return new Date(a.criado_em) >= sete; }).length;
  })();

  setText('av-kpi-media', media !== '—' ? media + ' / 5' : '—');
  setText('av-kpi-total', _avaliacoes.length);
  setText('av-kpi-semana', semana);

  const tbody = document.getElementById('av-tbody');
  if (!_avaliacoes.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nenhuma avaliação registrada.</td></tr>';
    return;
  }

  tbody.innerHTML = _avaliacoes.map(function (a) {
    return '<tr id="av-row-' + a.id + '">' +
      '<td><div class="avatar-row"><div class="avatar avatar-sm avatar-amber">' + initials(a.nome) + '</div>' + esc(a.nome) + '</div></td>' +
      '<td>' + starsSVG(a.nota) + '</td>' +
      '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(a.comentario) + '">' + esc((a.comentario||'').slice(0,60)) + (a.comentario && a.comentario.length > 60 ? '…' : '') + '</td>' +
      '<td>' + fmtDate(a.criado_em) + '</td>' +
      '<td>' + (a.aprovada ? statusBadge('aprovada') : statusBadge('pendente')) + '</td>' +
      '<td><div class="table-actions">' +
        '<button class="btn-icon" title="Ver" onclick="viewAval(' + a.id + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        (!a.aprovada
          ? '<button class="btn-icon btn-success" title="Publicar" onclick="toggleAval(' + a.id + ',true)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>'
          : '<button class="btn-icon btn-danger" title="Ocultar" onclick="toggleAval(' + a.id + ',false)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>') +
      '</div></td>' +
      '</tr>';
  }).join('');
}

window.viewAval = function (id) {
  const a = _avaliacoes.find(function (x) { return x.id == id; });
  if (!a) return;
  showModal('Avaliação completa',
    detailRow('Paciente', a.nome) +
    detailRow('Nota', starsSVG(a.nota)) +
    detailRow('Data', fmtDate(a.criado_em)) +
    detailRow('Status', a.aprovada ? statusBadge('aprovada') : statusBadge('pendente')) +
    '<div class="detail-row" style="flex-direction:column;gap:8px"><span class="detail-label-col">Comentário</span><span class="detail-value-col" style="background:var(--bg-subtle);padding:14px;border-radius:var(--r-sm);line-height:1.7">' + esc(a.comentario) + '</span></div>'
  );
};

window.toggleAval = async function (id, aprovada) {
  if (!DB) { toast('Banco não conectado.', 'error'); return; }
  const ok = await DB.update('avaliacoes', { aprovada: aprovada }, 'id=eq.' + id);
  if (ok) {
    const item = _avaliacoes.find(function (a) { return a.id == id; });
    if (item) item.aprovada = aprovada;
    toast(aprovada ? 'Avaliação publicada.' : 'Avaliação ocultada.', 'success');
    renderAvaliacoes();
  } else {
    toast('Erro ao atualizar.', 'error');
  }
};

/* ----------------------------------------------------------------
   CONFIGURAÇÕES
---------------------------------------------------------------- */
function initConfiguracoes() {
  const cfg = JSON.parse(localStorage.getItem('vitalis_config') || '{}');
  if (cfg.nome)  document.getElementById('cfg-nome').value  = cfg.nome;
  if (cfg.tel)   document.getElementById('cfg-tel').value   = cfg.tel;
  if (cfg.email) document.getElementById('cfg-email').value = cfg.email;
  if (cfg.end)   document.getElementById('cfg-end').value   = cfg.end;

  /* Horários */
  const horariosDefault = {
    1: { open: '08:00', close: '18:00', ativo: true },
    2: { open: '08:00', close: '18:00', ativo: true },
    3: { open: '08:00', close: '18:00', ativo: true },
    4: { open: '08:00', close: '18:00', ativo: true },
    5: { open: '08:00', close: '18:00', ativo: true },
    6: { open: '08:00', close: '12:00', ativo: true },
    0: { open: '—',    close: '—',    ativo: false },
  };
  const horarios = cfg.horarios || horariosDefault;
  const wrap = document.getElementById('horarios-wrap');
  wrap.innerHTML = [0,1,2,3,4,5,6].map(function (d) {
    const h = horarios[d] || horariosDefault[d];
    return '<div class="horario-row">' +
      '<span class="horario-dia">' + DIAS_SEMANA[d].slice(0,3) + '</span>' +
      '<input class="field-input" type="time" id="h-' + d + '-open"  value="' + (h.open  !== '—' ? h.open  : '') + '" ' + (!h.ativo ? 'disabled' : '') + '>' +
      '<input class="field-input" type="time" id="h-' + d + '-close" value="' + (h.close !== '—' ? h.close : '') + '" ' + (!h.ativo ? 'disabled' : '') + '>' +
      '<label class="checkbox-wrap"><input type="checkbox" id="h-' + d + '-ativo" ' + (h.ativo ? 'checked' : '') + ' onchange="toggleHorario(' + d + ')"><span style="font-size:13px;color:var(--text-muted)">Aberto</span></label>' +
      '</div>';
  }).join('');
}

window.toggleHorario = function (d) {
  const checked = document.getElementById('h-' + d + '-ativo').checked;
  document.getElementById('h-' + d + '-open').disabled  = !checked;
  document.getElementById('h-' + d + '-close').disabled = !checked;
};

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('cfg-save-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    const horarios = {};
    [0,1,2,3,4,5,6].forEach(function (d) {
      horarios[d] = {
        open:  document.getElementById('h-' + d + '-open').value  || '—',
        close: document.getElementById('h-' + d + '-close').value || '—',
        ativo: document.getElementById('h-' + d + '-ativo').checked,
      };
    });
    const cfg = {
      nome:     document.getElementById('cfg-nome').value,
      tel:      document.getElementById('cfg-tel').value,
      email:    document.getElementById('cfg-email').value,
      end:      document.getElementById('cfg-end').value,
      horarios: horarios,
    };
    localStorage.setItem('vitalis_config', JSON.stringify(cfg));
    toast('Configurações salvas.', 'success');
  });
});

/* ----------------------------------------------------------------
   HELPERS
---------------------------------------------------------------- */
function detailRow(label, value) {
  return '<div class="detail-row"><span class="detail-label-col">' + esc(label) + '</span><span class="detail-value-col">' + (value || '—') + '</span></div>';
}

/* ----------------------------------------------------------------
   NAVEGAÇÃO DE SEÇÕES
---------------------------------------------------------------- */
const RENDERS = {
  dashboard:     function () { renderDashboard(); },
  agenda:        function () { renderAgenda(); },
  pacientes:     function () { renderPacientes(''); },
  profissionais: function () { renderProfissionais(); },
  especialidades:function () { renderEspecialidades(); },
  avaliacoes:    function () { renderAvaliacoes(); },
  configuracoes: function () { initConfiguracoes(); },
};

async function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.sidebar-nav-item').forEach(function (n) { n.classList.remove('active'); });

  const section = document.getElementById('section-' + name);
  if (section) section.classList.add('active');

  const navBtn = document.querySelector('[data-section="' + name + '"]');
  if (navBtn) navBtn.classList.add('active');

  document.getElementById('topbar-title').textContent = SECTION_TITLES[name] || name;
  closeSidebar();

  await loadAll();
  if (RENDERS[name]) RENDERS[name]();
}

/* ----------------------------------------------------------------
   SIDEBAR MOBILE
---------------------------------------------------------------- */
function openSidebar()  { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-backdrop').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-backdrop').classList.remove('open'); }

/* ----------------------------------------------------------------
   THEME
---------------------------------------------------------------- */
function initTheme() {
  const t = localStorage.getItem('vt_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  syncAdminTheme(t);
}

function syncAdminTheme(t) {
  const moon = document.getElementById('adm-moon');
  const sun  = document.getElementById('adm-sun');
  const lbl  = document.getElementById('adm-theme-label');
  if (moon) moon.style.display = t === 'dark' ? 'none'  : 'block';
  if (sun)  sun.style.display  = t === 'dark' ? 'block' : 'none';
  if (lbl)  lbl.textContent    = t === 'dark' ? 'Modo claro' : 'Modo escuro';
}

/* ----------------------------------------------------------------
   INIT
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async function () {
  initTheme();

  /* Supabase não configurado */
  if (!DB) {
    document.getElementById('login-screen').innerHTML =
      '<div style="text-align:center;padding:24px;max-width:400px;margin:80px auto">' +
      '<div style="background:var(--red-tint);color:#991b1b;padding:20px;border-radius:var(--r-card);font-size:14px;line-height:1.6">' +
      '<strong>Supabase não configurado.</strong><br>Abra <code>vitalis-db.js</code> e preencha as credenciais.</div></div>';
    return;
  }

  /* Já autenticado? */
  if (DB.authCheck()) {
    bootApp();
    return;
  }

  /* Login form */
  initLoginForm();
});

function initLoginForm() {
  const form    = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const btn     = document.getElementById('login-btn');
  const pwInput = document.getElementById('l-senha');
  const pwToggle = document.getElementById('pw-toggle');

  pwToggle.addEventListener('click', function () {
    const show = pwInput.type === 'password';
    pwInput.type = show ? 'text' : 'password';
    document.getElementById('eye-show').classList.toggle('hidden', show);
    document.getElementById('eye-hide').classList.toggle('hidden', !show);
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    btn.disabled = true; btn.textContent = 'Entrando…';
    errorEl.classList.add('hidden');

    const result = await DB.authLogin(
      document.getElementById('l-email').value.trim(),
      document.getElementById('l-senha').value
    );

    btn.disabled = false; btn.textContent = 'Entrar';

    if (result.ok) {
      document.getElementById('login-screen').style.display = 'none';
      bootApp();
    } else {
      errorEl.textContent = result.message || 'Credenciais inválidas.';
      errorEl.classList.remove('hidden');
    }
  });
}

async function bootApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');

  /* Sidebar nav */
  document.querySelectorAll('[data-section]').forEach(function (btn) {
    if (btn.tagName === 'A') return; /* link "Voltar ao site" */
    btn.addEventListener('click', function () { showSection(btn.dataset.section); });
  });

  /* Sidebar mobile */
  document.getElementById('menu-btn').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);

  /* Logout */
  document.getElementById('logout-btn').addEventListener('click', async function () {
    await DB.authLogout();
    location.reload();
  });

  /* Refresh */
  document.getElementById('btn-refresh').addEventListener('click', async function () {
    await loadAll();
    const active = document.querySelector('.sidebar-nav-item.active');
    if (active && active.dataset.section) RENDERS[active.dataset.section] && RENDERS[active.dataset.section]();
    toast('Dados atualizados.', 'success');
  });

  /* Agenda filters */
  document.getElementById('ag-filter-btn').addEventListener('click', renderAgenda);

  /* Pacientes search */
  document.getElementById('pac-search-btn').addEventListener('click', function () {
    renderPacientes(document.getElementById('pac-search').value.trim());
  });
  document.getElementById('pac-search').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') renderPacientes(this.value.trim());
  });

  /* Profissionais modal add */
  document.getElementById('btn-add-prof').addEventListener('click', function () {
    showModal('Adicionar profissional', profForm(null));
  });

  /* Modal close */
  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });

  /* Theme toggle (sidebar) */
  document.getElementById('admin-theme-toggle').addEventListener('click', function () {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('vt_theme', next);
    syncAdminTheme(next);
  });

  /* Data padrão agenda = hoje */
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ag-filter-data').value = today;

  /* Init dashboard */
  await showSection('dashboard');
}
