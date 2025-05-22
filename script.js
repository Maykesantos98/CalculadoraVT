// Inicializar o calendário com o mês atual
document.addEventListener('DOMContentLoaded', function() {
    const dataAtual = new Date();
    document.getElementById('mes').value = dataAtual.getMonth() + 1;
    gerarCalendario();

    // Adicionar listeners para os checkboxes de tarifa
    // Isso garante que o campo de input seja ativado/desativado junto com o checkbox
    document.querySelectorAll('.tarifas-grid input[type="checkbox"]').forEach(checkbox => {
        const inputId = checkbox.id.replace('usar-', ''); // Obtém o ID do input correspondente
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            checkbox.addEventListener('change', () => {
                inputElement.disabled = !checkbox.checked;
                // Opcional: Se desmarcado, definir o valor do input para 0 para evitar confusão visual no cálculo
                // if (!checkbox.checked) {
                //     inputElement.value = "0.00";
                // }
            });
            // Definir o estado inicial do input baseado no checkbox
            inputElement.disabled = !checkbox.checked;
        }
    });
});

function switchTab(tabId) {
    // Desativar todas as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Ativar a aba selecionada
    document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function gerarCalendario() {
    const mes = parseInt(document.getElementById('mes').value);
    const ano = 2025; // Ano fixo conforme data atual
    const calendarDiv = document.getElementById('calendar');
    calendarDiv.innerHTML = '';

    // Gerar os dias do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const primeiroDiaSemana = primeiroDia.getDay(); // 0 = Domingo, 6 = Sábado

    // Adicionar espaços vazios para alinhar o primeiro dia
    for (let i = 0; i < primeiroDiaSemana; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day');
        emptyDay.style.visibility = 'hidden';
        calendarDiv.appendChild(emptyDay);
    }

    // Adicionar os dias do mês
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = dia;
        dayDiv.dataset.dia = dia;

        // Verificar se é fim de semana
        const dataDia = new Date(ano, mes - 1, dia);
        const diaSemana = dataDia.getDay();
        if (diaSemana === 0 || diaSemana === 6) {
            dayDiv.classList.add('weekend');
        }

        // Adicionar evento de clique
        dayDiv.addEventListener('click', function() {
            this.classList.toggle('selected');
        });

        calendarDiv.appendChild(dayDiv);
    }
}

function getDiasSelecionados() {
    if (document.getElementById('tab-dias').classList.contains('active')) {
        // Pegar dias selecionados do calendário
        const selectedDays = document.querySelectorAll('.calendar-day.selected');
        return Array.from(selectedDays).map(day => parseInt(day.dataset.dia)).sort((a, b) => a - b);
    } else {
        // Pegar dias da entrada manual
        const diasInput = document.getElementById('dias-trabalhados').value; // Corrigido ID para 'dias-trabalhados'
        if (!diasInput || parseInt(diasInput) === 0) {
            return []; // Retorna array vazio se nenhum dia for inserido
        }
        // Para entrada manual, crie um array com o número de dias inseridos (simulando dias)
        // Isso é uma simplificação, você pode ajustar se precisar de "dias" reais
        const numDias = parseInt(diasInput);
        return Array.from({ length: numDias }, (_, i) => i + 1);
    }
}

function verificarDomingo(dia, mes) {
    const ano = 2025; // Ano fixo conforme data atual
    const data = new Date(ano, mes - 1, dia);
    return data.getDay() === 0; // 0 representa domingo
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcular() {
    const dias = getDiasSelecionados();
    if (dias.length === 0) {
        alert('Por favor, selecione ou insira pelo menos um dia!');
        return;
    }

    // Obter valores das tarifas
    const tarifaOnibusSP = parseFloat(document.getElementById('tarifa-onibus').value);
    const tarifaMetro = parseFloat(document.getElementById('tarifa-metro').value);
    const tarifaEMTUI = parseFloat(document.getElementById('tarifa-emtu-ida').value);
    const tarifaEMTUV = parseFloat(document.getElementById('tarifa-emtu-volta').value);
    const integracao = parseFloat(document.getElementById('integracao').value);

    // Obter o estado dos checkboxes
    const usarOnibus = document.getElementById('usar-onibus').checked;
    const usarMetro = document.getElementById('usar-metro').checked;
    const usarEMTUI = document.getElementById('usar-emtu-ida').checked;
    const usarEMTUV = document.getElementById('usar-emtu-volta').checked;
    const usarIntegracao = document.getElementById('usar-integracao').checked;
    const domingoEspecial = document.getElementById('domingo-especial').checked;
    const mes = parseInt(document.getElementById('mes').value);

    let totalSP = 0;
    let totalEMTU = 0;
    const detalhamento = [];

    dias.forEach(dia => {
        const isDomingo = verificarDomingo(dia, mes);
        let diaSP = 0;
        let diaEMTU = 0;
        let bilheteSPIda = 0;
        let bilheteSPVolta = 0;
        let bilheteEMTUIda = 0;
        let bilheteEMTUV = 0;
        let bilheteIntegracao = 0;

        // Para dias normais (segunda a sábado)
        if (!isDomingo) {
            // Ida
            if (usarOnibus) bilheteSPIda = tarifaOnibusSP;
            if (usarEMTUI) bilheteEMTUIda = tarifaEMTUI;

            // Volta
            if (usarEMTUV) bilheteEMTUV = tarifaEMTUV;
            if (usarMetro) bilheteSPVolta = tarifaMetro;
            if (usarIntegracao) bilheteIntegracao = integracao;

            diaSP = bilheteSPIda + bilheteSPVolta + bilheteIntegracao;
            diaEMTU = bilheteEMTUIda + bilheteEMTUV;

        } else if (domingoEspecial) {
            // Para domingos com regras especiais:
            // - Ônibus SP grátis (se marcado, mas prevalece a regra de gratuidade)
            // - Metrô na volta: tarifa normal (se marcado)
            
            // Ida
            // Ônibus SP grátis na ida (mesmo que 'usarOnibus' esteja marcado)
            bilheteSPIda = 0; 
            if (usarEMTUI) bilheteEMTUIda = tarifaEMTUI; // EMTU ida

            // Volta
            if (usarMetro) bilheteSPVolta = tarifaMetro; // Metrô na volta
            // Integração com ônibus SP é grátis no domingo especial
            bilheteIntegracao = 0; 
            if (usarEMTUV) bilheteEMTUV = tarifaEMTUV; // EMTU volta

            diaSP = bilheteSPIda + bilheteSPVolta + bilheteIntegracao;
            diaEMTU = bilheteEMTUIda + bilheteEMTUV;

        } else {
            // Domingos sem regras especiais (cálculo normal)
            // Ida
            if (usarOnibus) bilheteSPIda = tarifaOnibusSP;
            if (usarEMTUI) bilheteEMTUIda = tarifaEMTUI;

            // Volta
            if (usarEMTUV) bilheteEMTUV = tarifaEMTUV;
            if (usarMetro) bilheteSPVolta = tarifaMetro;
            if (usarIntegracao) bilheteIntegracao = integracao;

            diaSP = bilheteSPIda + bilheteSPVolta + bilheteIntegracao;
            diaEMTU = bilheteEMTUIda + bilheteEMTUV;
        }

        totalSP += diaSP;
        totalEMTU += diaEMTU;

        detalhamento.push({
            dia: dia,
            isDomingo: isDomingo,
            diaSP: diaSP,
            diaEMTU: diaEMTU,
            diaTotal: diaSP + diaEMTU,
            // Adicionando detalhes das tarifas usadas para o detalhamento
            bilheteSPIda: bilheteSPIda,
            bilheteSPVolta: bilheteSPVolta,
            bilheteEMTUIda: bilheteEMTUIda,
            bilheteEMTUV: bilheteEMTUV,
            bilheteIntegracao: bilheteIntegracao
        });
    });

    const totalGeral = totalSP + totalEMTU;

    // Exibir resultados
    document.getElementById('total-sp').textContent = formatarMoeda(totalSP);
    document.getElementById('total-emtu').textContent = formatarMoeda(totalEMTU);
    document.getElementById('total-geral').textContent = formatarMoeda(totalGeral);

    // Exibir detalhamento por dia
    const detalhamentoDiv = document.getElementById('detalhamento');
    let detalhamentoHTML = '<table class="summary-table">';
    detalhamentoHTML += `
        <tr>
            <th>Dia</th>
            <th>Ônibus SP (Ida)</th>
            <th>Metrô (Volta)</th>
            <th>Integr. (Volta)</th>
            <th>EMTU (Ida)</th>
            <th>EMTU (Volta)</th>
            <th>Total do Dia</th>
        </tr>
    `;

    detalhamento.forEach(item => {
        const diaNome = item.isDomingo ? `<span class="weekend">${item.dia} (Dom)</span>` : item.dia;
        detalhamentoHTML += `
            <tr>
                <td>${diaNome}</td>
                <td>${formatarMoeda(item.bilheteSPIda)}</td>
                <td>${formatarMoeda(item.bilheteSPVolta)}</td>
                <td>${formatarMoeda(item.bilheteIntegracao)}</td>
                <td>${formatarMoeda(item.bilheteEMTUIda)}</td>
                <td>${formatarMoeda(item.bilheteEMTUV)}</td>
                <td><strong>${formatarMoeda(item.diaTotal)}</strong></td>
            </tr>
        `;
    });

    detalhamentoHTML += '</table>';
    detalhamentoDiv.innerHTML = detalhamentoHTML;

    // Exibir a div de resultado
    document.getElementById('resultado').style.display = 'block';
}
