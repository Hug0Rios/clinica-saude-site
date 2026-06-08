// vitalis-db.js — camada de acesso à API do backend Render + Supabase direto

/* ----------------------------------------------------------------
   VITALIS_DB — cliente Supabase para admin e operações públicas
---------------------------------------------------------------- */
(function () {
  var SUPABASE_URL = 'https://mhsuiduulvidjnixcfey.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oc3VpZHV1bHZpZGpuaXhjZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODg1NTAsImV4cCI6MjA5NjI2NDU1MH0.MG8or3bn2FdYucS4PgLirsaUYSNPmIG205fCkwixnd8';
  var SESSION_KEY = 'vitalis_admin_session';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function setSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function authHeaders() {
    var session = getSession();
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + (session && session.access_token ? session.access_token : SUPABASE_ANON_KEY),
    };
  }

  async function select(table, query) {
    var res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function insert(table, data) {
    var res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: Object.assign({}, authHeaders(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function update(table, data, filter) {
    var res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + filter, {
      method: 'PATCH',
      headers: Object.assign({}, authHeaders(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  }

  function authCheck() {
    var session = getSession();
    if (!session || !session.access_token || !session.expires_at) return false;
    return (Date.now() / 1000) < session.expires_at;
  }

  async function authLogin(email, password) {
    try {
      var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email, password: password }),
      });
      var data = await res.json();
      if (!res.ok) return { ok: false, message: data.error_description || data.msg || 'Credenciais inválidas.' };
      setSession({ access_token: data.access_token, expires_at: data.expires_at });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: 'Erro de conexão com o servidor.' };
    }
  }

  async function authLogout() {
    var session = getSession();
    if (session && session.access_token) {
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + session.access_token },
      }).catch(function () {});
    }
    clearSession();
  }

  window.VITALIS_DB = { select: select, insert: insert, update: update, authCheck: authCheck, authLogin: authLogin, authLogout: authLogout };
})();

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
