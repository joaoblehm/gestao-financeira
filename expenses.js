// ============================================================================
// MÓDULO DE GERENCIAMENTO DE DESPESAS E LANÇAMENTOS - expenses.js
// ============================================================================

/**
 * Gera a lista de itens projetados (parcelas expandidas) com base nos lançamentos cadastrados.
 * @returns {Array} Lista de itens de despesas expandidos por mês.
 */
function getProjectedItems() {
    let projectedItems = [];
    if (typeof expenses === 'undefined') return projectedItems;
    
    expenses.forEach(exp => {
        let startIndex = typeof monthsList !== 'undefined' ? monthsList.indexOf(exp.startMonth) : 0;
        let instCount = exp.totalInst || 1;
        
        // Se o mês inicial não estiver na monthsList estática mas for válido, podemos gerar dinamicamente ou calcular via índice de meses
        if (startIndex === -1 && exp.startMonth) {
            // Se houver suporte a cálculo livre de meses por nome, geramos a partir de Janeiro de 2026 por exemplo,
            // ou mapeamos com base numa função de offset de meses se necessário.
            startIndex = 0; 
        }
        
        if (!exp.paidMonths) exp.paidMonths = {};

        // Como agora temos navegação livre por qualquer mês/ano no calendário estilo Windows,
        // vamos calcular o mês de cada parcela iterando os meses sequencialmente a partir do startMonth.
        let currentMonthName = exp.startMonth || "Novembro/2026";
        
        for (let i = 0; i < instCount; i++) {
            let targetMonth = currentMonthName;
            if (i > 0) {
                targetMonth = addMonthsToMonthName(exp.startMonth || "Novembro/2026", i);
            }
            
            let isPaid = !!exp.paidMonths[targetMonth];
            projectedItems.push({
                id: exp.id,
                parentId: exp.parentId || exp.id,
                month: targetMonth,
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
 * Função auxiliar para somar meses a uma string de competência (ex: "Novembro/2026" + 1 = "Dezembro/2026").
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
 * Abre o modal de cadastro/edição de lançamentos e prepara os campos do formulário.
 * Cria o elemento HTML dinamicamente caso ele não exista na página.
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

    // Lê o mês ativo através da função global do calendário estilo Windows
    let currentMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let expMonth = document.getElementById('expMonth');
    if (expMonth) {
        // Garante que a opção existe no select ou adiciona-a dinamicamente
        let exists = Array.from(expMonth.options).some(opt => opt.value === currentMonth);
        if (!exists) {
            let opt = document.createElement('option');
            opt.value = currentMonth;
            opt.innerText = currentMonth;
            expMonth.appendChild(opt);
        }
        expMonth.value = currentMonth;
    }

    if (typeof populateCardDropdown === 'function') populateCardDropdown();
    if (typeof toggleCardSelect === 'function') toggleCardSelect();
}

/**
 * Cria dinamicamente o HTML do modal de despesas no DOM se ele estiver em falta.
 */
function createExpenseModalElement() {
    if (document.getElementById('expenseModal')) return;

    let currentMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';
    let monthsOptionsHtml = `<option value="${currentMonth}">${currentMonth}</option>`;
    
    // Adiciona alguns meses futuros por conveniência
    let parts = currentMonth.split('/');
    if (parts.length === 2) {
        for (let i = 1; i <= 12; i++) {
            let mStr = addMonthsToMonthName(currentMonth, i);
            monthsOptionsHtml += `<option value="${mStr}">${mStr}</option>`;
        }
    }

    let div = document.createElement('div');
    div.id = 'expenseModal';
    div.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden items-center justify-center p-4";
    div.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div class="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 id="expenseModalTitle" class="text-lg font-bold text-white">Novo Lançamento</h3>
                <button onclick="closeExpenseModal()" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <form id="expenseForm" onsubmit="event.preventDefault(); saveExpenseManually();" class="space-y-4">
                <input type="hidden" id="expId">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Mês Inicial *</label>
                        <select id="expMonth" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                            ${monthsOptionsHtml}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Data *</label>
                        <input type="date" id="expDate" required class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Descrição *</label>
                    <input type="text" id="expDesc" required placeholder="Ex: Supermercado, Aluguel, Conta de Luz..." class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Categoria *</label>
                        <select id="expCategory" onchange="toggleCardSelect()" required class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                            <option value="">Selecione...</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Mercado">Mercado</option>
                            <option value="Contas de Casa">Contas de Casa</option>
                            <option value="Assinaturas">Assinaturas</option>
                        </select>
                    </div>
                    <div id="cardSelectContainer" class="hidden">
                        <label class="block text-xs font-medium text-slate-400 mb-1">Cartão *</label>
                        <select id="expCard" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                        </select>
                    </div>
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
 * Alterna a visibilidade do seletor de cartões caso a categoria escolhida seja "Cartão de Crédito".
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
 * Preenche o select de cartões com os cartões registados no sistema.
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
 * Abre o modal pré-selecionando uma categoria.
 */
function openExpenseModalWithCategory(cat) {
    openExpenseModal();
    let catEl = document.getElementById('expCategory');
    if (catEl) {
        catEl.value = cat;
        toggleCardSelect();
    }
}

/**
 * Abre o modal pré-selecionando um cartão.
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
}

/**
 * Fecha o modal de despesas.
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
 * Calcula o valor total da parcela.
 */
function calculateTotal() {
    let count = parseInt(document.getElementById('expInstallmentsCount').value) || 1;
    let amt = parseFloat(document.getElementById('expInstallmentAmount').value) || 0;
    let totalEl = document.getElementById('expTotalAmount');
    if (totalEl) totalEl.value = (count * amt).toFixed(2);
}

/**
 * Carrega um lançamento para edição.
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

    let monthSelect = document.getElementById('expMonth');
    if (monthSelect && exp.startMonth) {
        let exists = Array.from(monthSelect.options).some(opt => opt.value === exp.startMonth);
        if (!exists) {
            let opt = document.createElement('option');
            opt.value = exp.startMonth;
            opt.innerText = exp.startMonth;
            monthSelect.appendChild(opt);
        }
        monthSelect.value = exp.startMonth;
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
}

/**
 * Salva o lançamento manual no array global.
 */
function saveExpenseManually() {
    let editIdInput = document.getElementById('expId');
    let editId = editIdInput ? editIdInput.value.trim() : '';
    
    let startMonth = document.getElementById('expMonth').value;
    let desc = document.getElementById('expDesc').value.trim();
    let category = document.getElementById('expCategory').value.trim();
    let card = category === 'Cartão de Crédito' ? document.getElementById('expCard').value : category;
    let totalInst = parseInt(document.getElementById('expInstallmentsCount').value) || 1;
    let amount = parseFloat(document.getElementById('expInstallmentAmount').value) || 0;
    let total = totalInst * amount;

    if (!desc || !amount || !category) {
        if (typeof showToast === 'function') showToast("Preencha a categoria, descrição e valor.", "error");
        else alert("Preencha a categoria, descrição e valor.");
        return;
    }

    if (typeof expenses === 'undefined') window.expenses = [];

    let isEditing = editId !== '' && editId !== 'null' && editId !== 'undefined';

    if (isEditing) {
        let expIndex = expenses.findIndex(i => Number(i.parentId || i.id) === Number(editId));
        if (expIndex !== -1) {
            expenses[expIndex].startMonth = startMonth;
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
 * Exclui um lançamento.
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
 * Altera status de pagamento.
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
 * Limpa todos os dados.
 */
function confirmClearAllData() {
    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Tem certeza absoluta que deseja apagar TODOS os lançamentos?', () => clearAllData());
    } else {
        if (confirm('Deseja apagar TODOS os lançamentos?')) clearAllData();
    }
}

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
