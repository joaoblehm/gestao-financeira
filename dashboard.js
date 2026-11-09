// ============================================================================
// DASHBOARD & RENDERIZAÇÃO COMPLETA - dashboard.js (Profissional Brasil)
// ============================================================================

/**
 * Renderiza o painel principal (Dashboard & Extrato):
 * - Filtra as despesas projetadas com base no mês selecionado, categoria e termo de busca.
 * - Aplica paginação e exibe estritamente a data real formatada (DD/MM/AAAA).
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

    if (typeof window.currentPage === 'undefined') window.currentPage = 1;
    let paginatedFiltered = (typeof paginateItems === 'function') ? paginateItems(filtered) : filtered;

    let totalGastosMes = 0;
    let totalPendenteMes = 0;

    // Soma rigorosa de todos os gastos do mês (incluindo Cartões, Contas Fixas e Contas da Casa)
    filtered.forEach(item => {
        totalGastosMes += Number(item.amount || 0);
        if (!item.paid) totalPendenteMes += Number(item.amount || 0);
    });

    paginatedFiltered.forEach(item => {
        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        
        let catClass = (typeof getCategoryClass === 'function') ? getCategoryClass(item.category) : 'cat-outro';

        // --- CONVERSÃO RIGOROSA DA DATA PARA O FORMATO BRASILEIRO (DD/MM/AAAA) ---
        let rawDate = item.date || item.rawDate || '';
        let displayDate = '-';
        
        if (rawDate && rawDate.includes('-')) {
            let parts = rawDate.split('-'); // Formato YYYY-MM-DD
            if (parts.length === 3) {
                displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        } else if (rawDate && rawDate.includes('/')) {
            displayDate = rawDate; // Já formatado
        } else {
            const mapMonthNum = {
                'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
                'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
                'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
            };
            let [mName, yStr] = selectedMonth.split('/');
            let mNum = mapMonthNum[mName?.trim()] || '11';
            let yearVal = yStr || '2026';
            displayDate = `01/${mNum}/${yearVal}`;
        }

        tr.innerHTML = `
            <td class="py-3 px-4 text-xs font-semibold text-indigo-300">${displayDate}</td>
            <td class="py-3 px-4 font-medium text-white">${item.desc}</td>
            <td class="py-3 px-4"><span class="badge-categoria ${catClass}">${item.category}</span></td>
            <td class="py-3 px-4 text-slate-300">${item.card}</td>
            <td class="py-3 px-4 text-xs font-semibold text-indigo-400">${item.instStr}</td>
            <td class="py-3 px-4 text-right font-semibold text-white">R$ ${Number(item.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-right text-slate-400">R$ ${Number(item.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
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

    if (typeof renderPaginationControls === 'function') {
        renderPaginationControls(filtered.length, 'paginationContainer');
    }

    // --- CÁLCULO DE SALÁRIO E RENDAS EXTRAS ---
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

    // --- ATUALIZAÇÃO DOS KPIS ---
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

    // --- ALERTAS AUTOMÁTICOS ---
    let totalCartoesMes = filtered
        .filter(i => i.category === 'Cartão de Crédito')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

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

/**
 * Renderiza a aba de Cartões & Faturas.
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

    const mesesMap = {
        'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3, 'Maio': 4, 'Junho': 5,
        'Julho': 6, 'Agosto': 7, 'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
    };

    const hoje = new Date();
    const anoAtualReal = hoje.getFullYear();
    const mesAtualReal = hoje.getMonth();
    const diaAtualReal = hoje.getDate();

    let [nomeMesSel, anoSelStr] = selectedMonth.split('/');
    let mesSelIndex = mesesMap[nomeMesSel?.trim()] !== undefined ? mesesMap[nomeMesSel.trim()] : mesAtualReal;
    let anoSel = parseInt(anoSelStr) || anoAtualReal;

    let selDateObj = new Date(anoSel, mesSelIndex, 1);
    let realDateObj = new Date(anoAtualReal, mesAtualReal, 1);

    let isFutureMonth = selDateObj > realDateObj;
    let isPastMonth = selDateObj < realDateObj;

    cards.forEach(card => {
        let monthlyCardItems = projectedItems.filter(i => i.card === card.name && i.month === selectedMonth);
        
        let closingDay = Number(card.closingDay) || 1;
        let dueDay = Number(card.dueDay) || 1;

        if (!cardPaidMonths[card.name]) cardPaidMonths[card.name] = {};
        let isCardQuitado = !!cardPaidMonths[card.name][selectedMonth];

        let cardClasses = "bg-slate-900 border rounded-xl p-5 flex flex-col justify-between shadow-sm transition relative overflow-hidden";
        let badgeHtml = '';

        if (isCardQuitado) {
            cardClasses += " border-emerald-500/80 shadow-emerald-950/40 shadow-lg";
            badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> FATURA QUITADA (${selectedMonth})</span>`;
        } else if (isFutureMonth) {
            cardClasses += " border-slate-800";
            badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">📅 Fatura Futura / Aberta</span>`;
        } else if (isPastMonth) {
            cardClasses += " border-rose-500/80 shadow-rose-950/40 shadow-lg";
            badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">⚠️ PENDENTE (Mês Anterior)</span>`;
        } else {
            let isVencidoOuHoje = (diaAtualReal >= dueDay);
            let isFechado = false;
            if (closingDay > dueDay) {
                isFechado = (diaAtualReal >= closingDay || diaAtualReal < dueDay);
            } else {
                isFechado = (diaAtualReal >= closingDay && diaAtualReal < dueDay);
            }

            if (isVencidoOuHoje) {
                cardClasses += " border-rose-500 shadow-rose-950/50 shadow-lg animate-pulse";
                badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">⚠️ VENCIDO / VENCE HOJE (Dia ${dueDay})</span>`;
            } else if (isFechado) {
                cardClasses += " border-amber-500 shadow-amber-950/50 shadow-lg";
                badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">🔔 FATURA FECHADA (Vence dia ${dueDay})</span>`;
            } else {
                cardClasses += " border-slate-800";
                badgeHtml = `<span class="inline-block mt-2 px-2.5 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">🛒 Fatura Aberta</span>`;
            }
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
                let rawItDate = item.date || item.rawDate || '';
                let itemDate = 'Data';
                if (rawItDate && rawItDate.includes('-')) {
                    let p = rawItDate.split('-');
                    if (p.length === 3) itemDate = `${p[2]}/${p[1]}/${p[0]}`;
                } else if (rawItDate) {
                    itemDate = rawItDate;
                }

                itemsHtml += `
                    <div class="flex justify-between items-center bg-slate-800/40 p-2.5 rounded-lg text-xs border border-slate-800">
                        <div>
                            <div class="text-[10px] text-indigo-400 font-semibold mb-0.5">${itemDate}</div>
                            <div class="font-medium text-white">${item.desc}</div>
                            <div class="text-slate-400 text-[10px] mt-0.5">Parcela: <span class="text-indigo-400 font-semibold">${item.instStr}</span></div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-white">R$ ${Number(item.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            <span class="text-[10px] ${itemQuitado ? 'text-emerald-400' : 'text-amber-400'}">${itemQuitado ? 'Quitado' : 'Pendente'}</span>
                        </div>
                    </div>
                `;
            });
            itemsHtml += `</div>`;
        }

        let totalCardFat = monthlyCardItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

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
 * Renderiza a aba completa de Salário & Renda.
 */
function renderSalaryView() {
    const container = document.getElementById('salaryContainer') || document.getElementById('salaryViewContainer');
    if (!container) return;
    
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    
    let salConfig = { base: 0, discount: 0 };
    if (typeof salaryConfigs !== 'undefined' && Array.isArray(salaryConfigs)) {
        let cleanSel = selectedMonth.replace(/\s+/g, '').replace(/\//g, '').toLowerCase();
        let sc = salaryConfigs.find(s => s.month && s.month.replace(/\s+/g, '').replace(/\//g, '').toLowerCase() === cleanSel);
        if (sc && !sc.deleted) {
            salConfig = { base: Number(sc.base) || 0, discount: Number(sc.discount) || 0 };
        }
    }

    let extraListHtml = '';
    let currentExtras = (typeof extraIncomes !== 'undefined') ? extraIncomes.filter(e => !e.month || e.month === selectedMonth) : [];
    
    if (currentExtras.length === 0) {
        extraListHtml = `<p class="text-xs text-slate-500 italic">Nenhuma renda extra cadastrada para ${selectedMonth}.</p>`;
    } else {
        currentExtras.forEach((inc) => {
            extraListHtml += `
                <div class="flex justify-between items-center bg-slate-800/40 p-3 rounded-lg text-xs border border-slate-800">
                    <div>
                        <div class="font-medium text-white">${inc.desc}</div>
                        <div class="text-[10px] text-emerald-400 mt-0.5">Renda Ativa</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-emerald-400">R$ ${Number(inc.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        <button onclick="deleteExtraIncome(${inc.id})" class="text-slate-400 hover:text-rose-400 transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = `
        <div class="space-y-6 max-w-4xl mx-auto">
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <i data-lucide="dollar-sign" class="text-emerald-400 w-5 h-5"></i>
                    Configuração de Salário Base (${selectedMonth})
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Salário Base (R$)</label>
                        <input type="number" step="0.01" id="inputSalBase" value="${salConfig.base}" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Descontos / INSS / IRRF (R$)</label>
                        <input type="number" step="0.01" id="inputSalDiscount" value="${salConfig.discount}" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500">
                    </div>
                </div>
                <div class="flex justify-end pt-2">
                    <button onclick="saveSalaryConfigFromScreen()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-600/20">
                        Salvar Configuração de Salário
                    </button>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <i data-lucide="plus-circle" class="text-indigo-400 w-5 h-5"></i>
                    Rendas Extras e Entradas de Caixa (${selectedMonth})
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-400 mb-1">Descrição da Renda Extra</label>
                        <input type="text" id="extraDescInput" placeholder="Ex: Freela, Dividendos, Venda..." class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Valor (R$)</label>
                        <input type="number" step="0.01" id="extraAmountInput" placeholder="0.00" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </div>
                </div>
                <div class="flex justify-end">
                    <button onclick="addExtraIncomeFromScreen()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                        Adicionar Renda Extra
                    </button>
                </div>
                <div class="border-t border-slate-800 pt-4 space-y-2">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rendas Registradas</h4>
                    ${extraListHtml}
                </div>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Renderiza a aba completa de Análise Avançada.
 */
function renderAdvancedAnalysisView() {
    const container = document.getElementById('advancedAnalysisContainer') || document.getElementById('analysisViewContainer');
    if (!container) return;

    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let projectedItems = getProjectedItems();
    let monthItems = projectedItems.filter(i => i.month === selectedMonth);

    let totalGasto = monthItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    let catTotals = {};
    monthItems.forEach(i => {
        let cat = i.category || 'Outros';
        catTotals[cat] = (catTotals[cat] || 0) + Number(i.amount || 0);
    });

    let catHtml = '';
    Object.keys(catTotals).forEach(cat => {
        let val = catTotals[cat];
        let pct = totalGasto > 0 ? ((val / totalGasto) * 100).toFixed(1) : 0;
        catHtml += `
            <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-white">${cat}</span>
                    <div class="text-slate-400 text-[10px] mt-0.5">${pct}% do total de gastos</div>
                </div>
                <span class="font-semibold text-indigo-400">R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="space-y-6 max-w-4xl mx-auto">
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <i data-lucide="bar-chart-3" class="text-indigo-400 w-5 h-5"></i>
                    Análise de Gastos por Categoria (${selectedMonth})
                </h3>
                <div class="text-sm text-slate-300 mb-4">
                    Total de Gastos no Período: <strong class="text-white">R$ ${totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                </div>
                <div class="space-y-2">
                    ${catHtml || '<p class="text-xs text-slate-500 italic">Nenhum gasto registrado para análise neste mês.</p>'}
                </div>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function saveSalaryConfigFromScreen() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';
    let base = parseFloat(document.getElementById('inputSalBase')?.value) || 0;
    let discount = parseFloat(document.getElementById('inputSalDiscount')?.value) || 0;

    if (typeof salaryConfigs === 'undefined') window.salaryConfigs = [];

    let cleanSel = selectedMonth.replace(/\s+/g, '').replace(/\//g, '').toLowerCase();
    let existingIndex = salaryConfigs.findIndex(s => s.month && s.month.replace(/\s+/g, '').replace(/\//g, '').toLowerCase() === cleanSel);

    if (existingIndex !== -1) {
        salaryConfigs[existingIndex].base = base;
        salaryConfigs[existingIndex].discount = discount;
        salaryConfigs[existingIndex].deleted = false;
    } else {
        salaryConfigs.push({ month: selectedMonth, base, discount, deleted: false });
    }

    if (typeof saveData === 'function') saveData();
    if (typeof renderApp === 'function') renderApp();
    if (typeof showToast === 'function') showToast("Salário atualizado com sucesso!", "success");
}

function addExtraIncomeFromScreen() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';
    let desc = document.getElementById('extraDescInput')?.value.trim();
    let amount = parseFloat(document.getElementById('extraAmountInput')?.value) || 0;

    if (!desc || !amount) {
        if (typeof showToast === 'function') showToast("Preencha a descrição e o valor da renda extra.", "error");
        else alert("Preencha a descrição e o valor da renda extra.");
        return;
    }

    if (typeof extraIncomes === 'undefined') window.extraIncomes = [];

    let newId = extraIncomes.length > 0 ? Math.max(...extraIncomes.map(e => e.id || 0)) + 1 : 1;
    extraIncomes.push({
        id: newId,
        month: selectedMonth,
        desc,
        amount
    });

    if (typeof saveData === 'function') saveData();
    if (typeof renderApp === 'function') renderApp();
    if (typeof showToast === 'function') showToast("Renda extra adicionada com sucesso!", "success");
}

function deleteExtraIncome(id) {
    if (typeof extraIncomes === 'undefined') return;
    window.extraIncomes = extraIncomes.filter(e => Number(e.id) !== Number(id));
    if (typeof saveData === 'function') saveData();
    if (typeof renderApp === 'function') renderApp();
    if (typeof showToast === 'function') showToast("Renda extra excluída.", "success");
}

// ================= EXPOSIÇÃO GLOBAL =================
window.renderDashboard = renderDashboard;
window.renderCardsView = renderCardsView;
window.renderSalaryView = renderSalaryView;
window.renderAdvancedAnalysisView = renderAdvancedAnalysisView;
window.saveSalaryConfigFromScreen = saveSalaryConfigFromScreen;
window.addExtraIncomeFromScreen = addExtraIncomeFromScreen;
window.deleteExtraIncome = deleteExtraIncome;
