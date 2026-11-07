// ============================================================================
// MÓDULO DE GERENCIAMENTO DE ENTRADAS (SALÁRIO & RENDA EXTRA) - Atualizado
// ============================================================================

/**
 * Event listener executado assim que o documento HTML é totalmente carregado.
 */
document.addEventListener('DOMContentLoaded', () => {
    initSalaryModule();
});

function initSalaryModule() {
    setupSalaryDOMEvents();
    loadSalaryConfig();
}

function initSalaryTab() {
    loadSalaryConfig();
    adjustGlobalCategoryFilterForSalary(true);
}

function setupSalaryDOMEvents() {
    let globalMonthSelect = document.getElementById('globalMonth');
    if (globalMonthSelect) {
        globalMonthSelect.addEventListener('change', () => {
            loadSalaryConfig();
        });
    }

    let searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            let activeTabSalary = document.getElementById('tabSalary');
            if (activeTabSalary && !activeTabSalary.classList.contains('hidden')) {
                renderIncomesList();
            }
        });
    }
}

function adjustGlobalCategoryFilterForSalary(isSalaryActive) {
    let filterCatSelect = document.getElementById('filterCategory');
    if (!filterCatSelect) return;

    if (isSalaryActive) {
        filterCatSelect.innerHTML = `
            <option value="">Todas as Entradas</option>
            <option value="Salário">Salário</option>
            <option value="Renda Extra">Renda Extra</option>
        `;
    }
}

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

function monthNameToDateInput(monthStr) {
    if (!monthStr || !monthStr.includes('/')) {
        let now = new Date();
        return now.toISOString().split('T')[0];
    }
    let [mName, year] = monthStr.split('/');
    const mapNames = {
        'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
        'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
        'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
    };
    let mNum = mapNames[mName] || '11';
    return `${year}-${mNum}-01`;
}

function loadSalaryConfig() {
    renderIncomesList();
}

function openExtraIncomeModal(id = null) {
    let modal = document.getElementById('extraIncomeModal');
    if (!modal) {
        createIncomeModalElement();
        modal = document.getElementById('extraIncomeModal');
    }
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    let form = document.getElementById('extraIncomeForm');
    if (form) form.reset();
    
    let currentGlobalMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let dateField = document.getElementById('extraIncDate');
    if (dateField) {
        dateField.value = monthNameToDateInput(currentGlobalMonth);
    }

    let idInput = document.getElementById('extraIncId');
    if (idInput) idInput.value = '';
    let titleEl = document.getElementById('extraIncomeModalTitle');
    if (titleEl) titleEl.innerText = 'Cadastrar Nova Entrada';
    
    if (id !== null && typeof extraIncomes !== 'undefined') {
        let item = extraIncomes.find(e => Number(e.id) === Number(id));
        if (item) {
            if (idInput) idInput.value = item.id;
            let catField = document.getElementById('extraIncCategory');
            let descField = document.getElementById('extraIncDesc');
            let amountField = document.getElementById('extraIncAmount');
            
            if (catField) catField.value = item.category || 'Salário';
            if (descField) descField.value = item.desc;
            if (amountField) amountField.value = item.amount;
            if (dateField && item.date) {
                dateField.value = item.date;
            } else if (dateField && item.month) {
                dateField.value = monthNameToDateInput(item.month);
            }
            if (titleEl) titleEl.innerText = 'Editar Entrada';
        }
    }
}

function createIncomeModalElement() {
    if (document.getElementById('extraIncomeModal')) return;

    let div = document.createElement('div');
    div.id = 'extraIncomeModal';
    div.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden items-center justify-center p-4";
    div.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                <h3 id="extraIncomeModalTitle" class="text-lg font-bold text-white">Cadastrar Nova Entrada</h3>
                <button onclick="closeExtraIncomeModal()" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <form id="extraIncomeForm" onsubmit="saveExtraIncome(event)" class="space-y-4">
                <input type="hidden" id="extraIncId">
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Data da Entrada *</label>
                    <input type="date" id="extraIncDate" required class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Categoria *</label>
                    <select id="extraIncCategory" required class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                        <option value="Salário">Salário</option>
                        <option value="Renda Extra">Renda Extra</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Descrição *</label>
                    <input type="text" id="extraIncDesc" required placeholder="Ex: Salário Principal, Venda, Freelance..." class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Valor (R$) *</label>
                    <input type="number" step="0.01" min="0.01" id="extraIncAmount" required placeholder="0.00" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500">
                </div>
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button type="button" onclick="closeExtraIncomeModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition">Cancelar</button>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20">Salvar Entrada</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExtraIncomeModal() {
    let modals = document.querySelectorAll('#extraIncomeModal');
    modals.forEach(modal => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    });
    let form = document.getElementById('extraIncomeForm');
    if (form) form.reset();
}

function saveExtraIncome(e) {
    if (e) e.preventDefault();
    
    let idInput = document.getElementById('extraIncId');
    let id = idInput ? idInput.value : '';
    let dateEl = document.getElementById('extraIncDate');
    let catEl = document.getElementById('extraIncCategory');
    let descEl = document.getElementById('extraIncDesc');
    let amountEl = document.getElementById('extraIncAmount');
    
    if (!dateEl || !descEl || !amountEl || !catEl) return;

    let dateValue = dateEl.value;
    let targetMonth = dateToMonthName(dateValue);
    let category = catEl.value.trim();
    let desc = descEl.value.trim();
    let amount = parseFloat(amountEl.value);

    if (!dateValue) {
        if (typeof showToast === 'function') showToast("Selecione a data da entrada.", "error");
        else alert("Selecione a data da entrada.");
        return;
    }

    if (!desc || typeof desc !== 'string' || desc.length < 2) {
        if (typeof showToast === 'function') showToast("A descrição deve conter um texto válido.", "error");
        else alert("A descrição deve conter um texto válido.");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        if (typeof showToast === 'function') showToast("O valor deve ser um número válido maior que zero.", "error");
        else alert("O valor deve ser um número válido maior que zero.");
        return;
    }
    
    if (typeof extraIncomes === 'undefined') window.extraIncomes = [];
    
    if (id !== '') {
        let item = extraIncomes.find(e => Number(e.id) === Number(id));
        if (item) {
            item.category = category;
            item.desc = desc;
            item.amount = amount;
            item.date = dateValue;
            item.month = targetMonth;
        }
        if (typeof showToast === 'function') showToast("Entrada atualizada com sucesso!", "success");
    } else {
        let newId = extraIncomes.length > 0 ? Math.max(...extraIncomes.map(e => Number(e.id) || 0)) + 1 : 1;
        extraIncomes.push({
            id: newId,
            date: dateValue,
            month: targetMonth,
            category,
            desc,
            amount,
            usedMonths: {}
        });
        if (typeof showToast === 'function') showToast("Entrada cadastrada com sucesso!", "success");
    }

    saveData();
    closeExtraIncomeModal();
    renderIncomesList();
    if (typeof renderApp === 'function') renderApp();
}

function deleteExtraIncome(id) {
    let doDel = () => {
        if (typeof extraIncomes !== 'undefined') {
            window.extraIncomes = extraIncomes.filter(e => Number(e.id) !== Number(id));
        }
        saveData();
        renderIncomesList();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') showToast("Entrada excluída com sucesso!", "success");
    };

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Deseja realmente excluir esta entrada?', doDel);
    } else {
        if (confirm('Deseja realmente excluir esta entrada?')) {
            doDel();
        }
    }
}

function toggleIncomeUsed(incomeId, currentMonth) {
    if (typeof extraIncomes === 'undefined') return;
    let inc = extraIncomes.find(e => Number(e.id) === Number(incomeId));
    if (inc) {
        if (!inc.usedMonths) inc.usedMonths = {};
        inc.usedMonths[currentMonth] = !inc.usedMonths[currentMonth];
        saveData();
        renderIncomesList();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') {
            showToast(inc.usedMonths[currentMonth] ? `Entrada marcada como usada em ${currentMonth}!` : `Entrada reativada.`, "success");
        }
    }
}

function getActiveIncomesForMonth(targetMonth) {
    if (typeof extraIncomes === 'undefined' || !Array.isArray(extraIncomes)) return [];

    const monthOrder = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    };

    function parseMonthYear(mStr) {
        if (!mStr) return { monthNum: 1, year: 2026 };
        let parts = mStr.split('/');
        let mName = (parts[0] || '').trim();
        let year = parseInt(parts[1]) || 2026;
        return { monthNum: monthOrder[mName] || 1, year: year };
    }

    let target = parseMonthYear(targetMonth);
    let targetIndex = target.year * 12 + target.monthNum;

    let activeIncomes = [];

    extraIncomes.forEach(inc => {
        let incMonthStr = inc.month || targetMonth;
        let incDateParsed = parseMonthYear(incMonthStr);
        let incIndex = incDateParsed.year * 12 + incDateParsed.monthNum;

        if (targetIndex >= incIndex) {
            let usedMonths = inc.usedMonths || {};
            let isUsedBeforeOrCurrent = false;

            for (let mKey in usedMonths) {
                if (usedMonths[mKey] === true) {
                    let usedParsed = parseMonthYear(mKey);
                    let usedIndex = usedParsed.year * 12 + usedParsed.monthNum;
                    if (usedIndex <= targetIndex) {
                        isUsedBeforeOrCurrent = true;
                        break;
                    }
                }
            }

            if (!isUsedBeforeOrCurrent) {
                activeIncomes.push({
                    ...inc,
                    effectiveMonth: targetMonth,
                    isPropagated: targetIndex > incIndex
                });
            }
        }
    });

    return activeIncomes;
}

function toggleSelectAllIncomes(masterCheckbox) {
    let checkboxes = document.querySelectorAll('.income-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
    });
    updateSelectedIncomesCount();
}

function updateSelectedIncomesCount() {
    let checkboxes = document.querySelectorAll('.income-checkbox:checked');
    let count = checkboxes.length;
    let btnDelete = document.getElementById('btnDeleteSelectedIncomes');
    let countSpan = document.getElementById('selectedIncomesCount');
    
    if (countSpan) countSpan.innerText = count;
    if (btnDelete) {
        if (count > 0) {
            btnDelete.classList.remove('hidden');
            btnDelete.classList.add('flex');
        } else {
            btnDelete.classList.remove('flex');
            btnDelete.classList.add('hidden');
        }
    }
}

function confirmDeleteSelectedIncomes() {
    let checkboxes = document.querySelectorAll('.income-checkbox:checked');
    if (checkboxes.length === 0) return;

    let count = checkboxes.length;

    let doBatchDel = () => {
        let idsToDelete = Array.from(checkboxes).map(cb => Number(cb.value));
        if (typeof extraIncomes !== 'undefined') {
            window.extraIncomes = extraIncomes.filter(e => !idsToDelete.includes(Number(e.id)));
        }
        saveData();
        renderIncomesList();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') showToast(`${count} entradas excluídas com sucesso!`, "success");
    };

    if (typeof showConfirmModal === 'function') {
        showConfirmModal(`Tem certeza absoluta que deseja excluir as ${count} entradas selecionadas?`, doBatchDel);
    } else {
        if (confirm(`Tem certeza absoluta que deseja excluir as ${count} entradas selecionadas?`)) {
            doBatchDel();
        }
    }
}

/**
 * Renderiza a listagem de entradas calculando separadamente Base (Salário) e Extra (Renda Extra).
 */
function renderIncomesList() {
    let month = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');

    let filterCategoryEl = document.getElementById('filterCategory');
    let selectedCategoryFilter = filterCategoryEl ? filterCategoryEl.value : '';

    let searchBoxEl = document.getElementById('searchBox');
    let searchQuery = searchBoxEl ? searchBoxEl.value.toLowerCase().trim() : '';

    let tbody = document.getElementById('extraIncomeTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (typeof extraIncomes === 'undefined') window.extraIncomes = [];
    
    extraIncomes.forEach(e => {
        if (!e.month && e.date) e.month = dateToMonthName(e.date);
        if (!e.month) e.month = month;
        if (!e.category) e.category = 'Salário';
        if (!e.usedMonths) e.usedMonths = {};
    });

    let activeExtras = getActiveIncomesForMonth(month);

    let filteredExtras = activeExtras.filter(e => {
        let matchesCategory = !selectedCategoryFilter || e.category === selectedCategoryFilter;
        let matchesSearch = !searchQuery || (e.desc && e.desc.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });
    
    // Separação correta: Salário entra como Base, e Renda Extra entra como Extra
    let baseTotal = 0;
    let extraTotal = 0;

    activeExtras.forEach(item => {
        let amt = Number(item.amount) || 0;
        if (item.category && item.category.toLowerCase().includes('salário')) {
            baseTotal += amt;
        } else {
            extraTotal += amt;
        }
    });

    let totalMonthIncomes = baseTotal + extraTotal;

    // Atualiza o card de resumo principal
    let previewEl = document.getElementById('previewSalarioLiquido');
    if (previewEl) {
        previewEl.innerText = `R$ ${totalMonthIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Atualiza a linha de detalhamento (Base | Descontos + Extra)
    let summaryDetailEl = document.getElementById('kpiSalarySubDetail') || document.querySelector('.text-xs.text-slate-400.mt-1'); 
    // Se o elemento de subtitulo existir, atualizamos seus valores dinamicamente:
    let subDetailContainer = document.querySelector('.text-xs.text-slate-400.mt-1');
    if (subDetailContainer && subDetailContainer.innerText.includes('Base R$')) {
        let totalDescontos = window.totalDescontos || 0; // se houver variável global de descontos
        subDetailContainer.innerHTML = `Base R$ ${baseTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})} | Descontos R$ ${totalDescontos.toLocaleString('pt-BR', {minimumFractionDigits: 2})} + Extra R$ ${extraTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }

    let counterEl = document.getElementById('counterSalaryItems');
    if (counterEl) {
        counterEl.innerText = `${filteredExtras.length} itens`;
    }

    let selectAllCb = document.getElementById('selectAllIncomes');
    if (selectAllCb) selectAllCb.checked = false;
    updateSelectedIncomesCount();

    if (filteredExtras.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500 italic">Nenhuma entrada ativa cadastrada para ${month}.</td></tr>`;
        return;
    }

    filteredExtras.forEach(item => {
        let badgeClass = item.category === 'Salário' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        let displayDate = item.date ? item.date.split('-').reverse().join('/') : item.month;
        
        let isUsedThisMonth = item.usedMonths && !!item.usedMonths[month];
        let originTag = item.isPropagated ? `<span class="text-[10px] text-amber-400 ml-1 block">(Original: ${item.month})</span>` : '';

        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="py-3 px-4 text-center">
                <input type="checkbox" value="${item.id}" onclick="updateSelectedIncomesCount()" class="income-checkbox rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
            </td>
            <td class="py-3 px-4 text-xs text-slate-400">${displayDate} ${originTag}</td>
            <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeClass}">${item.category}</span></td>
            <td class="py-3 px-4 font-medium text-white">${item.desc}</td>
            <td class="py-3 px-4 text-right font-semibold text-emerald-400">R$ ${Number(item.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                <button type="button" onclick="toggleIncomeUsed(${item.id}, '${month}')" class="px-2.5 py-1 rounded-lg text-xs font-medium transition ${isUsedThisMonth ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}" title="Marcar como usado neste mês">
                    ${isUsedThisMonth ? 'Usado' : 'Disponível'}
                </button>
                <button type="button" onclick="openExtraIncomeModal(${item.id})" class="p-1 hover:text-indigo-400 text-slate-400 transition" title="Editar"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                <button type="button" onclick="deleteExtraIncome(${item.id})" class="p-1 hover:text-rose-400 text-slate-400 transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Aliases de compatibilidade
function renderExtraIncomes() { renderIncomesList(); }
function saveSalaryConfig(e) { if (e) e.preventDefault(); }
function deleteSalaryConfig() {}

// ================= EXPOSIÇÃO GLOBAL =================
window.openExtraIncomeModal = openExtraIncomeModal;
window.closeExtraIncomeModal = closeExtraIncomeModal;
window.saveExtraIncome = saveExtraIncome;
window.deleteExtraIncome = deleteExtraIncome;
window.renderExtraIncomes = renderExtraIncomes;
window.renderIncomesList = renderIncomesList;
window.loadSalaryConfig = loadSalaryConfig;
window.initSalaryTab = initSalaryTab;
window.toggleSelectAllIncomes = toggleSelectAllIncomes;
window.updateSelectedIncomesCount = updateSelectedIncomesCount;
window.confirmDeleteSelectedIncomes = confirmDeleteSelectedIncomes;
window.adjustGlobalCategoryFilterForSalary = adjustGlobalCategoryFilterForSalary;
window.getActiveIncomesForMonth = getActiveIncomesForMonth;
window.toggleIncomeUsed = toggleIncomeUsed;
