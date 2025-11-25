// --- Definições e Variáveis Globais ---
const PRECOS_POR_MINUTO = {
    'Estudante': 0.15,
    'Babá': 0.25,
    'Diarista': 0.35
};

// Elementos do DOM
const salarioMensalEl = document.getElementById('salario-mensal');
const mesInicioDisplayEl = document.getElementById('mes-inicio-display');
const iniciarMesBtn = document.getElementById('iniciar-mes-btn');
const estudanteBtn = document.getElementById('estudante-btn');
const babaBtn = document.getElementById('baba-btn');
const diaristaBtn = document.getElementById('diarista-btn');
const esqueceuBtn = document.getElementById('esqueceu-btn');
const tarefaStatusEl = document.getElementById('tarefa-status');
const tarefaInicioEl = document.getElementById('tarefa-inicio');
const tarefaFuncaoEl = document.getElementById('tarefa-funcao');
const historicoListaEl = document.getElementById('historico-lista');

// --- Estrutura de Dados (Estado da Aplicação) ---
let estado = {
    salario: 0,
    mesInicio: null, // timestamp
    tarefaEmAndamento: null, // { funcao: '...', inicio: timestamp }
    historico: [] // [ { funcao: '...', ganho: 0.00, data: '...', duracao: '...' } ]
};

// --- Funções de Ajuda e Formatação ---

// Formata um valor numérico para o formato de moeda Real (R$)
const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

// Formata um timestamp (número de ms desde 1970) para uma string de data/hora
const formatarDataHora = (timestamp) => {
    if (!timestamp) return 'N/A';
    const data = new Date(timestamp);
    const dataStr = data.toLocaleDateString('pt-BR');
    const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataStr} às ${horaStr}`;
};

// --- Persistência de Dados (localStorage) ---

// Salva o estado atual no localStorage
const salvarEstado = () => {
    localStorage.setItem('pontoEletronicoEstado', JSON.stringify(estado));
};

// Carrega o estado do localStorage
const carregarEstado = () => {
    const estadoSalvo = localStorage.getItem('pontoEletronicoEstado');
    if (estadoSalvo) {
        estado = JSON.parse(estadoSalvo);
    }
    // Inicializa o salário em 0.00 se for undefined ou null
    if (typeof estado.salario !== 'number') {
        estado.salario = 0;
    }
};

// --- Renderização na Tela ---

// Atualiza todos os elementos visuais com base no estado
const renderizar = () => {
    // 1. Salário Mensal e Início do Mês
    salarioMensalEl.textContent = formatarMoeda(estado.salario);
    mesInicioDisplayEl.textContent = estado.mesInicio
        ? `Mês iniciado em: ${formatarDataHora(estado.mesInicio)}`
        : 'Mês iniciado em: N/A (Clique "Iniciar Mês")';

    // 2. Tarefa Atual
    const tarefa = estado.tarefaEmAndamento;
    if (tarefa) {
        tarefaStatusEl.textContent = 'Trabalhando...';
        tarefaStatusEl.style.color = '#e74c3c'; // Cor vermelha para ativo
        tarefaInicioEl.textContent = formatarDataHora(tarefa.inicio);
        tarefaFuncaoEl.textContent = tarefa.funcao;

        // Adiciona classe 'active' ao botão em uso
        document.querySelectorAll('.btn.task').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tarefa.funcao.toLowerCase().replace(/á/g, 'a')}-btn`).classList.add('active');
    } else {
        tarefaStatusEl.textContent = 'Parado';
        tarefaStatusEl.style.color = '#2ecc71'; // Cor verde para parado
        tarefaInicioEl.textContent = 'N/A';
        tarefaFuncaoEl.textContent = 'Nenhuma';
        document.querySelectorAll('.btn.task').forEach(btn => btn.classList.remove('active'));
    }

    // 3. Histórico
    historicoListaEl.innerHTML = '';
    estado.historico.slice().reverse().forEach(registro => { // Inverte para mostrar o mais recente primeiro
        const li = document.createElement('li');
        li.textContent = `[${registro.data}] ${registro.funcao}: ${registro.duracao} - Ganho: ${formatarMoeda(registro.ganho)}`;
        historicoListaEl.appendChild(li);
    });
};

// --- Funções de Ação dos Botões ---

// 1. Iniciar Mês
iniciarMesBtn.onclick = () => {
    const dataAtual = Date.now();
    const mensagem = estado.mesInicio
        ? `O mês já foi iniciado em ${formatarDataHora(estado.mesInicio)}. Deseja REINICIAR o mês (Salário = R$ 0,00, Histórico = Vazio)?`
        : 'Deseja iniciar sua jornada mensal de trabalho agora?';

    if (confirm(mensagem)) {
        estado.salario = 0;
        estado.mesInicio = dataAtual;
        estado.tarefaEmAndamento = null;
        estado.historico = [];
        salvarEstado();
        renderizar();
        alert(`Novo mês iniciado com sucesso em ${formatarDataHora(dataAtual)}!`);
    }
};

// 2, 3, 4. Início/Término de Tarefas
const gerenciarTarefa = (funcao) => {
    const precoMinuto = PRECOS_POR_MINUTO[funcao];
    const agora = Date.now();

    if (!estado.tarefaEmAndamento) {
        // INICIAR TAREFA
        
        // Bloqueia se outra tarefa estiver ativa (embora os botões fiquem desativados, é uma checagem de segurança)
        if (document.querySelector('.btn.active')) {
            alert('Você já está em uma tarefa. Finalize-a antes de iniciar outra.');
            return;
        }

        estado.tarefaEmAndamento = {
            funcao: funcao,
            inicio: agora
        };
        salvarEstado();
        renderizar();
    } else if (estado.tarefaEmAndamento.funcao === funcao) {
        // TERMINAR TAREFA (Clicou no mesmo botão)
        const inicio = estado.tarefaEmAndamento.inicio;
        const duracaoMs = agora - inicio;
        const duracaoMinutos = duracaoMs / (1000 * 60);

        if (duracaoMinutos < 1) {
            alert('A duração foi muito curta (menos de 1 minuto). O registro não será salvo.');
            estado.tarefaEmAndamento = null;
            salvarEstado();
            renderizar();
            return;
        }

        const ganho = duracaoMinutos * precoMinuto;
        estado.salario += ganho;
        
        const duracaoHoras = duracaoMinutos / 60;
        const horas = Math.floor(duracaoHoras);
        const minutos = Math.round((duracaoHoras - horas) * 60);
        const duracaoFormatada = `${horas}h ${minutos}min`;

        const registro = {
            funcao: funcao,
            ganho: ganho,
            data: formatarDataHora(inicio),
            duracao: duracaoFormatada
        };

        estado.historico.push(registro);
        estado.tarefaEmAndamento = null; // Zera a tarefa
        
        salvarEstado();
        renderizar();
        alert(`Tarefa ${funcao} finalizada! Ganho: ${formatarMoeda(ganho)} por ${duracaoFormatada}. Salário atual: ${formatarMoeda(estado.salario)}`);

    } else {
        // Clicou em um botão diferente enquanto uma tarefa estava ativa
        alert(`Você está atualmente em uma tarefa de **${estado.tarefaEmAndamento.funcao}**. Finalize-a antes de iniciar **${funcao}**.`);
    }
};

// Atribui a função de gerenciamento aos botões
estudanteBtn.onclick = () => gerenciarTarefa('Estudante');
babaBtn.onclick = () => gerenciarTarefa('Babá');
diaristaBtn.onclick = () => gerenciarTarefa('Diarista');

// 5. Esqueceu? (Ajuste Manual)
esqueceuBtn.onclick = () => {
    // 1. Pergunta o tempo trabalhado
    let tempoMinutosStr = prompt("Esqueceu de registrar? Digite o TEMPO TRABALHADO em minutos (ex: 60 para 1 hora):");
    if (tempoMinutosStr === null) return; // Cancelou
    
    const tempoMinutos = parseFloat(tempoMinutosStr);
    if (isNaN(tempoMinutos) || tempoMinutos <= 0) {
        alert("Tempo inválido. Por favor, digite um número positivo de minutos.");
        return;
    }

    // 2. Pergunta a função
    const funcoes = Object.keys(PRECOS_POR_MINUTO);
    let funcao = prompt(`Qual função você realizou? Digite o número correspondente:\n1 - ${funcoes[0]}\n2 - ${funcoes[1]}\n3 - ${funcoes[2]}`);
    if (funcao === null) return; // Cancelou

    let funcaoNome;
    switch (funcao.trim()) {
        case '1': funcaoNome = funcoes[0]; break;
        case '2': funcaoNome = funcoes[1]; break;
        case '3': funcaoNome = funcoes[2]; break;
        default:
            alert("Opção de função inválida.");
            return;
    }

    const precoMinuto = PRECOS_POR_MINUTO[funcaoNome];
    const ganho = tempoMinutos * precoMinuto;
    
    // 3. Atualiza o salário e o histórico
    estado.salario += ganho;
    
    const horas = Math.floor(tempoMinutos / 60);
    const minutos = Math.round(tempoMinutos % 60);
    const duracaoFormatada = `${horas}h ${minutos}min`;
    
    const registro = {
        funcao: `${funcaoNome} (Ajuste)`,
        ganho: ganho,
        data: formatarDataHora(Date.now()),
        duracao: duracaoFormatada
    };

    estado.historico.push(registro);
    salvarEstado();
    renderizar();
    alert(`Ajuste concluído! Adicionado ${formatarMoeda(ganho)} de ${funcaoNome}. Salário atual: ${formatarMoeda(estado.salario)}.`);
};

// --- Inicialização ---

// Carrega o estado ao carregar a página e renderiza
window.onload = () => {
    carregarEstado();
    renderizar();
};
