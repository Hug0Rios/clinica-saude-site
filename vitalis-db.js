/* =================================================================
   vitalis-db.js — Clínica Vitalis
   - Funções de agendamento chamam o backend Railway (API_BASE)
   - VITALIS_DB mantém acesso Supabase direto para o painel admin
================================================================= */
(function () {
  var SUPABASE_URL = 'https://mhsuiduulvidjnixcfey.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_r5giRE1RcitprdQe-sc9Lg__RKWOjch';
  var BASE = (typeof API_BASE !== 'undefined') ? API_BASE : '';

  /* ---------- helpers Railway ---------- */
  async function apiFetch(path, opts) {
    opts = opts || {};
    var res = await fetch(BASE + path, {
      method:  opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body:    opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.erro || ('HTTP ' + res.status));
    return data;
  }

  /* ---------- funções públicas de agendamento ---------- */
  async function getProfissionais() {
    return apiFetch('/api/profissionais');
  }

  async function getHorariosDisponiveis(profissional_id, data) {
    var rows = await apiFetch('/api/agendamentos?profissional_id=' + encodeURIComponent(profissional_id) + '&data=' + encodeURIComponent(data));
    if (!Array.isArray(rows)) return [];
    return rows.map(function (r) { return String(r.horario).slice(0, 5); });
  }

  async function cadastrarPaciente(dados) {
    return apiFetch('/api/pacientes', { method: 'POST', body: dados });
  }

  async function criarAgendamento(dados) {
    return apiFetch('/api/agendamentos', { method: 'POST', body: dados });
  }

  /* ---------- helpers Supabase (admin) ---------- */
  var LS_TOKEN = 'vt_access_token';
  var LS_EXP   = 'vt_token_exp';

  function getToken()      { return localStorage.getItem(LS_TOKEN) || SUPABASE_KEY; }
  function clearToken()    { localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_EXP); }
  function isTokenValid()  { var e = Number(localStorage.getItem(LS_EXP) || 0); return e > 0 && Date.now() / 1000 < e; }

  function restFetch(path, opts) {
    opts = opts || {};
    var headers = {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_KEY,
      'Authorization': 'Bearer ' + getToken(),
    };
    if (opts.prefer) headers['Prefer'] = opts.prefer;
    return fetch(SUPABASE_URL + '/rest/v1/' + path, {
      method:  opts.method || 'GET',
      headers: headers,
      body:    opts.body,
    });
  }

  async function select(table, query) {
    try {
      var qs  = query ? '?' + query : '';
      var res = await restFetch(table + qs);
      if (res.status === 401) { clearToken(); return []; }
      if (!res.ok) return [];
      return res.json();
    } catch (e) { return []; }
  }

  async function insert(table, data) {
    try {
      var res = await restFetch(table, { method: 'POST', prefer: 'return=minimal', body: JSON.stringify(data) });
      return res.ok;
    } catch (e) { return false; }
  }

  async function update(table, data, match) {
    try {
      var res = await restFetch(table + '?' + match, { method: 'PATCH', prefer: 'return=minimal', body: JSON.stringify(data) });
      if (res.status === 401) clearToken();
      return res.ok;
    } catch (e) { return false; }
  }

  async function remove(table, match) {
    try {
      var res = await restFetch(table + '?' + match, { method: 'DELETE' });
      if (res.status === 401) clearToken();
      return res.ok;
    } catch (e) { return false; }
  }

  async function rpc(fn, params) {
    try {
      var res = await restFetch('rpc/' + fn, { method: 'POST', body: JSON.stringify(params || {}) });
      if (!res.ok) return null;
      return res.json();
    } catch (e) { return null; }
  }

  /* ---------- Auth ---------- */
  async function authLogin(email, password) {
    try {
      var res  = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body:    JSON.stringify({ email: email, password: password }),
      });
      var data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem(LS_TOKEN, data.access_token);
        localStorage.setItem(LS_EXP,   data.expires_at || (Date.now() / 1000 + 3600));
        return { ok: true };
      }
      return { ok: false, message: data.error_description || data.msg || 'Credenciais inválidas.' };
    } catch (e) {
      return { ok: false, message: 'Erro de conexão.' };
    }
  }

  async function authLogout() {
    var token = localStorage.getItem(LS_TOKEN);
    if (token && token !== SUPABASE_KEY) {
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method:  'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + token },
      }).catch(function () {});
    }
    clearToken();
  }

  function authCheck() {
    return !!localStorage.getItem(LS_TOKEN) && isTokenValid();
  }

  /* ---------- exports ---------- */
  window.getProfissionais      = getProfissionais;
  window.getHorariosDisponiveis = getHorariosDisponiveis;
  window.cadastrarPaciente     = cadastrarPaciente;
  window.criarAgendamento      = criarAgendamento;

  window.VITALIS_DB = {
    select: select, insert: insert, update: update, remove: remove, rpc: rpc,
    authLogin: authLogin, authLogout: authLogout, authCheck: authCheck,
    getProfissionais: getProfissionais,
    getHorariosDisponiveis: getHorariosDisponiveis,
    cadastrarPaciente: cadastrarPaciente,
    criarAgendamento: criarAgendamento,
  };
})();
