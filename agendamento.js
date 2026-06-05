/* ================================================================
   agendamento.js — Clínica Vitalis
================================================================ */

const profissionaisData = {
    'clinica-geral': [
        { id: 'carlos-silva',     nome: 'Dr. Carlos Silva',       horarios: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'] },
    ],
    cardiologia: [
        { id: 'marina-costa',     nome: 'Dra. Marina Costa',      horarios: ['08:30','09:30','10:30','11:30','14:00','15:00','16:00'] },
    ],
    odontologia: [
        { id: 'fernando-oliveira',nome: 'Dr. Fernando Oliveira',  horarios: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'] },
    ],
    fisioterapia: [
        { id: 'ana-paula',        nome: 'Dra. Ana Paula',         horarios: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'] },
    ],
    dermatologia: [
        { id: 'roberto-santos',   nome: 'Dr. Roberto Santos',     horarios: ['08:30','09:30','10:30','11:30','13:30','14:30','15:30','16:30'] },
    ],
    nutricao: [
        { id: 'juliana-martins',  nome: 'Dra. Juliana Martins',   horarios: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'] },
    ],
};

/* ---- DOM ---- */
const formulario          = document.getElementById('agendamentoForm');
const selectServico       = document.getElementById('servico');
const selectProfissional  = document.getElementById('profissional');
const inputData           = document.getElementById('data');
const horariosContainer   = document.getElementById('horariosContainer');
const inputHorario        = document.getElementById('horarioSelecionado');
const msgContainer        = document.getElementById('mensagemAgendamento');
const resumoAgendamento   = document.getElementById('resumoAgendamento');
const resumoConteudo      = document.getElementById('resumoConteudo');
const agendamentoContexto = document.getElementById('agendamentoContexto');

/* ---- Helpers de data ---- */
function isWeekend(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return dow === 0 || dow === 6;
}

function proximoDiaUtil(date) {
    const d = new Date(date);
    while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

function dataMinima() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    return proximoDiaUtil(amanha);
}

function dataMaxima() {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
}

function horarioJaPassou(dateStr, horario) {
    const [h, min] = horario.split(':').map(Number);
    const agora = new Date();
    const consulta = new Date(dateStr);
    consulta.setHours(h, min, 0, 0);
    return consulta <= agora;
}

function formatarData(str) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

function formatarTelefone(tel) {
    const digits = tel.replace(/\D/g, '');
    if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return tel;
}

function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
        ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
    );
}

/* ---- Buscar slots ocupados no Supabase ---- */
async function buscarHorariosOcupados(nomeProf, dateStr) {
    if (!window.VITALIS_DB) return [];
    try {
        const rows = await window.VITALIS_DB.select(
            'agendamentos',
            `select=horario&profissional=eq.${encodeURIComponent(nomeProf)}&data_consulta=eq.${dateStr}&status=neq.cancelado`
        );
        return Array.isArray(rows) ? rows.map(r => String(r.horario).slice(0, 5)) : [];
    } catch {
        return [];
    }
}

/* ---- UI: profissionais ---- */
function atualizarProfissionais() {
    const svc = selectServico.value;
    selectProfissional.innerHTML = '<option value="">Selecione um profissional</option>';
    inputData.value   = '';
    inputHorario.value = '';
    horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione um profissional e uma data</p>';
    msgContainer.innerHTML = '';
    msgContainer.className = 'mensagem-agendamento';

    if (!svc) {
        selectProfissional.disabled = true;
        return;
    }

    selectProfissional.disabled = false;
    (profissionaisData[svc] || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        selectProfissional.appendChild(opt);
    });
}

/* ---- UI: datas ---- */
function atualizarDatasDisponíveis() {
    inputData.setAttribute('min', dataMinima());
    inputData.setAttribute('max', dataMaxima());
    inputData.value    = '';
    inputHorario.value = '';
    horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma data</p>';
    msgContainer.innerHTML = '';
    msgContainer.className = 'mensagem-agendamento';
}

/* ---- UI: horários ---- */
async function atualizarHorarios() {
    const dateStr = inputData.value;
    const profId  = selectProfissional.value;

    inputHorario.value     = '';
    msgContainer.innerHTML = '';
    msgContainer.className = 'mensagem-agendamento';

    if (!dateStr || !profId) {
        horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione profissional e data</p>';
        return;
    }

    if (isWeekend(dateStr)) {
        inputData.value = '';
        horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma data</p>';
        showMsg('A clínica não atende nos fins de semana. Escolha uma data de segunda a sexta-feira.', 'aviso');
        return;
    }

    const svc      = selectServico.value;
    const profInfo = (profissionaisData[svc] || []).find(p => p.id === profId);
    if (!profInfo) return;

    horariosContainer.innerHTML = `
        <p class="horario-placeholder">
            <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Verificando disponibilidade…
        </p>`;

    const ocupados = await buscarHorariosOcupados(profInfo.nome, dateStr);

    horariosContainer.innerHTML = '';
    let algumDisponivel = false;

    profInfo.horarios.forEach(horario => {
        const btn    = document.createElement('button');
        btn.type     = 'button';
        btn.className = 'horario-item';
        btn.textContent = horario;

        const passado = horarioJaPassou(dateStr, horario);
        const ocupado = ocupados.includes(horario);

        if (passado) {
            btn.classList.add('passado');
            btn.disabled = true;
            btn.setAttribute('aria-label', `${horario} — horário passado`);
        } else if (ocupado) {
            btn.classList.add('ocupado');
            btn.disabled = true;
            btn.setAttribute('aria-label', `${horario} — horário ocupado`);
        } else {
            btn.classList.add('disponivel');
            algumDisponivel = true;
            btn.setAttribute('aria-label', `Selecionar horário ${horario}`);
            btn.addEventListener('click', () => selecionarHorario(horario, btn));
        }

        horariosContainer.appendChild(btn);
    });

    if (!algumDisponivel) {
        showMsg('Não há horários disponíveis nesta data. Por favor, escolha outra data.', 'aviso');
    }
}

function selecionarHorario(horario, btn) {
    document.querySelectorAll('.horario-item.selecionado').forEach(el => el.classList.remove('selecionado'));
    btn.classList.add('selecionado');
    inputHorario.value = horario;
    showMsg(`Horário ${horario} selecionado com sucesso.`, 'sucesso');
}

function showMsg(text, type) {
    msgContainer.innerHTML = `<p>${esc(text)}</p>`;
    msgContainer.className = `mensagem-agendamento ${type === 'sucesso' ? 'sucesso-box' : 'aviso-box'}`;
}

/* ---- Envio para o banco ---- */
async function enviarAgendamento(dados) {
    if (!window.VITALIS_DB) return false;
    return window.VITALIS_DB.insert('agendamentos', {
        nome:          dados.nome,
        email:         dados.email,
        telefone:      dados.telefone,
        servico:       dados.servico,
        profissional:  dados.profissional,
        data_consulta: dados.dataISO,
        horario:       dados.horario,
        motivo:        dados.motivo || null,
        status:        'pendente',
    });
}

/* ---- Submit ---- */
formulario.addEventListener('submit', async e => {
    e.preventDefault();

    if (!inputHorario.value) {
        showMsg('Selecione um horário disponível antes de confirmar.', 'aviso');
        return;
    }

    const svc      = selectServico.value;
    const profId   = selectProfissional.value;
    const profInfo = (profissionaisData[svc] || []).find(p => p.id === profId);
    const dateStr  = inputData.value;

    const dados = {
        nome:         document.getElementById('nome').value.trim(),
        email:        document.getElementById('email').value.trim(),
        telefone:     formatarTelefone(document.getElementById('telefone').value.trim()),
        servico:      document.querySelector(`#servico option[value="${svc}"]`)?.textContent || svc,
        profissional: profInfo?.nome || '',
        dataISO:      dateStr,
        data:         formatarData(dateStr),
        horario:      inputHorario.value,
        motivo:       document.getElementById('motivo').value.trim(),
    };

    const submitBtn = formulario.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Enviando…';

    const ok = await enviarAgendamento(dados);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Confirmar Agendamento';

    if (ok) {
        exibirResumo(dados);
        formulario.reset();
        selectProfissional.disabled = true;
        inputHorario.value = '';
        horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma data</p>';
        msgContainer.innerHTML = '';
        msgContainer.className = 'mensagem-agendamento';
    } else {
        showMsg('Não foi possível enviar o agendamento. Verifique sua conexão e tente novamente, ou ligue para a clínica.', 'aviso');
    }
});

/* ---- Resumo ---- */
function exibirResumo(dados) {
    const motivo = dados.motivo
        ? `<div class="resumo-item"><span class="label">Motivo</span><span class="valor">${esc(dados.motivo)}</span></div>`
        : '';

    resumoConteudo.innerHTML = `
        <div class="resumo-item"><span class="label">Paciente</span><span class="valor">${esc(dados.nome)}</span></div>
        <div class="resumo-item"><span class="label">E-mail</span><span class="valor">${esc(dados.email)}</span></div>
        <div class="resumo-item"><span class="label">Telefone</span><span class="valor">${esc(dados.telefone)}</span></div>
        <div class="resumo-item"><span class="label">Especialidade</span><span class="valor">${esc(dados.servico)}</span></div>
        <div class="resumo-item"><span class="label">Profissional</span><span class="valor">${esc(dados.profissional)}</span></div>
        <div class="resumo-item"><span class="label">Data</span><span class="valor">${esc(dados.data)}</span></div>
        <div class="resumo-item"><span class="label">Horário</span><span class="valor">${esc(dados.horario)}</span></div>
        ${motivo}
        <div class="resumo-rodape">
            <p><strong>Agendamento realizado com sucesso!</strong></p>
            <p>Nossa equipe entrará em contato para confirmar. Fique atento ao seu e-mail e telefone.</p>
        </div>
    `;

    resumoAgendamento.classList.remove('hidden');
    setTimeout(() => resumoAgendamento.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    exibirModalConfirmacao(dados);
}

/* ---- Modal ---- */
function exibirModalConfirmacao(dados) {
    const modal = document.getElementById('modalConfirmacao');
    if (!modal) return;
    document.getElementById('modalProfissional').textContent = dados.profissional;
    document.getElementById('modalDataHora').textContent    = `${dados.data} às ${dados.horario}`;
    document.getElementById('modalEmail').textContent       = dados.email;
    modal.classList.remove('hidden');
    setTimeout(fecharModalConfirmacao, 8000);
}

function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao')?.classList.add('hidden');
}

/* ---- URL params ---- */
function aplicarParametrosDaUrl() {
    const params    = new URLSearchParams(window.location.search);
    const svcParam  = params.get('servico');
    const profParam = params.get('profissional');

    if (!svcParam || !profissionaisData[svcParam]) return;

    selectServico.value = svcParam;
    atualizarProfissionais();

    const profExiste = (profissionaisData[svcParam] || []).some(p => p.id === profParam);
    if (profParam && profExiste) {
        selectProfissional.value = profParam;
        atualizarDatasDisponíveis();
    }

    const profSel = (profissionaisData[svcParam] || []).find(p => p.id === selectProfissional.value);
    if (agendamentoContexto && profSel) {
        agendamentoContexto.classList.remove('hidden');
        const svcNome = document.querySelector(`#servico option[value="${svcParam}"]`)?.textContent || '';
        agendamentoContexto.innerHTML = `
            <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
            <div>
                <strong>Atendimento selecionado</strong>
                <span>${esc(svcNome)} com ${esc(profSel.nome)}</span>
            </div>
        `;
    }
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
    inputData.setAttribute('min', dataMinima());
    inputData.setAttribute('max', dataMaxima());
    selectProfissional.disabled = true;
    aplicarParametrosDaUrl();
});
