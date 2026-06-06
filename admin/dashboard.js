/* =================================================================
   dashboard.js — polling de dados reais via Railway API
   Atualiza os cards KPI e a tabela de agendamentos do dia a cada 30s
================================================================= */
(function () {
  var base = (typeof API_BASE !== 'undefined') ? API_BASE : '';

  function hoje() {
    return new Date().toISOString().split('T')[0];
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function fmtData(iso) {
    if (!iso) return '—';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function statusBadge(status) {
    var map = {
      pendente:   ['badge-amber', 'Pendente'],
      confirmado: ['badge-green', 'Confirmado'],
      cancelado:  ['badge-red',   'Cancelado'],
    };
    var s = (status || '').toLowerCase();
    var pair = map[s] || ['badge-muted', status || '—'];
    return '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>';
  }

  async function fetchHoje() {
    try {
      var res  = await fetch(base + '/api/agendamentos?data=' + hoje());
      if (!res.ok) return null;
      return res.json();
    } catch (e) { return null; }
  }

  async function fetchMes() {
    try {
      var mesInicio = hoje().slice(0, 7) + '-01';
      var res = await fetch(base + '/api/agendamentos?data_inicio=' + mesInicio);
      if (!res.ok) return null;
      return res.json();
    } catch (e) { return null; }
  }

  async function fetchPacientes() {
    try {
      var res = await fetch(base + '/api/pacientes');
      if (!res.ok) return null;
      return res.json();
    } catch (e) { return null; }
  }

  function renderTabelaHoje(agendamentos) {
    var tbody = document.getElementById('dash-table-body');
    if (!tbody) return;

    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Nenhum agendamento para hoje.</td></tr>';
      setText('dash-hoje-count', '0');
      return;
    }

    setText('dash-hoje-count', String(agendamentos.length));

    tbody.innerHTML = agendamentos.map(function (a) {
      var pac  = a.pacientes  || {};
      var prof = a.profissionais || {};
      var esp  = (prof.especialidades || {}).nome || '—';
      return '<tr>' +
        '<td>' + (pac.nome_completo  || a.nome || '—') + '</td>' +
        '<td>' + esp + '</td>' +
        '<td>' + (prof.nome || '—') + '</td>' +
        '<td>' + (String(a.horario || '').slice(0, 5) || '—') + '</td>' +
        '<td>' + statusBadge(a.status) + '</td>' +
      '</tr>';
    }).join('');

    /* Profissionais com agenda hoje (lista lateral) */
    var profsHoje = document.getElementById('profs-hoje');
    if (profsHoje) {
      var vistos = {};
      var itens  = agendamentos.filter(function (a) {
        var nome = (a.profissionais || {}).nome;
        if (!nome || vistos[nome]) return false;
        vistos[nome] = true;
        return true;
      });

      profsHoje.innerHTML = itens.length === 0
        ? '<p style="font-size:13px;color:var(--text-muted)">Nenhum profissional hoje.</p>'
        : itens.map(function (a) {
            var nome = (a.profissionais || {}).nome || '—';
            var ini  = nome.replace(/^(Dr\.|Dra\.)\s*/i, '').trim().split(' ');
            var av   = ((ini[0] || '?')[0] + ((ini[1] || '')[0] || '')).toUpperCase();
            var qtd  = agendamentos.filter(function (x) { return (x.profissionais || {}).nome === nome; }).length;
            return '<div class="mini-item">' +
              '<div class="avatar avatar-sm">' + av + '</div>' +
              '<div class="mini-item-info">' +
                '<div class="mini-item-name">' + nome + '</div>' +
                '<div class="mini-item-sub">' + qtd + ' consulta' + (qtd !== 1 ? 's' : '') + '</div>' +
              '</div></div>';
          }).join('');
    }
  }

  function updateKPIs(hojeAg, totalPacientes) {
    if (Array.isArray(hojeAg)) {
      setText('kpi-hoje',       String(hojeAg.length));
      setText('kpi-delta-hoje', hojeAg.length + ' hoje');
    }
    if (typeof totalPacientes === 'number') {
      setText('kpi-pacientes', String(totalPacientes));
    }
  }

  async function refresh() {
    var [agHoje, pacientes] = await Promise.all([fetchHoje(), fetchPacientes()]);

    if (Array.isArray(agHoje)) {
      renderTabelaHoje(agHoje);
      updateKPIs(agHoje, Array.isArray(pacientes) ? pacientes.length : undefined);

      /* KPI "Consultas do mês" — conta do cache da tabela se não há rota de mês */
      var mesAtual = hoje().slice(0, 7);
      var kpiMes = document.getElementById('kpi-mes');
      if (kpiMes && kpiMes.textContent === '—') {
        setText('kpi-mes', String(agHoje.filter(function (a) {
          return (a.data_consulta || '').startsWith(mesAtual);
        }).length));
      }
    }
  }

  /* Aguarda o DOM estar pronto, inicia e agenda polling */
  document.addEventListener('DOMContentLoaded', function () {
    /* Pequeno delay para não colidir com o carregamento inicial do vitalis-admin.js */
    setTimeout(function () {
      refresh();
      setInterval(refresh, 30000);
    }, 2000);
  });
})();
