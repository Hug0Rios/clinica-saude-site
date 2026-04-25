// ========== DADOS DOS PROFISSIONAIS E HORÁRIOS ==========

const profissionaisData = {
    'clinica-geral': [
        { id: 'carlos-silva', nome: 'Dr. Carlos Silva', horarios: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
    ],
    'cardiologia': [
        { id: 'marina-costa', nome: 'Dra. Marina Costa', horarios: ['08:30', '09:30', '10:30', '11:30', '14:00', '15:00', '16:00'] },
    ],
    'odontologia': [
        { id: 'fernando-oliveira', nome: 'Dr. Fernando Oliveira', horarios: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
    ],
    'fisioterapia': [
        { id: 'ana-paula', nome: 'Dra. Ana Paula', horarios: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
    ],
    'dermatologia': [
        { id: 'roberto-santos', nome: 'Dr. Roberto Santos', horarios: ['08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30'] },
    ],
    'nutricao': [
        { id: 'juliana-martins', nome: 'Dra. Juliana Martins', horarios: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
    ]
};

// ========== VARIÁVEIS GLOBAIS ==========
let agendamentosRealizados = {};
const formulario = document.getElementById('agendamentoForm');
const servico = document.getElementById('servico');
const profissional = document.getElementById('profissional');
const data = document.getElementById('data');
const horariosContainer = document.getElementById('horariosContainer');
const horarioSelecionado = document.getElementById('horarioSelecionado');
const mensagemAgendamento = document.getElementById('mensagemAgendamento');
const resumoAgendamento = document.getElementById('resumoAgendamento');
const resumoConteudo = document.getElementById('resumoConteudo');

// ========== CARREGAMENTO DO LOCALSTORAGE ==========
function carregarAgendamentos() {
    const dados = localStorage.getItem('agendamentosClinica');
    agendamentosRealizados = dados ? JSON.parse(dados) : {};
}

function salvarAgendamentos() {
    localStorage.setItem('agendamentosClinica', JSON.stringify(agendamentosRealizados));
}

// ========== ATUALIZAR LISTA DE PROFISSIONAIS ==========
function atualizarProfissionais() {
    const servicoSelecionado = servico.value;
    profissional.innerHTML = '<option value="">Selecione um profissional</option>';
    
    if (!servicoSelecionado) {
        profissional.disabled = true;
        horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma especialidade</p>';
        horarioSelecionado.value = '';
        return;
    }
    
    profissional.disabled = false;
    const profissionais = profissionaisData[servicoSelecionado] || [];
    
    profissionais.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.id;
        option.textContent = prof.nome;
        profissional.appendChild(option);
    });
    
    // Resetar horários
    horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione um profissional</p>';
    horarioSelecionado.value = '';
}

// ========== CALCULAR DATA MÍNIMA (AMANHÃ) ==========
function obterDataMinima() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return amanha.toISOString().split('T')[0];
}

// ========== ATUALIZAR DATAS DISPONÍVEIS ==========
function atualizarDatasDisponíveis() {
    const dataMinima = obterDataMinima();
    data.setAttribute('min', dataMinima);
    data.value = '';
    
    horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma data</p>';
    horarioSelecionado.value = '';
}

// ========== VERIFICAR SE HORÁRIO ESTÁ OCUPADO ==========
function horarioOcupado(profissionalId, dataConsulta, horario) {
    const chave = `${profissionalId}_${dataConsulta}`;
    return agendamentosRealizados[chave] && agendamentosRealizados[chave].includes(horario);
}

// ========== VERIFICAR SE HORÁRIO JÁ PASSOU ==========
function horarioJaPassou(dataConsulta, horario) {
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    
    if (dataConsulta > dataAtual) {
        return false; // Data futura, horário não passou
    }
    
    if (dataConsulta === dataAtual) {
        const [horas, minutos] = horario.split(':');
        const horaAtual = hoje.getHours();
        const minutosAtuais = hoje.getMinutes();
        
        const horarioHoras = parseInt(horas);
        const horarioMinutos = parseInt(minutos);
        
        if (horarioHoras < horaAtual) return true;
        if (horarioHoras === horaAtual && horarioMinutos <= minutosAtuais) return true;
    }
    
    return false;
}

// ========== ATUALIZAR HORÁRIOS DISPONÍVEIS ==========
function atualizarHorarios() {
    const dataSelecionada = data.value;
    const profissionalId = profissional.value;
    
    horariosContainer.innerHTML = '';
    horarioSelecionado.value = '';
    mensagemAgendamento.innerHTML = '';
    
    if (!dataSelecionada) {
        horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma data</p>';
        return;
    }
    
    if (!profissionalId) {
        horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione um profissional</p>';
        return;
    }
    
    const servicoSelecionado = servico.value;
    const profissionaisList = profissionaisData[servicoSelecionado];
    const profissionalSelecionado = profissionaisList.find(p => p.id === profissionalId);
    
    if (!profissionalSelecionado) {
        horariosContainer.innerHTML = '<p class="horario-placeholder">Profissional não encontrado</p>';
        return;
    }
    
    const horariosDisponíveis = profissionalSelecionado.horarios;
    let temHorarioDisponivel = false;
    
    horariosDisponíveis.forEach(horario => {
        const div = document.createElement('div');
        div.classList.add('horario-item');
        div.textContent = horario;
        
        const ocupado = horarioOcupado(profissionalId, dataSelecionada, horario);
        const passado = horarioJaPassou(dataSelecionada, horario);
        
        if (ocupado) {
            div.classList.add('ocupado');
            div.title = 'Este horário já está agendado';
        } else if (passado) {
            div.classList.add('passado');
            div.title = 'Este horário já passou';
        } else {
            temHorarioDisponivel = true;
            div.classList.add('disponivel');
            div.addEventListener('click', () => selecionarHorario(horario, div));
        }
        
        horariosContainer.appendChild(div);
    });
    
    if (!temHorarioDisponivel) {
        mensagemAgendamento.innerHTML = '<p class="aviso">⚠️ Nenhum horário disponível para esta data. Tente selecionar outra data.</p>';
        mensagemAgendamento.classList.add('aviso-box');
    }
}

// ========== SELECIONAR HORÁRIO ==========
function selecionarHorario(horario, element) {
    // Remover seleção anterior
    document.querySelectorAll('.horario-item.selecionado').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    // Adicionar seleção ao clicado
    element.classList.add('selecionado');
    horarioSelecionado.value = horario;
    
    // Mostrar mensagem de confirmação
    mensagemAgendamento.innerHTML = `<p class="sucesso">✅ Horário ${horario} selecionado com sucesso!</p>`;
    mensagemAgendamento.classList.add('sucesso-box');
}

// ========== FORMATAR DATA ==========
function formatarData(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ========== FORMATAR TELEFONE ==========
function formatarTelefone(telefone) {
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

// ========== SUBMISSÃO DO FORMULÁRIO ==========
formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!horarioSelecionado.value) {
        alert('⚠️ Por favor, selecione um horário disponível!');
        return;
    }
    
    const nomeValue = document.getElementById('nome').value.trim();
    const emailValue = document.getElementById('email').value.trim();
    const telefoneValue = document.getElementById('telefone').value.trim();
    const dataSelecionada = data.value;
    const horario = horarioSelecionado.value;
    const profissionalId = profissional.value;
    const servicoSelecionado = servico.value;
    const motivo = document.getElementById('motivo').value.trim();
    
    // Obter dados do profissional
    const profissionaisList = profissionaisData[servicoSelecionado];
    const profissionalInfo = profissionaisList.find(p => p.id === profissionalId);
    
    // Salvar agendamento no localStorage
    const chave = `${profissionalId}_${dataSelecionada}`;
    if (!agendamentosRealizados[chave]) {
        agendamentosRealizados[chave] = [];
    }
    agendamentosRealizados[chave].push(horario);
    salvarAgendamentos();
    
    // Preparar dados do agendamento
    const dados = {
        nome: nomeValue,
        email: emailValue,
        telefone: formatarTelefone(telefoneValue),
        data: formatarData(dataSelecionada),
        horario: horario,
        profissional: profissionalInfo.nome,
        especialidade: document.querySelector(`#servico option[value="${servicoSelecionado}"]`).textContent,
        motivo: motivo || 'Consulta geral',
        timestamp: new Date().toLocaleString('pt-BR')
    };
    
    // Mostrar resumo
    exibirResumo(dados);
    
    // Log para debug
    console.log('Agendamento realizado:', dados);
});

// ========== EXIBIR RESUMO DO AGENDAMENTO ==========
function exibirResumo(dados) {
    resumoConteudo.innerHTML = `
        <div class="resumo-item">
            <span class="label">👤 Paciente:</span>
            <span class="valor">${dados.nome}</span>
        </div>
        <div class="resumo-item">
            <span class="label">📧 Email:</span>
            <span class="valor">${dados.email}</span>
        </div>
        <div class="resumo-item">
            <span class="label">📱 Telefone:</span>
            <span class="valor">${dados.telefone}</span>
        </div>
        <div class="resumo-item">
            <span class="label">🏥 Especialidade:</span>
            <span class="valor">${dados.especialidade}</span>
        </div>
        <div class="resumo-item">
            <span class="label">👨‍⚕️ Profissional:</span>
            <span class="valor">${dados.profissional}</span>
        </div>
        <div class="resumo-item">
            <span class="label">📅 Data:</span>
            <span class="valor">${dados.data}</span>
        </div>
        <div class="resumo-item">
            <span class="label">🕐 Horário:</span>
            <span class="valor">${dados.horario}</span>
        </div>
        <div class="resumo-item">
            <span class="label">📝 Motivo:</span>
            <span class="valor">${dados.motivo}</span>
        </div>
        <div class="resumo-rodape">
            <p>✅ <strong>Agendamento realizado com sucesso!</strong></p>
            <p>Um email de confirmação foi enviado para <strong>${dados.email}</strong></p>
            <p>Você será contatado para confirmar o agendamento em breve.</p>
            <p class="timestamp">Agendado em: ${dados.timestamp}</p>
        </div>
    `;
    
    resumoAgendamento.classList.remove('hidden');
    
    // Scroll para o resumo
    setTimeout(() => {
        resumoAgendamento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    
    // Mostrar alerta
    alert(`✅ Consulta agendada com sucesso!\n\n${dados.profissional}\n${dados.data} às ${dados.horario}\n\nUm email de confirmação foi enviado para ${dados.email}`);
    
    // Limpar formulário e resetar
    formulario.reset();
    horarioSelecionado.value = '';
    horariosContainer.innerHTML = '<p class="horario-placeholder">Selecione uma data</p>';
    mensagemAgendamento.innerHTML = '';
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarAgendamentos();
    
    // Configurar data mínima
    const dataMinima = obterDataMinima();
    data.setAttribute('min', dataMinima);
    
    // Desabilitar profissional inicialmente
    profissional.disabled = true;
    
    console.log('Sistema de agendamento inicializado');
    console.log('Agendamentos carregados:', agendamentosRealizados);
});
