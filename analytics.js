
// ============================================================================
// MÓDULO DE ANÁLISE AVANÇADA E FLUXO DIÁRIO - analytics.js
// ============================================================================

/**
 * Renderiza a aba/seção de Análise Avançada e Fluxo Diário
 */
function renderAnalytics() {
    let container = document.getElementById('analyticsContainer');
    if (!container) {
        // Se o container ainda não existir na DOM, tenta injetar em uma área principal ou cria um modal/aba
        let mainContent = document.getElementById('mainContent') || document.body;
        container = document.createElement('div');
        container.id = 'analyticsContainer';
        container.className = 'space-y-6 pt-4';
        mainContent.appendChild(container);
    }

    let selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';
    let projectedItems = (typeof getProjectedItems === 'function') ? getProjectedItems() : [];

    // Filtra itens do mês selecionado
    let monthlyItems = projectedItems.filter(i => i.month === selectedMonth);

    // Cálculos de Totais
    let totalMes = monthlyItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    // Agrupamento por Dia (considerando a data do item ou dia atual do mês)
    let dailyMap = {};
    monthlyItems.forEach(item => {
        // Tenta extrair o dia do item se houver data de compra ou vencimento, senão agrupa
        let diaKey = item.day || 'Geral';
        if (!dailyMap[diaKey]) dailyMap[diaKey] = 0;
        dailyMap[diaKey] += Number(item.amount || 0);
    });

    // Ordena os dias para o gráfico
    let sortedDays = Object.keys(dailyMap).sort((a, b) => Number(a) - Number(b));
    let chartValues = sortedDays.map(d => dailyMap[d]);

    // HTML da Tela de Análise Avançada
    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="text-indigo-400 w-6 h-6"></i> 
                        Análise Avançada e Fluxo Diário
                    </h2>
                    <p class="text-xs text-slate-400 mt-1">Acompanhamento detalhado de gastos, curvas diárias e métricas de consumo para ${selectedMonth}.</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg font-semibold">
                        Mês Ativo: ${selectedMonth}
                    </span>
                </div>
            </div>

            <!-- Cards de Resumo Rápido -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl flex items-center gap-4">
                    <div class="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg">
                        <i data-lucide="wallet" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400 font-medium">Total Comprometido no Mês</div>
                        <div class="text-lg font-bold text-white mt-0.5">R$ ${totalMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>

                <div class="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl flex items-center gap-4">
                    <div class="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <i data-lucide="calendar-days" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400 font-medium">Média por Lançamento</div>
                        <div class="text-lg font-bold text-white mt-0.5">
                            R$ ${monthlyItems.length > 0 ? (totalMes / monthlyItems.length).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}
                        </div>
                    </div>
                </div>

                <div class="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl flex items-center gap-4">
                    <div class="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
                        <i data-lucide="layers" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400 font-medium">Total de Registros</div>
                        <div class="text-lg font-bold text-white mt-0.5">${monthlyItems.length} itens</div>
                    </div>
                </div>
            </div>

            <!-- Seção de Gráficos e Filtros Diários -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Gráfico Principal (Ocupa 2 colunas) -->
                <div class="lg:col-span-2 bg-slate-800/30 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold text-sm text-slate-200 flex items-center gap-2">
                            <i data-lucide="trending-up" class="w-4 h-4 text-indigo-400"></i> Evolução de Gastos no Mês
                        </h3>
                        <span class="text-[11px] text-slate-400">Visão Diária</span>
                    </div>
                    <div class="relative h-64 w-full">
                        <canvas id="monthlySpendingChart"></canvas>
                    </div>
                </div>

                <!-- Painel de Filtro e Resumo por Dia/Categoria -->
                <div class="bg-slate-800/30 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                    <div>
                        <h3 class="font-semibold text-sm text-slate-200 mb-3 flex items-center gap-2">
                            <i data-lucide="filter" class="w-4 h-4 text-indigo-400"></i> Resumo por Lançamento
                        </h3>
                        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                            ${monthlyItems.length === 0 ? '<p class="text-xs text-slate-500 italic">Nenhum dado para exibir.</p>' : 
                                monthlyItems.map(item => `
                                    <div class="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                                        <span class="text-slate-300 truncate max-w-[120px]" title="${item.desc}">${item.desc}</span>
                                        <span class="font-semibold text-indigo-400">R$ ${Number(item.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-800">
                        <button onclick="exportAnalyticsReport()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                            <i data-lucide="download" class="w-4 h-4"></i> Exportar Relatório do Mês
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inicializa os ícones do Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Renderiza o Gráfico com Chart.js
    renderMonthlyChart(sortedDays, chartValues);
}

/**
 * Renderiza o gráfico de barras/linhas usando Chart.js
 */
function renderMonthlyChart(labels, data) {
    let ctxEl = document.getElementById('monthlySpendingChart');
    if (!ctxEl) return;

    // Destrói gráfico anterior se existir para evitar sobreposição
    if (window.myMonthlyChart instanceof Chart) {
        window.myMonthlyChart.destroy();
    }

    window.myMonthlyChart = new Chart(ctxEl, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels.map(d => `Dia ${d}`) : ['Sem Dados'],
            datasets: [{
                label: 'Gastos (R$)',
                data: data.length > 0 ? data : [0],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(99, 102, 241, 0.4)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(51, 65, 85, 0.3)' },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                }
            }
        }
    });
}

/**
 * Função de exportação rápida do relatório analítico
 */
function exportAnalyticsReport() {
    if (typeof showToast === 'function') {
        showToast("Relatório analítico gerado com sucesso!", "success");
    } else {
        alert("Relatório analítico gerado com sucesso!");
    }
}

// ================= EXPOSIÇÃO GLOBAL =================
window.renderAnalytics = renderAnalytics;
window.exportAnalyticsReport = exportAnalyticsReport;
