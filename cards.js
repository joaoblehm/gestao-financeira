// ============================================================================
// MÓDULO DE GERENCIAMENTO DE CARTÕES DE CRÉDITO - cards.js
// ============================================================================

/**
 * Abre o modal de cadastro ou edição de cartão de crédito.
 * Se um 'id' for passado, o modal entra em modo de EDIÇÃO, preenchendo os campos com os dados do cartão.
 * Se nenhum 'id' for passado, o modal abre limpo para CADASTRO de um novo cartão.
 * @param {number|null} id - ID do cartão para edição ou null para novo registo.
 */
function openCardModal(id = null) {
    let modal = document.getElementById('cardModal');
    if (!modal) return;
    
    // Exibe o modal na tela (troca 'hidden' por 'flex')
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    let form = document.getElementById('cardForm');
    if (form) form.reset();
    
    let idInput = document.getElementById('cardId');
    if (idInput) idInput.value = '';
    
    let modalTitle = modal.querySelector('h3');
    if (modalTitle) modalTitle.innerText = 'Cadastrar Cartão de Crédito';
    
    // Se recebeu um ID, busca o cartão correspondente e popula os campos para edição
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

/**
 * Fecha o modal de cartões e limpa o formulário correspondente.
 */
function closeCardModal() {
    let modal = document.getElementById('cardModal');
    if (!modal) return;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    
    let form = document.getElementById('cardForm');
    if (form) form.reset();
}

/**
 * Popula o elemento <select> de cartões nos formulários de lançamento de despesas.
 */
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

/**
 * Alias de compatibilidade para garantir integridade caso algum outro script chame no singular.
 */
function populateCardDropdown() {
    populateCardDropdowns();
}

/**
 * Controla a exibição condicional do campo de seleção de cartões no modal de lançamentos.
 * Se a categoria escolhida for "Cartão de Crédito", o select de cartões aparece. Caso contrário, oculta.
 */
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

/**
 * Salva os dados do cartão de crédito (funciona tanto para CRIAR um novo quanto para EDITAR um existente).
 * @param {Event} e - Evento de submissão do formulário.
 */
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
        // MODO EDIÇÃO: Atualiza os dados do cartão correspondente
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
        // MODO CRIAÇÃO: Gera um novo ID e adiciona à lista de cartões
        let newId = cards.length > 0 ? Math.max(...cards.map(c => Number(c.id) || 0)) + 1 : 1;
        cards.push({ id: newId, name, closingDay, dueDay, limit });
        if (typeof showToast === 'function') {
            showToast("Cartão cadastrado com sucesso!", "success");
        } else {
            alert('Cartão cadastrado com sucesso!');
        }
    }

    if (typeof saveData === 'function') saveData();      // Salva alterações no Supabase/localStorage
    closeCardModal(); // Fecha o modal
    if (typeof renderApp === 'function') renderApp();      // Atualiza a interface
}

/**
 * Exclui um cartão de crédito após confirmação utilizando o modal personalizado do tema escuro.
 * @param {number} id - ID do cartão a ser excluído.
 */
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

    // Utiliza o modal de confirmação personalizado do tema
    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Deseja realmente excluir este cartão de crédito?', doDelete);
    } else {
        if (confirm('Deseja realmente excluir este cartão de crédito?')) {
            doDelete();
        }
    }
}

/**
 * Calcula o limite disponível de um cartão subtraindo o saldo devedor total 
 * (somatório de todas as parcelas pendentes/futuras das compras ativas) do limite total.
 * @param {string} cardName - Nome do cartão.
 * @param {string} currentMonth - Mês de referência ativo.
 * @param {number} cardLimit - Limite total cadastrado no cartão.
 * @returns {Object} Contém o total comprometido e o limite disponível calculado.
 */
function getCardLimitStatus(cardName, currentMonth, cardLimit) {
    let totalCommitted = 0;

    // Soma o saldo devedor de todas as parcelas pendentes vinculadas a este cartão no sistema
    if (typeof expenses !== 'undefined') {
        expenses.forEach(exp => {
            if (exp.card === cardName) {
                let projected = getProjectedItems();
                // Filtra as parcelas desta compra específica que ainda estão pendentes
                let parcelasPendentesDestaCompra = projected.filter(item => 
                    item.parentId === (exp.parentId || exp.id) && !item.paid
                );

                parcelasPendentesDestaCompra.forEach(p => {
                    totalCommitted += Number(p.amount || 0);
                });
            }
        });
    }

    let limit = Number(cardLimit || 0);
    let available = Math.max(0, limit - totalCommitted);

    return {
        committed: totalCommitted,
        available: available
    };
}

/**
 * Renderiza os cards de crédito na aba "Cartões & Faturas", exibindo os dados,
 * faturas do mês, total comprometido e o Limite Disponível calculado em tempo real.
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

    // Lê o mês ativo através da nova função global do calendário estilo Windows
    let currentMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');

    cards.forEach(card => {
        // Calcula o limite disponível com base nas parcelas pendentes totais
        let limitStatus = getCardLimitStatus(card.name, currentMonth, card.limit);

        // Calcula o valor da fatura do mês específico para este cartão
        let cardInvoiceTotal = 0;
        if (typeof getProjectedItems === 'function') {
            let projected = getProjectedItems();
            projected.forEach(item => {
                if (item.card === card.name && item.month === currentMonth) {
                    cardInvoiceTotal += Number(item.amount || 0);
                }
            });
        }

        let div = document.createElement('div');
        div.className = "bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden";
        div.innerHTML = `
            <div class="flex justify-between items-center pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                    <div class="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                        <i data-lucide="credit-card" class="w-5 h-5"></i>
                    </div>
                    <h3 class="font-bold text-white text-base">${card.name}</h3>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="openCardModal(${card.id})" class="p-1.5 hover:text-indigo-400 text-slate-400 transition rounded-lg hover:bg-slate-800" title="Editar Cartão"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="deleteCard(${card.id})" class="p-1.5 hover:text-rose-400 text-slate-400 transition rounded-lg hover:bg-slate-800" title="Excluir Cartão"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>

            <div class="text-xs text-slate-400 space-y-1.5">
                <div class="flex justify-between">
                    <span>Fechamento: Dia ${card.closingDay}</span>
                    <span>Vencimento: Dia ${card.dueDay}</span>
                </div>
                <div class="flex justify-between font-medium text-slate-300">
                    <span>Limite Total:</span>
                    <span>R$ ${Number(card.limit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between font-bold text-emerald-400 pt-0.5 border-t border-slate-800/60">
                    <span>Limite Disponível:</span>
                    <span>R$ ${limitStatus.available.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div class="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span class="text-slate-400 text-xs">Fatura (${currentMonth}):</span>
                <span class="font-bold text-indigo-400">R$ ${cardInvoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div class="pt-2">
                <button onclick="openExpenseModalForCard('${card.name}')" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition border border-slate-700">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i> Adicionar Gasto neste Cartão
                </button>
            </div>
        `;
        grid.appendChild(div);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
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
