/* ================================================================
   ADMIN PANEL — Clínica Vitalis (Supabase)
================================================================ */

const DB = window.VITALIS_DB;

const SECTION_TITLES = {
  overview:     'Visão Geral',
  agendamentos: 'Agendamentos',
  avaliacoes:   'Avaliações',
  contatos:     'Mensagens',
};

/* ----------------------------------------------------------------
   FORMATO DE DATAS
---------------------------------------------------------------- */
function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function fmtTime(t) {
  return t ? String(t).slice(0, 5) : '—';
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

/* ----------------------------------------------------------------
   RENDER HELPERS
---------------------------------------------------------------- */
function statusBadge(status) {
  const map = {
    pendente:   'badge-pendente',
    confirmado: 'badge-confirmado',
    cancelado:  'badge-cancelado',
  };
  const label = { pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado' };
  return `<span class="badge ${map[status] || 'badge-pendente'}">${label[status] || status}</span>`;
}

function stars(nota) {
  return `<span class="stars">${'★'.repeat(nota)}${'☆'.repeat(5 - nota)}</span>`;
}

function trunc(str, n = 60) {
  return str && str.length > n ? str.slice(0, n) + '…' : (str || '');
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ----------------------------------------------------------------
   DASHBOARD
---------------------------------------------------------------- */
let _agendamentos = [];
let _avaliacoes   = [];
let _contatos     = [];

async function loadDashboard() {
  const [ag, av, ct] = await Promise.all([
    DB.select('agendamentos', 'select=*&order=data_consulta.asc,horario.asc'),
    DB.select('avaliacoes',   'select=*&order=criado_em.desc'),
    DB.select('contatos',     'select=*&order=criado_em.desc'),
  ]);

  _agendamentos = ag || [];
  _avaliacoes   = av || [];
  _contatos     = ct || [];

  const today = new Date().toISOString().split('T')[0];
  const hoje      = _agendamentos.filter(a => a.data_consulta === today).length;
  const pendentes = _agendamentos.filter(a => a.status === 'pendente').length;
  const aprovadas = _avaliacoes.filter(a => a.aprovada);
  const totalAv   = aprovadas.length;
  const notaMedia = totalAv > 0
    ? (aprovadas.reduce((s, a) => s + Number(a.nota), 0) / totalAv).toFixed(1)
    : 0;
  const novosMsg  = _contatos.filter(c => !c.lido).length;

  document.getElementById('stat-hoje').textContent      = hoje;
  document.getElementById('stat-pendentes').textContent = pendentes;
  document.getElementById('stat-avaliacoes').innerHTML  =
    `${totalAv} <small>${notaMedia > 0 ? '★ ' + notaMedia : ''}</small>`;
  document.getElementById('stat-contatos').textContent  = novosMsg;

  updateBadge('badge-pendentes', pendentes);
  updateBadge('badge-contatos',  novosMsg);

  const proximos = _agendamentos.filter(a => a.data_consulta >= today).slice(0, 8);
  const tbody = document.getElementById('tbody-proximos');
  if (!proximos.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhum agendamento próximo.</td></tr>';
    return;
  }
  tbody.innerHTML = proximos.map(a => `
    <tr>
      <td>${esc(a.nome)}</td>
      <td>${esc(a.servico)}</td>
      <td>${esc(a.profissional)}</td>
      <td>${fmtDate(a.data_consulta)}</td>
      <td>${fmtTime(a.horario)}</td>
      <td>${statusBadge(a.status)}</td>
    </tr>`).join('');
}

function updateBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = count;
  el.classList.toggle('hidden', count === 0);
}

/* ----------------------------------------------------------------
   AGENDAMENTOS
---------------------------------------------------------------- */
function renderAgendamentos() {
  const status = (document.getElementById('filter-status') || {}).value || '';
  const search = ((document.getElementById('filter-search') || {}).value || '').trim().toLowerCase();

  let items = (_agendamentos || []).slice().sort((a, b) => {
    const d = (b.data_consulta || '').localeCompare(a.data_consulta || '');
    return d !== 0 ? d : (b.horario || '').localeCompare(a.horario || '');
  });

  if (status) items = items.filter(a => a.status === status);
  if (search) items = items.filter(a =>
    (a.nome || '').toLowerCase().includes(search) ||
    (a.email || '').toLowerCase().includes(search) ||
    (a.telefone || '').toLowerCase().includes(search)
  );

  const tbody = document.getElementById('tbody-agendamentos');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhum agendamento encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(a => `
    <tr id="ag-${a.id}">
      <td><strong>${esc(a.nome)}</strong><br><small style="color:var(--gray-500)">${esc(a.email)}</small></td>
      <td>${esc(a.servico)}</td>
      <td>${esc(a.profissional)}</td>
      <td>${fmtDate(a.data_consulta)}<br><small>${fmtTime(a.horario)}</small></td>
      <td>${esc(a.telefone)}</td>
      <td>${statusBadge(a.status)}</td>
      <td>
        <div class="actions">
          <button class="btn-icon btn-view"    title="Ver detalhes"  onclick="viewAgendamento(${a.id})">&#128065;</button>
          <button class="btn-icon btn-confirm" title="Confirmar"     onclick="setStatus(${a.id},'confirmado')">&#10003;</button>
          <button class="btn-icon btn-cancel"  title="Cancelar"      onclick="setStatus(${a.id},'cancelado')">&#9645;</button>
          <button class="btn-icon btn-delete"  title="Excluir"       onclick="delAgendamento(${a.id})">&#128465;</button>
        </div>
      </td>
    </tr>`).join('');
}

function loadAgendamentos() {
  renderAgendamentos();
}

async function setStatus(id, status) {
  const ok = await DB.update('agendamentos', { status }, `id=eq.${id}`);
  if (ok) {
    toast('Status atualizado.', 'success');
    await loadDashboard();
    renderAgendamentos();
  } else {
    toast('Erro ao atualizar. Verifique se está logado.', 'error');
  }
}

async function delAgendamento(id) {
  if (!confirm('Excluir este agendamento? Esta ação não pode ser desfeita.')) return;
  const ok = await DB.remove('agendamentos', `id=eq.${id}`);
  if (ok) {
    toast('Agendamento excluído.', 'success');
    await loadDashboard();
    renderAgendamentos();
  } else {
    toast('Erro ao excluir.', 'error');
  }
}

function viewAgendamento(id) {
  const a = _agendamentos.find(x => x.id == id);
  if (!a) return;
  showModal(`
    <h3>Detalhes do Agendamento</h3>
    <div class="detail-row"><span class="detail-label">Paciente</span><span class="detail-value">${esc(a.nome)}</span></div>
    <div class="detail-row"><span class="detail-label">E-mail</span><span class="detail-value">${esc(a.email)}</span></div>
    <div class="detail-row"><span class="detail-label">Telefone</span><span class="detail-value">${esc(a.telefone)}</span></div>
    <div class="detail-row"><span class="detail-label">Especialidade</span><span class="detail-value">${esc(a.servico)}</span></div>
    <div class="detail-row"><span class="detail-label">Profissional</span><span class="detail-value">${esc(a.profissional)}</span></div>
    <div class="detail-row"><span class="detail-label">Data / Hora</span><span class="detail-value">${fmtDate(a.data_consulta)} às ${fmtTime(a.horario)}</span></div>
    <div class="detail-row"><span class="detail-label">Motivo</span><span class="detail-value">${esc(a.motivo || '—')}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(a.status)}</span></div>
    <div class="detail-row"><span class="detail-label">Recebido em</span><span class="detail-value">${fmtDatetime(a.criado_em)}</span></div>
  `);
}

/* ----------------------------------------------------------------
   AVALIAÇÕES
---------------------------------------------------------------- */
function renderAvaliacoes() {
  const items = (_avaliacoes || []).slice().sort((a, b) =>
    (b.criado_em || '').localeCompare(a.criado_em || '')
  );
  const tbody = document.getElementById('tbody-avaliacoes');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma avaliação encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(a => `
    <tr id="av-${a.id}">
      <td>${esc(a.nome)}</td>
      <td>${stars(a.nota)}</td>
      <td title="${esc(a.comentario)}">${esc(trunc(a.comentario))}</td>
      <td>${fmtDate(a.criado_em)}</td>
      <td>${a.aprovada
          ? '<span class="badge badge-aprovada">Visível</span>'
          : '<span class="badge badge-oculta">Oculta</span>'}</td>
      <td>
        <div class="actions">
          <button class="btn-icon btn-view"   title="Ver completa"    onclick="viewAvaliacao(${a.id})">&#128065;</button>
          ${a.aprovada
            ? `<button class="btn-icon btn-hide"    title="Ocultar do site"  onclick="toggleAv(${a.id},false)">&#128683;</button>`
            : `<button class="btn-icon btn-approve" title="Publicar no site" onclick="toggleAv(${a.id},true)">&#9989;</button>`}
          <button class="btn-icon btn-delete" title="Excluir"          onclick="delAv(${a.id})">&#128465;</button>
        </div>
      </td>
    </tr>`).join('');
}

function loadAvaliacoes() {
  renderAvaliacoes();
}

async function toggleAv(id, aprovada) {
  const ok = await DB.update('avaliacoes', { aprovada }, `id=eq.${id}`);
  if (ok) {
    toast(aprovada ? 'Avaliação publicada no site.' : 'Avaliação ocultada.', 'success');
    await loadDashboard();
    renderAvaliacoes();
  } else {
    toast('Erro ao atualizar.', 'error');
  }
}

async function delAv(id) {
  if (!confirm('Excluir esta avaliação permanentemente?')) return;
  const ok = await DB.remove('avaliacoes', `id=eq.${id}`);
  if (ok) {
    toast('Avaliação excluída.', 'success');
    await loadDashboard();
    renderAvaliacoes();
  } else {
    toast('Erro ao excluir.', 'error');
  }
}

function viewAvaliacao(id) {
  const a = _avaliacoes.find(x => x.id == id);
  if (!a) return;
  showModal(`
    <h3>Avaliação Completa</h3>
    <div class="detail-row"><span class="detail-label">Paciente</span><span class="detail-value">${esc(a.nome)}</span></div>
    <div class="detail-row"><span class="detail-label">Nota</span><span class="detail-value">${stars(a.nota)}</span></div>
    <div class="detail-row"><span class="detail-label">Data</span><span class="detail-value">${fmtDate(a.criado_em)}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${a.aprovada ? '<span class="badge badge-aprovada">Visível</span>' : '<span class="badge badge-oculta">Oculta</span>'}</span></div>
    <div class="detail-row" style="flex-direction:column;gap:6px">
      <span class="detail-label">Comentário</span>
      <span class="detail-value" style="background:var(--gray-50);padding:14px;border-radius:var(--radius);line-height:1.6">${esc(a.comentario)}</span>
    </div>
  `);
}

/* ----------------------------------------------------------------
   CONTATOS / MENSAGENS
---------------------------------------------------------------- */
function renderContatos() {
  const lido = (document.getElementById('filter-lido') || {}).value || '';
  let items = (_contatos || []).slice().sort((a, b) =>
    (b.criado_em || '').localeCompare(a.criado_em || '')
  );
  if (lido === '0') items = items.filter(c => !c.lido);
  if (lido === '1') items = items.filter(c =>  c.lido);

  const tbody = document.getElementById('tbody-contatos');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhuma mensagem encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(c => `
    <tr id="ct-${c.id}">
      <td><strong>${esc(c.nome)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.telefone || '—')}</td>
      <td title="${esc(c.mensagem)}">${esc(trunc(c.mensagem, 55))}</td>
      <td style="white-space:nowrap">${fmtDatetime(c.criado_em)}</td>
      <td>${!c.lido
          ? '<span class="badge badge-nao-lido">Nova</span>'
          : '<span class="badge badge-lido">Lida</span>'}</td>
      <td>
        <div class="actions">
          <button class="btn-icon btn-view"   title="Ver mensagem"        onclick="viewContato(${c.id})">&#128065;</button>
          ${!c.lido
            ? `<button class="btn-icon btn-read" title="Marcar como lida"    onclick="markRead(${c.id},true)">&#128338;</button>`
            : `<button class="btn-icon btn-hide" title="Marcar como não lida" onclick="markRead(${c.id},false)">&#128337;</button>`}
          <button class="btn-icon btn-delete" title="Excluir"              onclick="delContato(${c.id})">&#128465;</button>
        </div>
      </td>
    </tr>`).join('');
}

function loadContatos() {
  renderContatos();
}

async function markRead(id, lido) {
  const ok = await DB.update('contatos', { lido }, `id=eq.${id}`);
  if (ok) {
    await loadDashboard();
    renderContatos();
  } else toast('Erro ao atualizar.', 'error');
}

async function delContato(id) {
  if (!confirm('Excluir esta mensagem permanentemente?')) return;
  const ok = await DB.remove('contatos', `id=eq.${id}`);
  if (ok) {
    toast('Mensagem excluída.', 'success');
    await loadDashboard();
    renderContatos();
  } else {
    toast('Erro ao excluir.', 'error');
  }
}

function viewContato(id) {
  const c = _contatos.find(x => x.id == id);
  if (!c) return;
  showModal(`
    <h3>Mensagem Recebida</h3>
    <div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">${esc(c.nome)}</span></div>
    <div class="detail-row"><span class="detail-label">E-mail</span><span class="detail-value">${esc(c.email)}</span></div>
    <div class="detail-row"><span class="detail-label">Telefone</span><span class="detail-value">${esc(c.telefone || '—')}</span></div>
    <div class="detail-row"><span class="detail-label">Recebido em</span><span class="detail-value">${fmtDatetime(c.criado_em)}</span></div>
    <div class="detail-row" style="flex-direction:column;gap:6px">
      <span class="detail-label">Mensagem</span>
      <span class="detail-value" style="background:var(--gray-50);padding:14px;border-radius:var(--radius);line-height:1.7;white-space:pre-wrap">${esc(c.mensagem)}</span>
    </div>
  `);
  if (!c.lido) markRead(id, true);
}

/* ----------------------------------------------------------------
   UI HELPERS
---------------------------------------------------------------- */
async function showSection(name) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById('section-' + name);
  const navItem = document.querySelector(`[data-section="${name}"]`);
  if (section) {
    section.classList.remove('hidden');
    section.classList.add('active');
  }
  if (navItem) navItem.classList.add('active');

  document.getElementById('page-title').textContent = SECTION_TITLES[name] || name;
  closeSidebar();

  await loadDashboard();

  if (name === 'agendamentos') renderAgendamentos();
  if (name === 'avaliacoes')   renderAvaliacoes();
  if (name === 'contatos')     renderContatos();
}

function showModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal').classList.add('hidden');
}

function toast(msg, type) {
  type = type || 'success';
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { t.classList.add('show'); });
  });
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () { t.remove(); }, 300);
  }, 3500);
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-backdrop').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('open');
}

/* ----------------------------------------------------------------
   INIT
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async function () {

  /* Backdrop mobile */
  document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);

  /* Supabase não configurado */
  if (!DB) {
    document.getElementById('login-screen').innerHTML = `
      <div class="login-card">
        <div class="login-logo">
          <div class="login-icon">&#9829;</div>
          <h1>Clínica Vitalis</h1>
        </div>
        <div style="background:#fee2e2;color:#991b1b;padding:16px;border-radius:8px;font-size:13px;line-height:1.6">
          <strong>Supabase não configurado.</strong><br>
          Abra o arquivo <code>vitalis-db.js</code> e preencha
          <code>SUPABASE_URL</code> e <code>SUPABASE_KEY</code> com
          as credenciais do seu projeto.
        </div>
      </div>`;
    return;
  }

  /* Checar autenticação */
  if (DB.authCheck()) {
    showApp();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    initLoginForm();
  }
});

function initLoginForm() {
  const form     = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');
  const pwInput  = document.getElementById('login-password');
  const toggleBtn = document.getElementById('toggle-password');

  toggleBtn.addEventListener('click', function () {
    const show = pwInput.type === 'password';
    pwInput.type = show ? 'text' : 'password';
    document.getElementById('icon-eye').classList.toggle('hidden', show);
    document.getElementById('icon-eye-off').classList.toggle('hidden', !show);
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled    = true;
    btn.textContent = 'Entrando…';
    errorDiv.classList.add('hidden');

    const result = await DB.authLogin(email, password);

    btn.disabled    = false;
    btn.textContent = 'Entrar';

    if (result.ok) {
      document.getElementById('login-screen').style.display = 'none';
      showApp();
    } else {
      errorDiv.textContent = result.message || 'Credenciais inválidas.';
      errorDiv.classList.remove('hidden');
    }
  });
}

async function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      showSection(item.dataset.section);
    });
  });

  document.getElementById('logout-btn').addEventListener('click', async function () {
    await DB.authLogout();
    location.reload();
  });

  document.getElementById('menu-btn').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === document.getElementById('modal')) hideModal();
  });

  document.getElementById('btn-filtrar').addEventListener('click', renderAgendamentos);
  document.getElementById('filter-search').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') renderAgendamentos();
  });
  document.getElementById('filter-lido').addEventListener('change', renderContatos);

  await showSection('overview');
}
