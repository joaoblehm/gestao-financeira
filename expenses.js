// ============================================================================
// MÓDULO DE GERENCIAMENTO DE DESPESAS E LANÇAMENTOS - expenses.js
// ============================================================================

/**
 * Adiciona uma quantidade específica de meses a uma string de mês/ano (Ex: 'Novembro/2026' + 1 = 'Dezembro/2026').
 * Útil para calcular o avanço das parcelas ao longo do tempo.
 */
function addMonthsToMonthName(monthStr, addCount) {
    const mapNamesBack = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    };
    const mapMonthsInv = {
        1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
        5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
        9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    if (!monthStr || !monthStr.includes('/')) return monthStr;
    let [mName, yearStr] = monthStr.split('/');
    let monthNum = mapNamesBack[mName] || 11;
    let year = parseInt(yearStr, 10) || 2026;

    let totalMonths = (year * 12) + (monthNum - 1) + addCount;
    let newYear = Math.floor(totalMonths / 12);
    let newMonthNum = (totalMonths % 12) + 1;

    return `${mapMonthsInv[newMonthNum]}/${newYear}`;
}

/**
 * Converte uma data no formato americano (YYYY-MM-DD) para o formato de nome do mês (Ex: '2026-11-09' vira 'Novembro/2026').
 */
function dateToMonthName(dateStr) {
    if (!dateStr) return 'Novembro/2026';
    let parts = dateStr.split('-');
    if (parts.length < 2) return 'Novembro/2026';
    
    let year = parts[0];
    let monthNum = parseInt(parts[1], 10);
    
    const mapMonths = {
        1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
        5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
        9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    let monthName = mapMonths[monthNum] || 'Novembro';
    return `${monthName}/${year}`;
}

/**
 * PROJEÇÃO DE ITENS: Pega todas as despesas cadastradas e gera as parcelas mês a mês,
 * aplicando regras de fechamento de cartão de crédito e controle de status pago/pendente.
 */
function getProjectedItems() {
    let projectedItems = [];
    if (typeof expenses === 'undefined') return projectedItems;
    
    expenses.forEach(exp => {
        let instCount = exp.totalInst || 1;
        if (!exp.paidMonths) exp.paidMonths = {};

        let baseMonth = exp.date ? dateToMonthName(exp.date) : (exp.startMonth || "Novembro/2026");

        let effectiveStartMonth = baseMonth;
        // Regra de Fechamento de Cartão: Se a compra foi após o dia de fechamento, a 1ª parcela vai para o mês seguinte.
        if (exp.category === 'Cartão de Crédito' && exp.card && exp.date && typeof cards !== 'undefined') {
            let targetCard = cards.find(c => c.name === exp.card);
            if (targetCard && targetCard.closingDay) {
                let dateParts = exp.date.split('-');
                if (dateParts.length === 3) {
                    let buyDay = parseInt(dateParts[2], 10);
                    let closingDay = parseInt(targetCard.closingDay, 10);

                    if (buyDay > closingDay) {
                        effectiveStartMonth = addMonthsToMonthName(baseMonth, 1);
                    }
                }
            }
        }

        // Formata a data real da compra (YYYY-MM-DD) para exibição visual (DD/MM/AAAA)
        let formattedDisplayDate = '-';
        if (exp.date && exp.date.includes('-')) {
            let p = exp.date.split('-');
            if (p.length === 3) {
                formattedDisplayDate = `${p[2]}/${p[1]}/${p[0]}`;
            }
        }

        for (let i = 0; i < instCount; i++) {
            let targetMonth = effectiveStartMonth;
            if (i > 0) {
                targetMonth = addMonthsToMonthName(effectiveStartMonth, i);
            }
            
            let isPaid = !!exp.paidMonths[targetMonth];
            projectedItems.push({
                id: exp.id,
                parentId: exp.parentId || exp.id,
                month: targetMonth,                       // Mês de referência para o filtro do Dashboard
                date: formattedDisplayDate,               // <--- ALTERADO AQUI: Exibe diretamente a data formatada (DD/MM/AAAA) na tabela
                rawDate: exp.date,
                desc: exp.desc,
                category: exp.category,
                card: exp.card || '-',
                instStr: `${i + 1} de ${instCount}`,
                amount: exp.amount,
                total: exp.total,
                paid: isPaid
            });
        }
    });
    return projectedItems;
}

/**
 * Abre a janela modal para criar um novo lançamento financeiro ou resetar os campos.
 */
function openExpenseModal() {
    let modal = document.getElementById('expenseModal');
    if (!modal) {
        createExpenseModalElement();
        modal = document.getElementById('expenseModal');
    }
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    let form = document.getElementById('expenseForm');
    if (form) form.reset();

    let expIdEl = document.getElementById('expId');
    if (expIdEl) expIdEl.value = '';

    let titleEl = document.getElementById('expenseModalTitle');
    if (titleEl) titleEl.innerText = 'Novo Lançamento';

    let expDate = document.getElementById('expDate');
    if (expDate) expDate.value = new Date().toISOString().split('T')[0];

    if (typeof populateCardDropdown === 'function') populateCardDropdown();
    if (typeof toggleCardSelect === 'function') toggleCardSelect();
    if (typeof updateCardClosingInfo === 'function') updateCardClosingInfo();
}

/**
 * Cria dinamicamente o elemento HTML da modal de despesas injetando-o no DOM.
 */
function createExpenseModalElement() {
    let existing = document.getElementById('expenseModal');
    if (existing) existing.remove();

    let div = document.createElement('div');
    div.id = 'expenseModal';
    div.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden items-center justify-center p-4";
    div.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                <h3 id="expenseModalTitle" class="text-lg font-bold text-white">Novo Lançamento</h3>
                <button onclick="closeExpenseModal()" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <form id="expenseForm" onsubmit="event.preventDefault(); saveExpenseManually();" class="space-y-4">
                <input type="hidden" id="expId">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Data da Compra *</label>
                        <input type="date" id="expDate" required onchange="updateCardClosingInfo()" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Categoria *</label>
                        <select id="expCategory" onchange="toggleCardSelect(); updateCardClosingInfo();" required class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                            <option value="">Selecione...</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Mercado">Mercado</option>
                            <option value="Contas de Casa">Contas de Casa</option>
                            <option value="Assinaturas">Assinaturas</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Descrição *</label>
                    <input type="text" id="expDesc" required placeholder="Ex: Supermercado, Aluguel, Conta de Luz..." class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                </div>
                <div id="cardSelectContainer" class="hidden">
                    <label class="block text-xs font-medium text-slate-400 mb-1">Cartão *</label>
                    <select id="expCard" onchange="updateCardClosingInfo()" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </select>
                </div>
                <div id="cardClosingInfoBox" class="hidden bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-indigo-400 shrink-0"></i>
                    <span id="cardClosingInfoText">Selecione o cartão e a data para ver o status da fatura.</span>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Parcelas</label>
                        <input type="number" min="1" id="expInstallmentsCount" value="1" oninput="calculateTotal()" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Valor Parcela (R$)</label>
                        <input type="number" step="0.01" min="0.01" id="expInstallmentAmount" required oninput="calculateTotal()" placeholder="0.00" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Valor Total (R$)</label>
                        <input type="text" id="expTotalAmount" readonly class="w-full bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm rounded-lg px-3 py-2.5 outline-none cursor-not-allowed">
                    </div>
                </div>
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button type="button" onclick="closeExpenseModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition">Cancelar</button>
                    <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-600/20">Salvar Lançamento</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Atualiza dinamicamente as informações de fechamento do cartão de crédito selecionado na modal.
 */
function updateCardClosingInfo() {
    let catSelect = document.getElementById('expCategory');
    let cardSelect = document.getElementById('expCard');
    let dateInput = document.getElementById('expDate');
    let infoBox = document.getElementById('cardClosingInfoBox');
    let infoText = document.getElementById('cardClosingInfoText');

    if (!catSelect || !infoBox || !infoText) return;

    if (catSelect.value !== 'Cartão de Crédito') {
        infoBox.classList.add('hidden');
        return;
    }

    infoBox.classList.remove('hidden');

    let cardName = cardSelect ? cardSelect.value : '';
    let dateVal = dateInput ? dateInput.value : '';

    if (!cardName || typeof cards === 'undefined') {
        infoText.innerText = "Selecione um cartão para verificar o fechamento.";
        return;
    }

    let targetCard = cards.find(c => c.name === cardName);
    if (!targetCard || !targetCard.closingDay) {
        infoText.innerText = "Este cartão não possui dia de fechamento configurado.";
        return;
    }

    let closingDay = parseInt(targetCard.closingDay, 10);

    if (!dateVal) {
        infoText.innerText = `Este cartão fecha dia ${closingDay}. Informe a data da compra.`;
        return;
    }

    let dateParts = dateVal.split('-');
    if (dateParts.length !== 3) {
        infoText.innerText = `Este cartão fecha dia ${closingDay}.`;
        return;
    }

    let buyDay = parseInt(dateParts[2], 10);

    if (buyDay > closingDay) {
        infoText.innerHTML = `💳 Fechamento dia <strong>${closingDay}</strong>: Como a compra é dia <strong>${buyDay}</strong> (após o fechamento), a 1ª parcela vai para o <strong>mês seguinte</strong>.`;
        infoBox.className = "bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2";
    } else {
        infoText.innerHTML = `💳 Fechamento dia <strong>${closingDay}</strong>: Como a compra é dia <strong>${buyDay}</strong> (antes ou no fechamento), a 1ª parcela entra no <strong>mês atual</strong>.`;
        infoBox.className = "bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 flex items-center gap-2";
    }
}

/**
 * Exibe ou oculta o seletor de cartões dependendo se a categoria escolhida é Cartão de Crédito.
 */
function toggleCardSelect() {
    let catSelect = document.getElementById('expCategory');
    let container = document.getElementById('cardSelectContainer');
    if (!catSelect || !container) return;

    if (catSelect.value === 'Cartão de Crédito') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

/**
 * Popula a lista suspensa (dropdown) de cartões disponíveis na modal de cadastro.
 */
function populateCardDropdown() {
    let cardSelect = document.getElementById('expCard');
    if (!cardSelect) return;
    cardSelect.innerHTML = '';

    let userCards = typeof cards !== 'undefined' ? cards : [];
    if (userCards.length === 0) {
        cardSelect.innerHTML = `<option value="Geral">Cartão Geral</option>`;
        return;
    }

    userCards.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.name;
        opt.innerText = c.name;
        cardSelect.appendChild(opt);
    });
}

/**
 * Abre a modal de despesas já com uma categoria específica pré-selecionada.
 */
function openExpenseModalWithCategory(cat) {
    openExpenseModal();
    let catEl = document.getElementById('expCategory');
    if (catEl) {
        catEl.value = cat;
        toggleCardSelect();
        updateCardClosingInfo();
    }
}

/**
 * Abre a modal de despesas direcionada a um cartão específico.
 */
function openExpenseModalForCard(cardName) {
    openExpenseModal();
    let catEl = document.getElementById('expCategory');
    if (catEl) {
        catEl.value = 'Cartão de Crédito';
        toggleCardSelect();
    }
    let cardSelect = document.getElementById('expCard');
    if (cardSelect) {
        cardSelect.value = cardName;
    }
    updateCardClosingInfo();
}

/**
 * Fecha a modal de lançamentos e limpa o formulário.
 */
function closeExpenseModal() {
    let modal = document.getElementById('expenseModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
    let form = document.getElementById('expenseForm');
    if (form) form.reset();
}

/**
 * Calcula automaticamente o valor total da compra multiplicando as parcelas pelo valor unitário.
 */
function calculateTotal() {
    let count = parseInt(document.getElementById('expInstallmentsCount').value) || 1;
    let amt = parseFloat(document.getElementById('expInstallmentAmount').value) || 0;
    let totalEl = document.getElementById('expTotalAmount');
    if (totalEl) totalEl.value = (count * amt).toFixed(2);
}

/**
 * Carrega os dados de um lançamento existente na modal para edição.
 */
function editExpense(parentId) {
    if (typeof expenses === 'undefined') return;
    let exp = expenses.find(i => Number(i.parentId || i.id) === Number(parentId));
    if (!exp) return;
    
    openExpenseModal();

    let expId = document.getElementById('expId');
    if (expId) expId.value = String(exp.parentId || exp.id);

    let titleEl = document.getElementById('expenseModalTitle');
    if (titleEl) titleEl.innerText = 'Editar Lançamento';

    let expDate = document.getElementById('expDate');
    if (expDate && exp.date) {
        expDate.value = exp.date;
    }

    let expDesc = document.getElementById('expDesc');
    if (expDesc) expDesc.value = exp.desc || '';

    let expCat = document.getElementById('expCategory');
    if (expCat) expCat.value = exp.category || '';
    
    toggleCardSelect();
    
    let expCard = document.getElementById('expCard');
    if (expCard && exp.card) expCard.value = exp.card;
    
    let expInstCount = document.getElementById('expInstallmentsCount');
    if (expInstCount) expInstCount.value = exp.totalInst || 1;

    let expInstAmt = document.getElementById('expInstallmentAmount');
    if (expInstAmt) expInstAmt.value = exp.amount || 0;
    
    calculateTotal();
    updateCardClosingInfo();
}

/**
 * Salva ou atualiza um lançamento preenchido manualmente na modal, gravando no array global e salvando no armazenamento local.
 */
function saveExpenseManually() {
    let editIdInput = document.getElementById('expId');
    let editId = editIdInput ? editIdInput.value.trim() : '';
    
    let dateValue = document.getElementById('expDate').value;
    let startMonth = dateToMonthName(dateValue);
    let desc = document.getElementById('expDesc').value.trim();
    let category = document.getElementById('expCategory').value.trim();
    let card = category === 'Cartão de Crédito' ? document.getElementById('expCard').value : category;
    let totalInst = parseInt(document.getElementById('expInstallmentsCount').value) || 1;
    let amount = parseFloat(document.getElementById('expInstallmentAmount').value) || 0;
    let total = totalInst * amount;

    if (!desc || !amount || !category || !dateValue) {
        if (typeof showToast === 'function') showToast("Preencha a data, categoria, descrição e valor.", "error");
        else alert("Preencha a data, categoria, descrição e valor.");
        return;
    }

    if (typeof expenses === 'undefined') window.expenses = [];

    let isEditing = editId !== '' && editId !== 'null' && editId !== 'undefined';

    if (isEditing) {
        let expIndex = expenses.findIndex(i => Number(i.parentId || i.id) === Number(editId));
        if (expIndex !== -1) {
            expenses[expIndex].startMonth = startMonth;
            expenses[expIndex].date = dateValue;
            expenses[expIndex].desc = desc;
            expenses[expIndex].category = category;
            expenses[expIndex].card = card;
            expenses[expIndex].totalInst = totalInst;
            expenses[expIndex].amount = amount;
            expenses[expIndex].total = total;
            if (typeof showToast === 'function') showToast("Lançamento atualizado com sucesso!", "success");
        }
    } else {
        let newId = expenses.length > 0 ? Math.max(...expenses.map(i => Number(i.id || i.parentId || 0))) + 1 : 1;
        expenses.push({
            id: newId,
            parentId: newId,
            startMonth,
            date: dateValue,
            desc,
            category,
            card,
            amount,
            totalInst,
            total,
            paidMonths: {}
        });
        if (typeof showToast === 'function') showToast("Novo lançamento adicionado com sucesso!", "success");
    }

    if (typeof saveData === 'function') saveData();
    closeExpenseModal();
    if (typeof renderApp === 'function') renderApp();
}

/**
 * Exclui um lançamento financeiro (e suas respectivas parcelas) do sistema.
 */
function deleteExpense(parentId) {
    let doDelete = () => {
        window.expenses = expenses.filter(i => Number(i.parentId || i.id) !== Number(parentId));
        if (typeof saveData === 'function') saveData();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') showToast("Lançamento excluído com sucesso!", "success");
    };

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Deseja excluir este lançamento e suas parcelas?', doDelete);
    } else {
        if (confirm('Deseja excluir este lançamento e suas parcelas?')) doDelete();
    }
}

/**
 * Alterna o status de pagamento (Pago / Pendente) de uma parcela específica em um determinado mês.
 */
function togglePaidStatus(parentId, month) {
    let exp = expenses.find(i => Number(i.parentId || i.id) === Number(parentId));
    if (exp) {
        if (!exp.paidMonths) exp.paidMonths = {};
        exp.paidMonths[month] = !exp.paidMonths[month];
        if (typeof saveData === 'function') saveData();
        if (typeof renderApp === 'function') renderApp();
    }
}

/**
 * Confirma a exclusão de todos os lançamentos cadastrados.
 */
function confirmClearAllData() {
    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Tem certeza absoluta que deseja apagar TODOS os lançamentos?', () => clearAllData());
    } else {
        if (confirm('Tem certeza absoluta que deseja apagar TODOS os lançamentos?')) clearAllData();
    }
}

/**
 * Limpa todos os dados de lançamentos do sistema.
 */
function clearAllData() {
    window.expenses = [];
    if (typeof saveData === 'function') saveData();
    if (typeof renderApp === 'function') renderApp();
}

// ================= EXPOSIÇÃO GLOBAL =================
window.getProjectedItems = getProjectedItems;
window.openExpenseModal = openExpenseModal;
window.openExpenseModalWithCategory = openExpenseModalWithCategory;
window.openExpenseModalForCard = openExpenseModalForCard;
window.closeExpenseModal = closeExpenseModal;
window.calculateTotal = calculateTotal;
window.editExpense = editExpense;
window.saveExpenseManually = saveExpenseManually;
window.deleteExpense = deleteExpense;
window.togglePaidStatus = togglePaidStatus;
window.confirmClearAllData = confirmClearAllData;
window.clearAllData = clearAllData;
window.toggleCardSelect = toggleCardSelect;
window.populateCardDropdown = populateCardDropdown;
window.addMonthsToMonthName = addMonthsToMonthName;
window.dateToMonthName = dateToMonthName;
window.updateCardClosingInfo = updateCardClosingInfo;
