// ============================================================================
// MÓDULO DE GERENCIAMENTO DE CARTÕES DE CRÉDITO - cards.js
// ============================================================================

function openCardModal(id = null) {
    let modal = document.getElementById('cardModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    let form = document.getElementById('cardForm');
    if (form) form.reset();
    
    let idInput = document.getElementById('cardId');
    if (idInput) idInput.value = '';
    
    let modalTitle = modal.querySelector('h3');
    if (modalTitle) modalTitle.innerText = 'Cadastrar Cartão de Crédito';
    
    if (id !== null && typeof cards !== 'undefined') {
        let card = cards.find(c => Number(c.id) === Number(id));
        if (card) {
            if (idInput) idInput.value = card.id;
            let nameField = document.getElementById('cardName');
            let closingField = document.getElementById('cardClosingDay');
            let dueField = document.getElementById('cardDueDate');
            let limitField = document.getElementById('cardLimit');

            if (nameField) nameField.value = card.name;
            if (closingField) closingField.value = card.closingDay;
            if (dueField) dueField.value = card.dueDay;
            if (limitField) limitField.value = card.limit;
            if (modalTitle) modalTitle.innerText = 'Editar Cartão de Crédito';
        }
    }
}

function closeCardModal() {
    let modal = document.getElementById('cardModal');
    if (!modal) return;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    
    let form = document.getElementById('cardForm');
    if (form) form.reset();
}

function populateCardDropdowns() {
    let select = document.getElementById('expCard');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cartão...</option>';
    
    if (typeof cards !== 'undefined') {
        cards.forEach(card => {
            let opt = document.createElement('option');
            opt.value = card.name;
            opt.innerText = card.name;
            select.appendChild(opt);
        });
    }
}

function populateCardDropdown() {
    populateCardDropdowns();
}

function toggleCardSelect() {
    let catEl = document.getElementById('expCategory');
    let container = document.getElementById('cardSelectContainer');
    if (!container || !catEl) return;
    if (catEl.value === 'Cartão de Crédito') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function saveCard(e) {
    if (e) e.preventDefault();
    
    let idInput = document.getElementById('cardId');
    let id = idInput ? idInput.value : '';
    let nameInput = document.getElementById('cardName');
    let closingInput = document.getElementById('cardClosingDay');
    let dueInput = document.getElementById('cardDueDate');
    let limitInput = document.getElementById('cardLimit');

    if (!nameInput || !nameInput.value.trim()) {
        if (typeof showToast === 'function') {
            showToast("Por favor, informe o nome do cartão.", "error");
        } else {
            alert("Por favor, informe o nome do cartão.");
        }
        return;
    }

    let name = nameInput.value.trim();
    let closingDay = parseInt(closingInput.value) || 1;
    let dueDay = parseInt(dueInput.value) || 1;
    let limit = parseFloat(limitInput.value) || 0;

    if (typeof cards === 'undefined') window.cards = [];

    if (id !== '') {
        let card = cards.find(c => Number(c.id) === Number(id));
        if (card) {
            card.name = name;
            card.closingDay = closingDay;
            card.dueDay = dueDay;
            card.limit = limit;
        }
        if (typeof showToast === 'function') {
            showToast("Cartão atualizado com sucesso!", "success");
        }
    } else {
        let newId = cards.length > 0 ? Math.max(...cards.map(c => Number(c.id) || 0)) + 1 : 1;
        cards.push({ id: newId, name, closingDay, dueDay, limit });
        if (typeof showToast === 'function') {
            showToast("Cartão cadastrado com sucesso!", "success");
        }
    }

    if (typeof saveData === 'function') saveData();
    closeCardModal();
    if (typeof renderApp === 'function') renderApp();
}

function deleteCard(id) {
    let doDelete = () => {
        if (typeof cards !== 'undefined') {
            window.cards = cards.filter(c => Number(c.id) !== Number(id));
        }
        if (typeof saveData === 'function') saveData();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') {
            showToast("Cartão excluído com sucesso!", "success");
        }
    };

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Deseja realmente excluir este cartão de crédito?', doDelete);
    } else {
        if (confirm('Deseja realmente excluir este cartão de crédito?')) {
            doDelete();
        }
    }
}

function getCardLimitStatus(cardName, currentMonth, cardLimit) {
    let totalCommitted = 0;

    if (typeof expenses !== 'undefined' && typeof getProjectedItems === 'function') {
        let projected = getProjectedItems();
        
        projected.forEach(item => {
            if (item.card === cardName && !item.paid) {
                totalCommitted += Number(item.amount || 0);
            }
        });
    }

    let limit = Number(cardLimit || 0);
    let available = limit - totalCommitted;
    if (available < 0) available = 0;

    return {
        committed: totalCommitted,
        available: available
    };
}

/**
 * Renderiza os cards de crédito na aba "Cartões & Faturas" com suporte a ciclos 
 * que fecham no fim do mês e vencem no início do mês seguinte.
 */
function renderCards() {
    let grid = document.getElementById('cardsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (typeof cards === 'undefined' || cards.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-500 italic bg-slate-900 border border-slate-800 rounded-xl">
                Nenhum cartão de crédito cadastrado. Clique em "Cadastrar Cartão" para começar.
            </div>
        `;
        return;
    }

    let selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
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
    let isCurrentMonth = selDateObj.getTime() === realDateObj.getTime();

    cards.forEach(card => {
        let monthlyCardItems = projectedItems.filter(i => i.card === card.name && i.month === selectedMonth);
        
        let closingDay = Number(card.closingDay) || 1;
        let dueDay = Number(card.dueDay) || 1;

        if (!cardPaidMonths[card.name]) cardPaidMonths[card.name] = {};
        let isCardQuitado = !!cardPaidMonths[card.name][selectedMonth];

        let cardClasses = "bg-slate-900 border rounded-xl p-5 flex flex-col justify-between shadow-sm transition relative overflow-hidden";
        let badgeHtml = '';

        // Validação estrita por mês considerando fechamento no fim e vencimento no início
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
            // Mês atual real: avalia se está no período de fechamento até o vencimento (mesmo virando o mês)
            let isVencidoOuHoje = (diaAtualReal >= dueDay);
            
            // Se o fechamento é no fim do mês (ex: 30) e vencimento no início (ex: 5)
            let isFechado = false;
            if (closingDay > dueDay) {
                // Ex: fecha dia 30 e vence dia 5 do mês seguinte.
                // Está fechado a partir do dia do fechamento até o final do mês, OU do dia 1 até o vencimento.
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
                itemsHtml += `
                    <div class="flex justify-between items-center bg-slate-800/40 p-2.5 rounded-lg text-xs border border-slate-800">
                        <div>
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
        let limitStatus = getCardLimitStatus(card.name, selectedMonth, card.limit);

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

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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

// ================= EXPOSIÇÃO GLOBAL =================
window.openCardModal = openCardModal;
window.closeCardModal = closeCardModal;
window.populateCardDropdowns = populateCardDropdowns;
window.populateCardDropdown = populateCardDropdown;
window.toggleCardSelect = toggleCardSelect;
window.saveCard = saveCard;
window.deleteCard = deleteCard;
window.getCardLimitStatus = getCardLimitStatus;
window.renderCards = renderCards;
window.toggleCardMonthPaid = toggleCardMonthPaid;
