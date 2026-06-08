// admin/dashboard.js — popula cards KPI com dados reais e atualiza a cada 30s

const HOJE = new Date().toISOString().split('T')[0];

async function apiFetch(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setLoading() {
  ['kpi-mes', 'kpi-pacientes', 'kpi-hoje', 'kpi-nota'].forEach(id => setText(id, '…'));
}

async function atualizarDashboard() {
  try {
    const [agendamentos, pacientes] = await Promise.all([
      apiFetch('/api/agendamentos.php'),
      apiFetch('/api/pacientes.php'),
    ]);

    const mesAtual   = HOJE.slice(0, 7);
    const doMes      = agendamentos.filter(a => (a.data_consulta || '').startsWith(mesAtual));
    const deHoje     = agendamentos.filter(a => a.data_consulta === HOJE);

    setText('kpi-mes',       doMes.length);
    setText('kpi-pacientes', pacientes.length);
    setText('kpi-hoje',      deHoje.length);
    setText('dash-hoje-count', deHoje.length);

    // Avaliação média (se existir endpoint ou campo nota nos agendamentos)
    const comNota = agendamentos.filter(a => a.nota != null);
    if (comNota.length) {
      const media = (comNota.reduce((s, a) => s + Number(a.nota), 0) / comNota.length).toFixed(1);
      setText('kpi-nota', media);
    } else {
      setText('kpi-nota', '—');
    }

    renderTabelaHoje(deHoje);
    renderProfsHoje(deHoje);

  } catch {
    // falha silenciosa — não quebra o layout
  }
}

function renderTabelaHoje(agendamentos) {
  const tbody = document.getElementById('dash-table-body');
  if (!tbody) return;

  if (!agendamentos.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Nenhum agendamento para hoje.</td></tr>';
    return;
  }

  tbody.innerHTML = agendamentos.map(a => {
    const statusMap = {
      pendente:   ['badge-amber', 'Pendente'],
      confirmado: ['badge-green', 'Confirmado'],
      cancelado:  ['badge-red',   'Cancelado'],
    };
    const [cls, label] = statusMap[(a.status || '').toLowerCase()] || ['badge-muted', a.status || '—'];
    return `<tr>
      <td>${a.paciente || (a.pacientes?.nome_completo) || '—'}</td>
      <td>${a.especialidade || (a.profissionais?.especialidades?.nome) || '—'}</td>
      <td>${a.profissional  || (a.profissionais?.nome) || '—'}</td>
      <td>${String(a.horario || '').slice(0, 5) || '—'}</td>
      <td><span class="badge ${cls}">${label}</span></td>
    </tr>`;
  }).join('');
}

function renderProfsHoje(agendamentos) {
  const cont = document.getElementById('profs-hoje');
  if (!cont) return;

  const contagem = {};
  agendamentos.forEach(a => {
    const nome = a.profissional || a.profissionais?.nome || '—';
    contagem[nome] = (contagem[nome] || 0) + 1;
  });

  const profs = Object.entries(contagem);
  if (!profs.length) {
    cont.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Nenhum profissional hoje.</p>';
    return;
  }

  cont.innerHTML = profs.map(([nome, qtd]) => {
    const partes = nome.replace(/^(Dr\.|Dra\.)\s*/i, '').trim().split(' ');
    const iniciais = ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
    return `<div class="mini-item">
      <div class="avatar avatar-sm">${iniciais}</div>
      <div class="mini-item-info">
        <div class="mini-item-name">${nome}</div>
        <div class="mini-item-sub">${qtd} consulta${qtd !== 1 ? 's' : ''}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── Clique nos cards KPI ─────────────────────────────────────── */
function configurarCliqueCards() {
  const ações = {
    'kpi-mes':       '../admin/agenda.html',
    'kpi-pacientes': '../admin/pacientes.html',
    'kpi-hoje':      `../admin/agenda.html?data=${HOJE}`,
    'kpi-nota':      '../admin/avaliacoes.html',
  };

  Object.entries(ações).forEach(([id, href]) => {
    const card = document.getElementById(id)?.closest('.kpi-card');
    if (!card) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => { window.location.href = href; });
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setLoading();
  configurarCliqueCards();
  atualizarDashboard();
  setInterval(atualizarDashboard, 30_000);
});
