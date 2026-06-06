/* =================================================================
   vitalis-db.js — Acesso ao banco de dados (Supabase)

   CONFIGURAÇÃO:
   1. Acesse https://supabase.com e crie um projeto gratuito
   2. Execute o arquivo supabase_setup.sql no SQL Editor do projeto
   3. Vá em Project Settings → API e copie a URL e a "anon public" key
   4. Cole os valores nas duas constantes abaixo
   5. Crie o usuário admin em Authentication → Users
================================================================= */
(function () {
  var SUPABASE_URL = 'https://mhsuiduulvidjnixcfey.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_r5giRE1RcitprdQe-sc9Lg__RKWOjch';

  /* ---------- validação inicial ---------- */
  if (!SUPABASE_URL.startsWith('https://') || SUPABASE_KEY === 'COLE_AQUI_SUA_ANON_KEY') {
    console.warn('[Vitalis DB] Supabase não configurado. Preencha vitalis-db.js com suas credenciais.');
    window.VITALIS_DB = null;
    return;
  }

  /* ---------- helpers de token ---------- */
  var LS_TOKEN = 'vt_access_token';
  var LS_EXP   = 'vt_token_exp';

  function getToken() {
    return localStorage.getItem(LS_TOKEN) || SUPABASE_KEY;
  }

  function isTokenValid() {
    var exp = Number(localStorage.getItem(LS_EXP) || 0);
    return exp > 0 && Date.now() / 1000 < exp;
  }

  function clearToken() {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_EXP);
  }

  /* ---------- fetch base ---------- */
  function restFetch(path, opts) {
    opts = opts || {};
    var headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + getToken(),
    };
    if (opts.prefer) headers['Prefer'] = opts.prefer;
    return fetch(SUPABASE_URL + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body,
    });
  }

  /* ---------- CRUD ---------- */
  async function insert(table, data) {
    try {
      var res = await restFetch(table, {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (e) {
      console.error('[Vitalis DB] insert error', e);
      return false;
    }
  }

  async function select(table, query) {
    try {
      var qs = query ? '?' + query : '';
      var res = await restFetch(table + qs, { method: 'GET' });
      if (res.status === 401) { clearToken(); return []; }
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error('[Vitalis DB] select error', e);
      return [];
    }
  }

  async function update(table, data, match) {
    try {
      var res = await restFetch(table + '?' + match, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify(data),
      });
      if (res.status === 401) clearToken();
      return res.ok;
    } catch (e) {
      console.error('[Vitalis DB] update error', e);
      return false;
    }
  }

  async function remove(table, match) {
    try {
      var res = await restFetch(table + '?' + match, { method: 'DELETE' });
      if (res.status === 401) clearToken();
      return res.ok;
    } catch (e) {
      console.error('[Vitalis DB] remove error', e);
      return false;
    }
  }

  async function rpc(fn, params) {
    try {
      var res = await restFetch('rpc/' + fn, {
        method: 'POST',
        body: JSON.stringify(params || {}),
      });
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.error('[Vitalis DB] rpc error', e);
      return null;
    }
  }

  /* ---------- Auth ---------- */
  async function authLogin(email, password) {
    try {
      var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ email: email, password: password }),
      });
      var data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem(LS_TOKEN, data.access_token);
        localStorage.setItem(LS_EXP, data.expires_at || (Date.now() / 1000 + 3600));
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
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + token },
      }).catch(function () {});
    }
    clearToken();
  }

  function authCheck() {
    var token = localStorage.getItem(LS_TOKEN);
    if (!token) return false;
    return isTokenValid();
  }

  window.VITALIS_DB = { insert: insert, select: select, update: update, remove: remove, rpc: rpc,
                        authLogin: authLogin, authLogout: authLogout, authCheck: authCheck };
})();
