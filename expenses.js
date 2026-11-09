// ============================================================================
// MÓDULO DE DESPESAS E LANÇAMENTOS - expenses.js (Versão Original Integrada)
// ============================================================================

/**
 * Abre a modal de criação/edição de despesas.
 */
function openExpenseModal(expenseId = null) {
    const modal = document.getElementById('expenseModal');
    if (!modal) return;

    // Reseta o formulário
    const form = document.getElementById('expenseForm');
    if (form) form.reset();

    const titleEl = document.getElementById('expenseModalTitle');
    const idField = document.getElementById('expenseId');
    
    if (expenseId) {
        if (titleEl) titleEl.innerText = "Editar Lançamento";
        if (idField) idField.value = expenseId;

        // Procura a despesa nos dados cadastrados
        let exp = (typeof expenses !== 'undefined') ? expenses.find(e => Number(e.id) === Number(expenseId)) : null;
        if (exp) {
            document.getElementById('expenseDesc').value = exp.desc || '';
            document.getElementById('expenseAmount').value = exp.amount || '';
            document.getElementById('expenseCategory').value = exp.category || 'Outros';
            document.getElementById('expenseCard').value = exp.card || 'Nenhum';
            document.getElementById('expenseInstallments').value = exp.installments || 1;
            document.getElementById('expenseMonth').value = exp.month || document.getElementById('globalMonth')?.value || 'Novembro/2026';
            if (document.getElementById('expenseDate')) {
                document.getElementById('expenseDate').value = exp.date || '';
            }
        }
    } else {
        if (titleEl) titleEl.innerText = "Novo Lançamento";
        if (idField) idField.value = '';
        if (document.getElementById('expenseMonth')) {
            document.getElementById('expenseMonth').value = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : 'Novembro/2026';
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Fecha a modal de despesas.
 */
function closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

/**
 * Salva uma despesa (nova ou editada) a partir do formulário da modal.
 */
function saveExpense(event) {
    if (event) event.preventDefault();

    let id = document.getElementById('expenseId')?.value;
    let desc = document.getElementById('expenseDesc')?.value.trim();
    let amount = parseFloat(document.getElementById('expenseAmount')?.value) || 0;
    let category = document.getElementById('expenseCategory')?.value || 'Outros';
    let card = document.getElementById('expenseCard')?.value || 'Nenhum';
    let installments = parseInt(document.getElementById('expenseInstallments')?.value) || 1;
    let month = document.getElementById('expenseMonth')?.value || 'Novembro/2026';
    let date = document.getElementById('expenseDate')?.value || '';

    if (!desc || amount <= 0) {
        if (typeof showToast === 'function') showToast("Preencha a descrição e um valor válido.", "error");
        else alert("Preencha a descrição e um valor válido.");
        return;
    }

    if (typeof expenses === 'undefined') window.expenses = [];

    if (id) {
        // Edição de despesa existente
        let index = expenses.findIndex(e => Number(e.id) === Number(id));
        if (index !== -1) {
            expenses[index] = {
                ...expenses[index],
                desc,
                amount,
                category,
                card,
                installments,
                month,
                date
            };
        }
    } else {
        // Criação de nova despesa
        let newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id || 0)) + 1 : 1;
        expenses.push({
            id: newId,
            parentId: newId,
            desc,
            amount,
            category,
            card,
            installments,
            month,
            date,
            paid: false,
            paidMonths: {}
        });
    }

    if (typeof saveData === 'function') saveData();
    closeExpenseModal();
    if (typeof renderApp === 'function') renderApp();
    if (typeof showToast === 'function') showToast("Lançamento salvo com sucesso!", "success");
}

/**
 * Edita uma despesa chamando a modal com o ID.
 */
function editExpense(id) {
    openExpenseModal(id);
}

/**
 * Exclui uma despesa pelo ID.
 */
function deleteExpense(id) {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;

    if (typeof expenses !== 'undefined') {
        window.expenses = expenses.filter(e => Number(e.id) !== Number(id) && Number(e.parentId) !== Number(id));
    }

    if (typeof saveData === 'function') saveData();
    if (typeof renderApp === 'function') renderApp();
    if (typeof showToast === 'function') showToast("Lançamento excluído com sucesso.", "success");
}

/**
 * Abre a modal de despesas pré-selecionando um cartão específico.
 */
function openExpenseModalForCard(cardName) {
    openExpenseModal();
    let cardSelect = document.getElementById('expenseCard');
    if (cardSelect) {
        cardSelect.value = cardName;
    }
    let catSelect = document.getElementById('expenseCategory');
    if (catSelect) {
        catSelect.value = 'Cartão de Crédito';
    }
}

/**
 * Alterna o status de pagamento (pago/pendente) de uma despesa ou parcela projetada.
 */
function togglePaidStatus(parentId, month) {
    if (typeof expenses === 'undefined') return;

    let exp = expenses.find(e => Number(e.id) === Number(parentId) || Number(e.parentId) === Number(parentId));
    if (exp) {
        if (!exp.paidMonths) exp.paidMonths = {};
        let current = !!exp.paidMonths[month];
        exp.paidMonths[month] = !current;

        // Se for parcela única ou correspondente principal
        if (exp.month === month) {
            exp.paid = !exp.paid;
        }

        if (typeof saveData === 'function') saveData();
        if (typeof renderApp === 'function') renderApp();
    }
}

// ================= EXPOSIÇÃO GLOBAL =================
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.saveExpense = saveExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.openExpenseModalForCard = openExpenseModalForCard;
window.togglePaidStatus = togglePaidStatus;
