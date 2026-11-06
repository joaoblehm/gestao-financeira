// ============================================================================
// DASHBOARD & RENDERIZAÇÃO - dashboard.js (Atualizado com Cores e Paginação)
// ============================================================================

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

        tr.innerHTML = `
            <td class="py-3 px-4 text-xs text-slate-400">${item.month}</td>
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

    // Leitura e soma de todas as Rendas Extras cadastradas para o mês selecionado
    let totalExtraIncome = 0;
    if (typeof extraIncomes !== 'undefined' && Array.isArray(extraIncomes)) {
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

    // Verificação de alertas automáticos
    let totalCartoesMes = filtered
        .filter(i => i.category === 'Cartão de Crédito')
        .reduce((acc, curr) => acc + curr.amount, 0);

    let alertsHtml = '';

    if (totalCartoesMes > 3000) {
        alertsHtml += `
            <div class="bg-rose-950/90 border-2 border-rose-600 text-rose-100 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-pulse">
                <div class="p-3 bg-rose-600 text-white rounded-lg shadow-inner">
                    <i data-lucide="skull" class="w-8 h-8"></i>
                </div>
                <div>
                    <h4 class="font-black text-lg uppercase tracking-wider text-rose-300">⚠️ PERIGO EXTREMO: FATURA DOS CARTÕES ESTOURADA! ⚠️</h4>
                    <p class="text-sm font-medium text-rose-200 mt-0.5">A soma dos cartões neste mês atingiu <strong class="text-white underline">R$ ${totalCartoesMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> (Ultrapassou o limite de R$ 3.000,00!). Cuidado com o abismo financeiro!</p>
                </div>
            </div>
        `;
    }

    if (totalGastosMes > 4500) {
        alertsHtml += `
            <div class="bg-red-950/90 border-2 border-red-500 text-red-100 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce">
                <div class="p-3 bg-red-600 text-white rounded-lg shadow-inner">
                    <i data-lucide="alert-octagon" class="w-8 h-8"></i>
                </div>
                <div>
                    <h4 class="font-black text-lg uppercase tracking-wider text-red-300">🚨 ALERTA VERMELHO APOCALÍPTICO: GASTOS TOTAIS ACIMA DE R$ 4.500! 🚨</h4>
                    <p class="text-sm font-medium text-red-200 mt-0.5">O total de todas as contas juntas neste mês está em <strong class="text-white underline">R$ ${totalGastosMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>! Se prepare pois a situação está crítica!</p>
                </div>
            </div>
        `;
    }

    if (sobra > 1000) {
        alertsHtml += `
            <div class="bg-emerald-950/80 border-2 border-emerald-500 text-emerald-100 px-5 py-4 rounded-xl shadow-xl flex items-center gap-4">
                <div class="p-3 bg-emerald-600 text-white rounded-lg shadow-inner">
                    <i data-lucide="party-popper" class="w-8 h-8"></i>
                </div>
                <div>
                    <h4 class="font-bold text-lg uppercase tracking-wider text-emerald-300">🎉 BOA, JOÃO! SOBRA GIGANTE NO CAIXA! 🎉</h4>
                    <p class="text-sm font-medium text-emerald-200 mt-0.5">Parabéns! Vai sobrar <strong class="text-white underline">R$ ${sobra.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> livres no seu saldo neste mês (acima de R$ 1.000,00). Excelente gestão!</p>
                </div>
            </div>
        `;
    }

    let alertsContainer = document.getElementById('dynamicAlertsContainer');
    if (alertsContainer) alertsContainer.innerHTML = alertsHtml;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Renderiza a aba de Cartões & Faturas:
 * - Lista todos os cartões cadastrados em formato de grid.
 * - Calcula o total da fatura de cada cartão para o mês selecionado.
 * - Calcula o Limite Disponível em tempo real.
 */
function renderCardsView() {
    const grid = document.getElementById('cardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (typeof cards === 'undefined' || cards.length === 0) {
        grid.innerHTML = `<p class="text-slate-500 italic col-span-full">Nenhum cartão cadastrado.</p>`;
        return;
    }

    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let projectedItems = getProjectedItems();

    if (typeof cardPaidMonths === 'undefined') {
        window.cardPaidMonths = JSON.parse(localStorage.getItem('srin_card_paid_months')) || {};
    }

    const hoje = new Date();
    const diaAtual = hoje.getDate();

    cards.forEach(card => {
        let monthlyCardItems = projectedItems.filter(i => i.card === card.name && i.month === selectedMonth);
        
        let closingDay = Number(card.closingDay) || 1;
        let dueDay = Number(card.dueDay) || 1;

        let isClosingToday = (diaAtual === closingDay);
        let isDueTodayOrPassed = (diaAtual >= dueDay);

        if (!cardPaidMonths[card.name]) cardPaidMonths[card.name] = {};
        let isCardQuitado = !!cardPaidMonths[card.name][selectedMonth];

        let cardClasses = "bg-slate-900 border rounded-xl p-5 flex flex-col justify-between shadow-sm transition relative overflow-hidden";
        let badgeHtml = '';

        if (isCardQuitado) {
            cardClasses += " border-emerald-500/80 shadow-emerald-950/40 shadow-lg";
            badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> FATURA QUITADA (${selectedMonth})</span>`;
        } else if (isDueTodayOrPassed) {
            cardClasses += " border-rose-500 shadow-rose-950/50 shadow-lg";
            badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">⚠️ VENCIDO / VENCE HOJE (Dia ${dueDay})</span>`;
        } else if (isClosingToday) {
            cardClasses += " border-amber-500 shadow-amber-950/50 shadow-lg animate-pulse";
            badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">🔔 FECHA HOJE (Dia ${closingDay})</span>`;
        } else {
            cardClasses += " border-slate-800";
        }

        let cardDiv = document.createElement('div');
        cardDiv.className = cardClasses;
        
        let itemsHtml = '';

        if (monthlyCardItems.length === 0) {
            itemsHtml = `<p class="text-xs text-slate-500 italic py-2">Nenhum lançamento neste cartão para ${selectedMonth}.</p>`;
        } else {
            itemsHtml = `<div class="space-y-2 my-3 max-h-56 overflow-y-auto pr-1">`;
            
            monthlyCardItems.forEach(item => {
                let itemQuitado = item.paid || isCardQuitado;
                itemsHtml += `
                    <div class="flex justify-between items-center bg-slate-800/40 p-2.5 rounded-lg text-xs border border-slate-800">
                        <div>
                            <div class="font-medium text-white">${item.desc}</div>
                            <div class="text-slate-400 text-[10px] mt-0.5">Parcela: <span class="text-indigo-400 font-semibold">${item.instStr}</span></div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-white">R$ ${item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            <span class="text-[10px] ${itemQuitado ? 'text-emerald-400' : 'text-amber-400'}">${itemQuitado ? 'Quitado' : 'Pendente'}</span>
                        </div>
                    </div>
                `;
            });
            itemsHtml += `</div>`;
        }

        let totalCardFat = monthlyCardItems.reduce((acc, curr) => acc + curr.amount, 0);

        let limitStatus = (typeof getCardLimitStatus === 'function') 
            ? getCardLimitStatus(card.name, selectedMonth, card.limit) 
            : { available: Math.max(0, Number(card.limit || 0) - totalCardFat) };

        cardDiv.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2 mb-2">
                    <div class="flex-1">
                        <h3 class="font-bold text-white text-base flex items-center gap-2">
                            <i data-lucide="credit-card" class="text-indigo-400 w-5 h-5 shrink-0"></i> 
                            <span class="truncate">${card.name}</span>
                        </h3>
                        <div>${badgeHtml}</div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
                        <button onclick="openCardModal(${card.id})" class="text-slate-300 hover:text-indigo-400 transition p-1" title="Editar Cartão"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="deleteCard(${card.id})" class="text-slate-300 hover:text-rose-400 transition p-1" title="Excluir Cartão"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <div class="text-xs text-slate-400 space-y-1.5 mb-3 mt-2">
                    <div class="flex justify-between">
                        <span>Fechamento: Dia ${card.closingDay}</span>
                        <span>Vencimento: Dia ${card.dueDay}</span>
                    </div>
                    <div class="flex justify-between font-medium text-slate-300">
                        <span>Limite Total:</span>
                        <span>R$ ${Number(card.limit || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800/60">
                        <span>Limite Disponível:</span>
                        <span>R$ ${limitStatus.available.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
                <div class="border-t border-slate-800 pt-2 mb-2 flex justify-between items-center">
                    <span class="text-xs font-semibold text-slate-300">Fatura (${selectedMonth}):</span>
                    <span class="text-sm font-bold text-indigo-400">R$ ${totalCardFat.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                ${itemsHtml}
            </div>
            <div class="space-y-2 mt-3 pt-3 border-t border-slate-800">
                <button onclick="toggleCardMonthPaid('${card.name}', '${selectedMonth}')" class="w-full py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition ${isCardQuitado ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}">
                    <i data-lucide="${isCardQuitado ? 'check-check' : 'check'}" class="w-4 h-4"></i>
                    ${isCardQuitado ? 'Fatura Quitada (Clique para Reabrir)' : 'Marcar Fatura como Quitada'}
                </button>
                <button onclick="openExpenseModalForCard('${card.name}')" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i> Adicionar Gasto neste Cartão
                </button>
            </div>
        `;
        grid.appendChild(cardDiv);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Alterna o status de quitação da fatura de um cartão específico para o mês selecionado.
 */
function toggleCardMonthPaid(cardName, month) {
    if (typeof cardPaidMonths === 'undefined') {
        window.cardPaidMonths = JSON.parse(localStorage.getItem('srin_card_paid_months')) || {};
    }
    if (!cardPaidMonths[cardName]) cardPaidMonths[cardName] = {};

    let currentState = !!cardPaidMonths[cardName][month];
    let newState = !currentState;
    cardPaidMonths[cardName][month] = newState;

    if (typeof expenses !== 'undefined') {
        expenses.forEach(exp => {
            if (exp.card === cardName) {
                let projected = getProjectedItems().filter(i => Number(i.parentId || i.id) === Number(exp.parentId || exp.id) && i.month === month);
                if (projected.length > 0) {
                    if (!exp.paidMonths) exp.paidMonths = {};
                    exp.paidMonths[month] = newState;
                }
            }
        });
    }

    localStorage.setItem('srin_card_paid_months', JSON.stringify(cardPaidMonths));
    saveData();
    renderApp();

    if (typeof showToast === 'function') {
        showToast(newState ? `Fatura de ${cardName} (${month}) marcada como quitada!` : `Fatura de ${cardName} (${month}) reaberta.`, "success");
    }
}

/**
 * Renderiza a aba de Contas da Casa:
 * - Filtra e exibe apenas os lançamentos pertencentes à categoria "Contas de Casa" para o mês ativo.
 */
function renderHouseView() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let projectedItems = getProjectedItems();
    let houseItems = projectedItems.filter(i => i.month === selectedMonth && i.category === 'Contas de Casa');

    const tbody = document.getElementById('houseTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (houseItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500">Nenhuma conta de casa registrada para ${selectedMonth}.</td></tr>`;
        return;
    }

    houseItems.forEach(item => {
        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        let catClass = (typeof getCategoryClass === 'function') ? getCategoryClass(item.category) : 'cat-outro';

        tr.innerHTML = `
            <td class="py-3 px-4 text-xs text-slate-400">${item.month}</td>
            <td class="py-3 px-4 text-xs text-slate-300">Data Base</td>
            <td class="py-3 px-4 font-medium text-white">${item.desc}</td>
            <td class="py-3 px-4 text-right font-semibold text-white">R$ ${item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
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
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
