// ============================================================================
// MÓDULO DE ANÁLISE AVANÇADA E FLUXO - analytics.js (Completo & Interativo)
// ============================================================================

window.analyticsChartInstance = null;

function renderAnalytics() {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');

    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <!-- Cabeçalho da Seção -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="text-indigo-400"></i> Análise Avançada e Fluxo Temporal
                    </h2>
                    <p class="text-xs text-slate-400 mt-1">Visão completa por período, somas dinâmicas e comparação de despesas e entradas.</p>
                </div>
                <div class="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                    <span class="text-xs font-semibold text-slate-300">Mês Ativo:</span>
                    <span class="text-xs font-bold text-indigo-400">${selectedMonth}</span>
                </div>
            </div>

            <!-- Controles de Filtros Avançados (Tipo, Categoria e Período Específico) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <!-- Filtro Tipo (Despesas vs Entradas) -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tipo de Movimento</label>
                    <select id="anlyTypeFilter" onchange="updateAnalyticsView()" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="expenses">Despesas / Gastos</option>
                        <option value="incomes">Entradas (Salário & Renda)</option>
                        <option value="all">Visão Consolidada (Geral)</option>
                    </select>
                </div>

                <!-- Filtro de Categoria -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
                    <select id="anlyCategoryFilter" onchange="updateAnalyticsView()" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="">Todas as Categorias</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Mercado">Mercado</option>
                        <option value="Contas de Casa">Contas de Casa</option>
                        <option value="Assinaturas">Assinaturas</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>

                <!-- Seletor de Visão Gráfica / Período -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Agrupamento Temporal</label>
                    <select id="anlyViewMode" onchange="toggleAnlySubFilters(); updateAnalyticsView();" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="daily">Diário (Dia a Dia)</option>
                        <option value="weekly">Semanal (Por Semana)</option>
                        <option value="monthly">Mensal (Visão do Mês)</option>
                    </select>
                </div>

                <!-- Sub-filtro para escolher Dia Específico ou Semana Específica -->
                <div id="anlySubFilterContainer">
                    <label id="anlySubFilterLabel" class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Filtrar Dia Específico</label>
                    <select id="anlySpecificDay" onchange="updateAnalyticsView()" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="">Todos os Dias do Mês</option>
                    </select>
                </div>
            </div>

            <!-- KPIs de Resumo Analítico -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div class="text-xs text-slate-400 font-medium">Soma Total do Período</div>
                    <div class="text-2xl font-bold text-white mt-1" id="anlyKpiTotal">R$ 0,00</div>
                    <div class="text-[11px] text-indigo-400 mt-0.5" id="anlyKpiSub">Filtro aplicado com sucesso</div>
                </div>
                <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div class="text-xs text-slate-400 font-medium">Média por Lançamento / Dia</div>
                    <div class="text-2xl font-bold text-indigo-400 mt-1" id="anlyKpiAverage">R$ 0,00</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">Média estatística</div>
                </div>
                <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div class="text-xs text-slate-400 font-medium">Total de Registros Analisados</div>
                    <div class="text-2xl font-bold text-emerald-400 mt-1" id="anlyKpiCount">0 itens</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">Itens no escopo atual</div>
                </div>
            </div>

            <!-- Gráfico Principal (Chart.js) -->
            <div class="bg-slate-950 border border-slate-800 p-5 rounded-xl relative h-80">
                <canvas id="analyticsChart"></canvas>
            </div>

            <!-- Tabela Detalhada do Filtro Atual -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div class="px-5 py-3 border-b border-slate-800 flex justify-between items-center">
                    <h3 class="font-bold text-white text-sm">Detalhamento dos Lançamentos no Filtro</h3>
                    <span id="anlyTableCount" class="text-xs text-slate-400">0 itens</span>
                </div>
                <div class="overflow-x-auto max-h-72 overflow-y-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0">
                                <th class="py-2.5 px-4 font-semibold">Data / Mês</th>
                                <th class="py-2.5 px-4 font-semibold">Descrição</th>
                                <th class="py-2.5 px-4 font-semibold">Categoria</th>
                                <th class="py-2.5 px-4 font-semibold">Origem / Cartão</th>
                                <th class="py-2.5 px-4 font-semibold text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody id="anlyTableBody" class="divide-y divide-slate-800 text-slate-300"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    populateAnlyDayOptions(selectedMonth);
    updateAnalyticsView();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleAnlySubFilters() {
    let mode = document.getElementById('anlyViewMode')?.value;
    let label = document.getElementById('anlySubFilterLabel');
    let select = document.getElementById('anlySpecificDay');
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';

    if (!label || !select) return;

    if (mode === 'daily') {
        label.innerText = "Filtrar Dia Específico";
        populateAnlyDayOptions(selectedMonth);
    } else if (mode === 'weekly') {
        label.innerText = "Filtrar Semana Específica";
        select.innerHTML = `
            <option value="">Todas as Semanas</option>
            <option value="Semana 1">Semana 1 (Dias 1 a 7)</option>
            <option value="Semana 2">Semana 2 (Dias 8 a 14)</option>
            <option value="Semana 3">Semana 3 (Dias 15 a 21)</option>
            <option value="Semana 4">Semana 4 (Dias 22 a 31)</option>
        `;
    } else {
        label.innerText = "Visão Mensal";
        select.innerHTML = `<option value="">Todo o Mês</option>`;
    }
}

function populateAnlyDayOptions(selectedMonth) {
    let select = document.getElementById('anlySpecificDay');
    if (!select) return;
    
    // Mantém a primeira opção
    select.innerHTML = `<option value="">Todos os Dias do Mês</option>`;
    for (let d = 1; d <= 31; d++) {
        let dayStr = d < 10 ? `0${d}` : `${d}`;
        let opt = document.createElement('option');
        opt.value = dayStr;
        opt.innerText = `Dia ${dayStr} do Mês`;
        select.appendChild(opt);
    }
}

function updateAnalyticsView() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';
    const typeFilter = document.getElementById('anlyTypeFilter')?.value || 'expenses';
    const categoryFilter = document.getElementById('anlyCategoryFilter')?.value || '';
    const viewMode = document.getElementById('anlyViewMode')?.value || 'daily';
    const specificVal = document.getElementById('anlySpecificDay')?.value || '';

    let dataset = [];

    // Coleta dados conforme o tipo selecionado
    if (typeFilter === 'expenses' || typeFilter === 'all') {
        let projected = (typeof getProjectedItems === 'function') ? getProjectedItems() : [];
        projected.forEach(item => {
            if (item.month === selectedMonth) {
                dataset.push({
                    date: item.date || '01',
                    desc: item.desc,
                    category: item.category,
                    card: item.card || 'Geral',
                    amount: Number(item.amount) || 0,
                    type: 'Despesa'
                });
            }
        });
    }

    if (typeFilter === 'incomes' || typeFilter === 'all') {
        let incomes = [];
        if (typeof getActiveIncomesForMonth === 'function') {
            incomes = getActiveIncomesForMonth(selectedMonth);
        } else if (typeof extraIncomes !== 'undefined') {
            incomes = extraIncomes;
        }
        incomes.forEach(inc => {
            dataset.push({
                date: inc.date || '01',
                desc: inc.desc || inc.name || 'Entrada',
                category: inc.category || 'Salário / Renda',
                card: 'Conta / Caixa',
                amount: Number(inc.amount) || 0,
                type: 'Entrada'
            });
        });
    }

    // Aplica filtro de categoria (se selecionado)
    if (categoryFilter) {
        dataset = dataset.filter(item => item.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    }

    // Aplica filtro de dia específico ou semana específica
    if (specificVal) {
        if (viewMode === 'daily') {
            dataset = dataset.filter(item => String(item.date).padStart(2, '0') === String(specificVal).padStart(2, '0'));
        } else if (viewMode === 'weekly') {
            let dayNum = parseInt(item.date) || 1;
            let weekGroup = 'Semana 4';
            if (dayNum <= 7) weekGroup = 'Semana 1';
            else if (dayNum <= 14) weekGroup = 'Semana 2';
            else if (dayNum <= 21) weekGroup = 'Semana 3';
            dataset = dataset.filter(() => weekGroup === specificVal);
        }
    }

    // Cálculos de KPIs
    let totalSum = dataset.reduce((acc, curr) => acc + curr.amount, 0);
    let avg = dataset.length > 0 ? totalSum / dataset.length : 0;

    document.getElementById('anlyKpiTotal').innerText = `R$ ${totalSum.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('anlyKpiAverage').innerText = `R$ ${avg.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('anlyKpiCount').innerText = `${dataset.length} itens`;

    // Preenche tabela detalhada
    let tbody = document.getElementById('anlyTableBody');
    let countEl = document.getElementById('anlyTableCount');
    if (tbody) {
        tbody.innerHTML = '';
        if (dataset.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500 italic">Nenhum registro encontrado para este filtro.</td></tr>`;
        } else {
            dataset.forEach(item => {
                let tr = document.createElement('tr');
                tr.className = "hover:bg-slate-900/60 transition";
                tr.innerHTML = `
                    <td class="py-2.5 px-4 text-slate-400">${item.date} / ${selectedMonth.split('/')[0]}</td>
                    <td class="py-2.5 px-4 font-medium text-white">${item.desc}</td>
                    <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">${item.category}</span></td>
                    <td class="py-2.5 px-4 text-slate-400">${item.card}</td>
                    <td class="py-2.5 px-4 text-right font-bold ${item.type === 'Entrada' ? 'text-emerald-400' : 'text-white'}">R$ ${item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                `;
                tbody.appendChild(tr);
            });
        }
        if (countEl) countEl.innerText = `${dataset.length} itens`;
    }

    // Renderiza Gráfico Chart.js
    renderAnalyticsChart(dataset, viewMode);
}

function renderAnalyticsChart(dataset, viewMode) {
    const ctx = document.getElementById('analyticsChart')?.getContext('2d');
    if (!ctx) return;

    let labels = [];
    let dataValues = [];

    if (viewMode === 'daily') {
        let grouped = {};
        for (let i = 1; i <= 31; i++) {
            let dKey = i < 10 ? `0${i}` : `${i}`;
            grouped[dKey] = 0;
        }
        dataset.forEach(item => {
            let dayKey = String(item.date).padStart(2, '0');
            if (grouped[dayKey] !== undefined) {
                grouped[dayKey] += item.amount;
            } else {
                grouped[dayKey] = item.amount;
            }
        });
        labels = Object.keys(grouped).map(d => `Dia ${d}`);
        dataValues = Object.values(grouped);
    } else if (viewMode === 'weekly') {
        let weeks = { 'Semana 1 (1-7)': 0, 'Semana 2 (8-14)': 0, 'Semana 3 (15-21)': 0, 'Semana 4 (22+)': 0 };
        dataset.forEach(item => {
            let dNum = parseInt(item.date) || 1;
            if (dNum <= 7) weeks['Semana 1 (1-7)'] += item.amount;
            else if (dNum <= 14) weeks['Semana 2 (8-14)'] += item.amount;
            else if (dNum <= 21) weeks['Semana 3 (15-21)'] += item.amount;
            else weeks['Semana 4 (22+)'] += item.amount;
        });
        labels = Object.keys(weeks);
        dataValues = Object.values(weeks);
    } else {
        let total = dataset.reduce((acc, curr) => acc + curr.amount, 0);
        labels = ['Total do Mês'];
        dataValues = [total];
    }

    if (window.analyticsChartInstance) {
        window.analyticsChartInstance.destroy();
    }

    window.analyticsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor (R$)',
                data: dataValues,
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(129, 140, 248, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.raw || 0;
                            return ` R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 },
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// ================= EXPOSIÇÃO GLOBAL =================
window.renderAnalytics = renderAnalytics;
window.updateAnalyticsView = updateAnalyticsView;
window.toggleAnlySubFilters = toggleAnlySubFilters;
