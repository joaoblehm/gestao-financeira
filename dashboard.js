/**
 * Renderiza o painel principal (Dashboard & Extrato):
 * - Filtra as despesas projetadas com base no mês selecionado, categoria e termo de busca.
 * - Aplica paginação (40 itens por página) e cores dinâmicas nas categorias.
 * - Popula a tabela de lançamentos na interface.
 * - Calcula o salário líquido total e os KPIs.
 */
function renderDashboard() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    const categoryFilter = document.getElementById('filterCategory').value;
    const search = document.getElementById('searchBox').value.toLowerCase();

    let projectedItems = getProjectedItems();

    let filtered = projectedItems.filter(item => {
        let matchMonth = item.month === selectedMonth;
        let matchCat = categoryFilter ? item.category === categoryFilter : true;
        let matchSearch = item.desc.toLowerCase().includes(search) || item.category.toLowerCase().includes(search) || item.card.toLowerCase().includes(search);
        return matchMonth && matchCat && matchSearch;
    });

    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let counterEl = document.getElementById('counterLancamentos');
    if (counterEl) counterEl.innerText = `${filtered.length} itens`;

    // Aplicação da paginação (40 itens por página)
    if (typeof window.currentPage === 'undefined') window.currentPage = 1;
    let paginatedFiltered = (typeof paginateItems === 'function') ? paginateItems(filtered) : filtered;

    let totalGastosMes = 0;
    let totalPendenteMes = 0;

    // Totais calculados sobre o total filtrado (não apenas a página atual)
    filtered.forEach(item => {
        totalGastosMes += item.amount;
        if (!item.paid) totalPendenteMes += item.amount;
    });

    paginatedFiltered.forEach(item => {
        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        
        // Cores dinâmicas para a categoria
        let catClass = (typeof getCategoryClass === 'function') ? getCategoryClass(item.category) : 'cat-outro';

        // Tratamento da Data Real da Compra (DD/MM/AAAA)
        let rawDate = item.date || '';
        let displayDate = '-';
        if (rawDate && rawDate.includes('-')) {
            let parts = rawDate.split('-'); // Formato YYYY-MM-DD
            if (parts.length === 3) {
                displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        } else if (rawDate) {
            displayDate = rawDate;
        }

        tr.innerHTML = `
            <td class="py-3 px-4 text-xs font-semibold text-indigo-300">${displayDate}</td>
            <td class="py-3 px-4 font-medium text-white">${item.desc}</td>
            <td class="py-3 px-4"><span class="badge-categoria ${catClass}">${item.category}</span></td>
            <td class="py-3 px-4 text-slate-300">${item.card}</td>
            <td class="py-3 px-4 text-xs font-semibold text-indigo-400">${item.instStr}</td>
            <td class="py-3 px-4 text-right font-semibold text-white">R$ ${item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-right text-slate-400">R$ ${item.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="togglePaidStatus(${item.parentId}, '${item.month}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${item.paid ? 'Pago' : 'Pendente'}
                </button>
            </td>
            <td class="py-3 px-4 text-center flex items-center justify-center gap-1">
                <button onclick="editExpense(${item.parentId})" class="p-1 hover:text-indigo-400 text-slate-400 transition" title="Editar"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                <button onclick="deleteExpense(${item.parentId})" class="p-1 hover:text-rose-400 text-slate-400 transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Renderiza a paginação abaixo da tabela se existir contentor
    if (typeof renderPaginationControls === 'function') {
        renderPaginationControls(filtered.length, 'paginationContainer');
    }

    // Leitura estrita do Salário Configurado para o Mês
    let salConfig = { base: 0, discount: 0 };
    if (typeof salaryConfigs !== 'undefined' && Array.isArray(salaryConfigs)) {
        let cleanSel = selectedMonth.replace(/\s+/g, '').replace(/\//g, '').toLowerCase();
        let sc = salaryConfigs.find(s => s.month && s.month.replace(/\s+/g, '').replace(/\//g, '').toLowerCase() === cleanSel);
        if (sc) {
            if (sc.deleted) {
                salConfig = { base: 0, discount: 0 };
            } else {
                salConfig = { base: Number(sc.base) || 0, discount: Number(sc.discount) || 0 };
            }
        }
    }

    let salarioLiquidoBase = salConfig.base - salConfig.discount;

    // Leitura e soma de todas as Rendas Extras ativas para o mês selecionado (com suporte a propagação)
    let totalExtraIncome = 0;
    if (typeof getActiveIncomesForMonth === 'function') {
        let activeIncs = getActiveIncomesForMonth(selectedMonth);
        totalExtraIncome = activeIncs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    } else if (typeof extraIncomes !== 'undefined' && Array.isArray(extraIncomes)) {
        let cleanSel = selectedMonth.replace(/\s+/g, '').replace(/\//g, '').toLowerCase();
        extraIncomes.filter(e => {
            if (!e.month) return true;
            let cleanEMonth = e.month.replace(/\s+/g, '').replace(/\//g, '').toLowerCase();
            return cleanEMonth === cleanSel;
        }).forEach(e => {
            totalExtraIncome += Number(e.amount) || 0;
        });
    }

    let salarioLiquidoTotal = salarioLiquidoBase + totalExtraIncome;
    let sobra = salarioLiquidoTotal - totalGastosMes;

    // Atualização dos elementos visuais dos KPIs no Dashboard
    let kpiSalario = document.getElementById('kpiSalario');
    if (kpiSalario) kpiSalario.innerText = `R$ ${salarioLiquidoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    let subText = `Base R$ ${salConfig.base.toLocaleString('pt-BR', {minimumFractionDigits: 2})} | Descontos R$ ${salConfig.discount.toFixed(2)}`;
    if (totalExtraIncome > 0) {
        subText += ` + Extra R$ ${totalExtraIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }
    let kpiSalarioSub = document.getElementById('kpiSalarioSub');
    if (kpiSalarioSub) kpiSalarioSub.innerText = subText;

    let kpiGastos = document.getElementById('kpiGastos');
    if (kpiGastos) kpiGastos.innerText = `R$ ${totalGastosMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    let kpiFalta = document.getElementById('kpiFalta');
    if (kpiFalta) kpiFalta.innerText = `R$ ${totalPendenteMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    let sobraEl = document.getElementById('kpiSobra');
    let subSobraEl = document.getElementById('subSobra');
    let iconSobra = document.getElementById('iconSobra');

    if (sobraEl) {
        sobraEl.innerText = `${sobra < 0 ? '-' : '+'}R$ ${Math.abs(sobra).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        if (sobra < 0) {
            sobraEl.className = "text-2xl font-bold text-rose-400";
            if (iconSobra) {
                iconSobra.className = "text-rose-400 w-4 h-4";
                iconSobra.setAttribute('data-lucide', 'trending-down');
            }
            if (subSobraEl) subSobraEl.innerText = "Déficit no mês (Gastos > Renda)";
        } else {
            sobraEl.className = "text-2xl font-bold text-emerald-400";
            if (iconSobra) {
                iconSobra.className = "text-emerald-400 w-4 h-4";
                iconSobra.setAttribute('data-lucide', 'trending-up');
            }
            if (subSobraEl) subSobraEl.innerText = "Sobra líquida em caixa";
        }
    }

    // Verificação de alertas automáticos 100% responsivos para mobile
    let totalCartoesMes = filtered
        .filter(i => i.category === 'Cartão de Crédito')
        .reduce((acc, curr) => acc + curr.amount, 0);

    let alertsHtml = '';

    if (totalCartoesMes > 3000) {
        alertsHtml += `
            <div class="bg-rose-950/90 border-2 border-rose-600 text-rose-100 p-4 sm:p-5 rounded-xl shadow-2xl flex flex-col gap-2.5 animate-pulse w-full max-w-full box-border">
                <div class="flex items-center gap-3 w-full">
                    <div class="p-2 bg-rose-600 text-white rounded-lg shadow-inner shrink-0 flex items-center justify-center">
                        <i data-lucide="skull" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </div>
                    <h4 class="font-black text-xs sm:text-base uppercase tracking-wider text-rose-300 leading-snug">⚠️ PERIGO EXTREMO: FATURA DOS CARTÕES ESTOURADA! ⚠️</h4>
                </div>
                <p class="text-xs sm:text-sm font-medium text-rose-200 break-words w-full">A soma dos cartões neste mês atingiu <strong class="text-white underline">R$ ${totalCartoesMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> (Ultrapassou o limite de R$ 3.000,00!). Cuidado com o abismo financeiro!</p>
            </div>
        `;
    }

    if (totalGastosMes > 4500) {
        alertsHtml += `
            <div class="bg-red-950/90 border-2 border-red-500 text-red-100 p-4 sm:p-5 rounded-xl shadow-2xl flex flex-col gap-2.5 animate-bounce w-full max-w-full box-border">
                <div class="flex items-center gap-3 w-full">
                    <div class="p-2 bg-red-600 text-white rounded-lg shadow-inner shrink-0 flex items-center justify-center">
                        <i data-lucide="alert-octagon" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </div>
                    <h4 class="font-black text-xs sm:text-base uppercase tracking-wider text-red-300 leading-snug">🚨 ALERTA VERMELHO: GASTOS TOTAIS ACIMA DE R$ 4.500! 🚨</h4>
                </div>
                <p class="text-xs sm:text-sm font-medium text-red-200 break-words w-full">O total de todas as contas juntas neste mês está em <strong class="text-white underline">R$ ${totalGastosMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>! Se prepare pois a situação está crítica!</p>
            </div>
        `;
    }

    if (sobra > 1000) {
        alertsHtml += `
            <div class="bg-emerald-950/80 border-2 border-emerald-500 text-emerald-100 p-4 sm:p-5 rounded-xl shadow-xl flex flex-col gap-2.5 w-full max-w-full box-border">
                <div class="flex items-center gap-3 w-full">
                    <div class="p-2 bg-emerald-600 text-white rounded-lg shadow-inner shrink-0 flex items-center justify-center">
                        <i data-lucide="party-popper" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                    </div>
                    <h4 class="font-bold text-xs sm:text-base uppercase tracking-wider text-emerald-300 leading-snug">🎉 BOA, JOÃO! SOBRA GIGANTE NO CAIXA! 🎉</h4>
                </div>
                <p class="text-xs sm:text-sm font-medium text-emerald-200 break-words w-full">Parabéns! Vai sobrar <strong class="text-white underline">R$ ${sobra.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> livres no seu saldo neste mês (acima de R$ 1.000,00). Excelente gestão!</p>
            </div>
        `;
    }

    let alertsContainer = document.getElementById('dynamicAlertsContainer');
    if (alertsContainer) alertsContainer.innerHTML = alertsHtml;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
