// agendamento.js — fluxo completo de agendamento (3 etapas)

/* ── Estado ─────────────────────────────────────────────────── */
const state = {
  especialidade: null, // { nome }
  profissional:  null, // objeto completo da API
  data:    '',
  horario: '',
  nome: '', email: '', telefone: '', cpf: '',
  primeiraConsulta: false, motivo: '',
};

let todosOsProfissionais = [];

/* ── Refs DOM ────────────────────────────────────────────────── */
const selEsp   = document.getElementById('esp-select');
const selProf  = document.getElementById('prof-select');
const dateGrid = document.getElementById('date-grid');
const timeWrap = document.getElementById('time-wrap');
const btnNext1 = document.getElementById('btn-next-1');

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', carregarDados);

async function carregarDados() {
  selEsp.innerHTML = '<option value="">Carregando...</option>';
  selEsp.disabled  = true;

  try {
    todosOsProfissionais = await getProfissionais();

    // especialidades únicas mantendo a ordem de chegada
    const espVistas = new Set();
    const especialidades = todosOsProfissionais
      .map(p => p.especialidade || p.especialidades?.nome || '')
      .filter(e => { if (!e || espVistas.has(e)) return false; espVistas.add(e); return true; });

    selEsp.innerHTML = '<option value="">Selecione</option>';
    especialidades.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome; opt.textContent = nome;
      selEsp.appendChild(opt);
    });
    selEsp.disabled = false;

    aplicarParametrosDaUrl();
  } catch (e) {
    selEsp.innerHTML = '<option value="">Erro ao carregar</option>';
    toast('Não foi possível carregar os profissionais. Recarregue a página.', 'error');
  }
}

/* ── Seleção de especialidade ────────────────────────────────── */
selEsp.addEventListener('change', function () {
  resetState({ especialidade: this.value ? { nome: this.value } : null });

  const profs = todosOsProfissionais.filter(
    p => (p.especialidade || p.especialidades?.nome) === this.value
  );
  selProf.innerHTML = '<option value="">Selecione um profissional</option>';
  profs.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.nome;
    selProf.appendChild(opt);
  });
  selProf.disabled = profs.length === 0;

  renderDates(); renderTimes([]); checkNext1();
});

/* ── Seleção de profissional ─────────────────────────────────── */
selProf.addEventListener('change', function () {
  state.profissional = todosOsProfissionais.find(p => p.id === this.value) || null;
  state.data = ''; state.horario = '';
  renderDates(); renderTimes([]); checkNext1();
});

/* ── Grade de datas (próximos 14 dias úteis) ─────────────────── */
function renderDates() {
  if (!state.profissional) {
    dateGrid.innerHTML = '<p style="font-size:13px;color:var(--text-muted);grid-column:1/-1">Selecione uma especialidade e profissional.</p>';
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dateGrid.innerHTML = '';

  const dows = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  for (let i = 1; i <= 14; i++) {
    const d    = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const dow       = d.getDay();
    const fimDeSemana = dow === 0 || dow === 6;
    const iso       = d.toISOString().split('T')[0];

    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'date-btn' + (iso === state.data ? ' selected' : '');
    btn.disabled  = fimDeSemana;
    btn.innerHTML = `<span class="date-dow">${dows[dow]}</span><span class="date-num">${d.getDate()}</span>`;

    if (!fimDeSemana) {
      btn.addEventListener('click', () => {
        state.data = iso; state.horario = '';
        document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        loadTimes(iso); checkNext1();
      });
    }
    dateGrid.appendChild(btn);
  }
}

/* ── Horários disponíveis ────────────────────────────────────── */
async function loadTimes(data) {
  if (!state.profissional) return;
  timeWrap.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Verificando disponibilidade…</p>';

  try {
    const livres = await getHorariosDisponiveis(state.profissional.id, data);
    renderTimes(livres, data);
  } catch {
    // fallback: exibe todos os horários se API falhar
    renderTimes(HORARIOS_PADRAO, data);
  }
}

function renderTimes(horarios, data) {
  if (!horarios?.length) {
    timeWrap.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Selecione uma data para ver os horários.</p>';
    return;
  }

  const agora = new Date();
  const grid  = document.createElement('div');
  grid.className = 'time-grid';

  horarios.forEach(h => {
    const btn = document.createElement('button');
    btn.type  = 'button';
    btn.textContent = h;

    // desabilita horários que já passaram no dia de hoje
    if (data) {
      const [hh, mm] = h.split(':').map(Number);
      const dt = new Date(data); dt.setHours(hh, mm, 0, 0);
      if (dt <= agora) { btn.className = 'time-btn ocupado'; btn.disabled = true; grid.appendChild(btn); return; }
    }

    btn.className = 'time-btn' + (h === state.horario ? ' selected' : '');
    btn.addEventListener('click', () => {
      state.horario = h;
      grid.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      checkNext1();
    });
    grid.appendChild(btn);
  });

  timeWrap.innerHTML = '';
  timeWrap.appendChild(grid);
}

function checkNext1() {
  btnNext1.disabled = !(state.especialidade && state.profissional && state.data && state.horario);
}

/* ── Stepper ─────────────────────────────────────────────────── */
let etapaAtual = 1;

function goTo(step) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(step === 0 ? 'panel-sucesso' : `panel-${step}`).classList.add('active');
  etapaAtual = step;
  updateStepper();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper() {
  [1, 2, 3].forEach(n => {
    const ind  = document.getElementById(`step-ind-${n}`);
    const circ = ind.querySelector('.step-circle');
    ind.classList.remove('active', 'done');
    if (n < etapaAtual) {
      ind.classList.add('done');
      circ.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      if (n === etapaAtual) ind.classList.add('active');
      circ.textContent = n;
    }
  });
  [1, 2].forEach(n => {
    document.getElementById(`line-${n}`)?.classList.toggle('done', n < etapaAtual);
  });
}

/* ── Etapa 2: máscaras e validação ───────────────────────────── */
document.getElementById('p-cpf').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
});

document.getElementById('p-tel').addEventListener('input', function () {
  const d = this.value.replace(/\D/g, '');
  this.value = d.length <= 10
    ? d.replace(/(\d{2})(\d{4})(\d*)/, '($1) $2-$3')
    : d.replace(/(\d{2})(\d{5})(\d*)/, '($1) $2-$3');
});

document.getElementById('btn-next-1').addEventListener('click', () => goTo(2));
document.getElementById('btn-back-2').addEventListener('click', () => goTo(1));

document.getElementById('btn-next-2').addEventListener('click', () => {
  const nome  = document.getElementById('p-nome').value.trim();
  const email = document.getElementById('p-email').value.trim();
  const tel   = document.getElementById('p-tel').value.trim();

  if (!nome || !email || !tel) { toast('Preencha nome, e-mail e telefone.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Informe um e-mail válido.', 'error'); return; }

  Object.assign(state, {
    nome, email, telefone: tel,
    cpf:              document.getElementById('p-cpf').value.trim(),
    primeiraConsulta: document.getElementById('p-primeira').checked,
    motivo:           document.getElementById('p-motivo').value.trim(),
  });

  buildResumo();
  goTo(3);
});

document.getElementById('btn-editar')?.addEventListener('click',  () => goTo(2));
document.getElementById('btn-back-3').addEventListener('click',  () => goTo(2));

/* ── Etapa 3: resumo ─────────────────────────────────────────── */
function buildResumo() {
  const dataFmt = state.data ? state.data.split('-').reverse().join('/') : '—';
  const linhas  = [
    ['Especialidade', state.especialidade?.nome || '—'],
    ['Profissional',  state.profissional?.nome  || '—'],
    ['Data',          dataFmt],
    ['Horário',       state.horario],
    ['Paciente',      state.nome],
    ['E-mail',        state.email],
    ['Telefone',      state.telefone],
  ];
  if (state.cpf)              linhas.push(['CPF',    state.cpf]);
  if (state.motivo)           linhas.push(['Motivo', state.motivo]);
  if (state.primeiraConsulta) linhas.push(['Obs.',   'Primeira consulta']);

  document.getElementById('resumo-content').innerHTML = linhas
    .map(([k, v]) => `<div class="resumo-row">
      <span class="resumo-key">${esc(k)}</span>
      <span class="resumo-val">${esc(v)}</span>
    </div>`).join('');
}

/* ── Submit ──────────────────────────────────────────────────── */
document.getElementById('btn-confirmar').addEventListener('click', async function () {
  const btn = this;
  btn.disabled = true; btn.textContent = 'Confirmando…';

  try {
    const pacRes = await criarPaciente({
      nome_completo: state.nome,
      email:         state.email,
      telefone:      state.telefone,
      cpf:           state.cpf || '',
      primeira_vez:  state.primeiraConsulta,
    });
    if (!pacRes.sucesso) throw new Error('Não foi possível registrar seus dados.');

    // especialidade_id vem do próprio profissional
    const espId = state.profissional.especialidade_id
      ?? state.profissional.especialidades?.id
      ?? null;

    const agRes = await criarAgendamento({
      paciente_id:      pacRes.paciente_id,
      profissional_id:  state.profissional.id,
      especialidade_id: espId,
      data_consulta:    state.data,
      horario:          state.horario,
      motivo:           state.motivo || null,
    });
    if (!agRes.sucesso) throw new Error('Não foi possível confirmar o agendamento.');

    const proto = 'VT' + String(agRes.id ?? Date.now()).slice(-8).toUpperCase();
    document.getElementById('protocol-num').textContent = proto;
    goTo(0);

  } catch (e) {
    toast(e.message || 'Ocorreu um erro. Tente novamente.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Confirmar agendamento';
  }
});

/* ── URL params (link direto com especialidade/profissional) ─── */
function aplicarParametrosDaUrl() {
  const { searchParams } = new URL(window.location.href);
  const esp  = searchParams.get('especialidade');
  const prof = searchParams.get('profissional');
  if (!esp) return;
  selEsp.value = esp;
  selEsp.dispatchEvent(new Event('change'));
  if (prof) { selProf.value = prof; selProf.dispatchEvent(new Event('change')); }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function resetState(partial = {}) {
  Object.assign(state, { profissional: null, data: '', horario: '' }, partial);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

function toast(msg, type = 'info') {
  const cont = document.getElementById('toasts');
  if (!cont) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  cont.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 4500);
}
