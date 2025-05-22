// Inicializar o calendário com o mês atual
document.addEventListener('DOMContentLoaded', function() {
  const dataAtual = new Date();
  document.getElementById('mes').value = dataAtual.getMonth() + 1;
  gerarCalendario();
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
    const diasInput = document.getElementById('dias').value;
    return diasInput.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d)).sort((a, b) => a - b);
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
    alert('Por favor, selecione pelo menos um dia!');
    return;
  }
  
  // Obter valores das tarifas
  const tarifaOnibusSP = parseFloat(document.getElementById('tarifa-onibus').value);
  const tarifaMetro = parseFloat(document.getElementById('tarifa-metro').value);
  const tarifaEMTUI = parseFloat(document.getElementById('tarifa-emtu-ida').value);
  const tarifaEMTUV = parseFloat(document.getElementById('tarifa-emtu-volta').value);
  const integracao = parseFloat(document.getElementById('integracao').value);
  const domingoEspecial = document.getElementById('domingo-especial').checked;
  const mes = parseInt(document.getElementById('mes').value);
  
  let totalSP = 0;
  let totalEMTU = 0;
  const detalhamento = [];
  
  dias.forEach(dia => {
    const isDomingo = verificarDomingo(dia, mes);
    let diaSP = 0;
    let diaEMTU = 0;
    
    // Para dias normais (segunda a sábado)
    if (!isDomingo) {
      // Ida
      diaSP += tarifaOnibusSP;
      diaEMTU += tarifaEMTUI;
      
      // Volta
      diaEMTU += tarifaEMTUV;
      diaSP += tarifaMetro + integracao; // Metrô + integração com ônibus
    } else if (domingoEspecial) {
      // Para domingos com regras especiais:
      // - Ônibus SP grátis
      // - Metrô na volta: tarifa normal (5 reais)
      diaSP += 0; // Ônibus SP grátis na ida
      diaEMTU += tarifaEMTUI; // EMTU ida
      
      diaSP += tarifaMetro; // Metrô na volta (5 reais)
      diaEMTU += tarifaEMTUV; // EMTU volta
    } else {
      // Domingos sem regras especiais (cálculo normal)
      diaSP += tarifaOnibusSP; // Ônibus SP normal na ida
      diaEMTU += tarifaEMTUI; // EMTU ida
      diaEMTU += tarifaEMTUV; // EMTU volta
      diaSP += tarifaMetro + integracao; // Metrô + integração com ônibus na volta
    }
    
    totalSP += diaSP;
    totalEMTU += diaEMTU;
    
    detalhamento.push({
      dia: dia,
      isDomingo: isDomingo,
      diaSP: diaSP,
      diaEMTU: diaEMTU,
      diaTotal: diaSP + diaEMTU
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
      <th>Bilhete SP</th>
      <th>EMTU</th>
      <th>Total do Dia</th>
    </tr>
  `;
  
  detalhamento.forEach(item => {
    let bilheteSPInfo = formatarMoeda(item.diaSP);
    
    // Adicionar detalhes extras para domingos
    if (item.isDomingo && domingoEspecial) {
      bilheteSPInfo = `${formatarMoeda(0)} (ônibus ida) + ${formatarMoeda(tarifaMetro)} (metrô volta) = ${formatarMoeda(item.diaSP)}`;
    }
    
    const diaNome = item.isDomingo ? `<span class="weekend">${item.dia} (Dom)</span>` : item.dia;
    detalhamentoHTML += `
      <tr>
        <td>${diaNome}</td>
        <td>${bilheteSPInfo}</td>
        <td>${formatarMoeda(item.diaEMTU)}</td>
        <td><strong>${formatarMoeda(item.diaTotal)}</strong></td>
      </tr>
    `;
  });
  
  detalhamentoHTML += '</table>';
  detalhamentoDiv.innerHTML = detalhamentoHTML;
  
  // Exibir a div de resultado
  document.getElementById('resultado').style.display = 'block';
}
